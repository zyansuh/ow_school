'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { signInWithDiscord } from '@/hooks/auth/use-discord-sign-in';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Textarea, Select, Input } from '@/components/ui/input';
import { LoadingPage } from '@/components/ui/loading';
import { toast } from 'sonner';
import { resolveDisplayName } from '@/lib/users/display';
import { GraduationReviewFab } from '@/components/interview/graduation-review-fab';
import { ds } from '@/styles/design-system';
import { CLUB_POINT, CLUB_RECOMMENDATION_URL, formatPoint, GRADUATION_POINT } from '@/lib/points';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type MeData = {
  discordId?: string;
  displayName?: string;
  discordUsername?: string;
  discordServerNick?: string | null;
  discordNickname?: string | null;
  class?: { name: string } | null;
  teacher?: { name: string } | null;
  applications?: Array<{ class?: { name: string } | null; status: string; teacher?: { name: string } }>;
};

type ExistingInterview = {
  id: string;
  contentExperience: string;
  memorablePerson: string;
  joinedClub: boolean;
  clubNames?: string | null;
};

function parseClubNames(raw: string | null | undefined): string[] {
  if (!raw) return [''];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [''];
  } catch {
    return [''];
  }
}

function resolveClassName(me: MeData | null): string {
  if (!me) return '—';
  if (me.class?.name) return me.class.name;
  const approved = me.applications?.find((a) => a.status === 'approved');
  return approved?.class?.name ?? '미배정';
}

function resolveTeacherName(me: MeData | null): string {
  if (!me) return '—';
  if (me.teacher?.name) return me.teacher.name;
  const approved = me.applications?.find((a) => a.status === 'approved');
  return approved?.teacher?.name ?? '미배정';
}

function InfoTile({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border/80 bg-surface/50 px-4 py-3 min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">{label}</p>
      <p
        className={cn(
          'text-sm font-semibold text-foreground leading-snug',
          mono && 'font-mono text-xs break-all',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function QuestionBlock({
  number,
  title,
  hint,
  children,
}: {
  number: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface/30 p-5 sm:p-6 space-y-4">
      <div className="space-y-2">
        <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
          질문 {number}
        </span>
        <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed">{title}</p>
        {hint && <p className="text-sm text-muted-foreground leading-relaxed">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export default function InterviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<MeData | null>(null);
  const [meReady, setMeReady] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    contentExperience: '',
    memorablePerson: '',
    joinedClub: 'no' as 'yes' | 'no',
    clubNames: [''],
  });

  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch('/api/me').then((r) => r.json()),
      fetch('/api/interviews/mine').then((r) => r.json()),
    ]).then(([meData, interview]) => {
      if (meData && !meData.error) setMe(meData);
      if (interview && interview.id) {
        const existing = interview as ExistingInterview;
        setEditId(existing.id);
        setForm({
          contentExperience: existing.contentExperience,
          memorablePerson: existing.memorablePerson,
          joinedClub: existing.joinedClub ? 'yes' : 'no',
          clubNames: parseClubNames(existing.clubNames),
        });
      }
      setMeReady(true);
    });
  }, [session]);

  if (status === 'loading' || (session && !meReady)) return <MainLayout><LoadingPage /></MainLayout>;

  if (!session) {
    return (
      <MainLayout>
        <div className="page-container py-20 text-center space-y-4">
          <p className="text-gray-400">졸업면담은 로그인 후 작성할 수 있습니다</p>
          <Button onClick={() => void signInWithDiscord('/interview')}>Discord 로그인</Button>
        </div>
      </MainLayout>
    );
  }

  const authorName = me
    ? resolveDisplayName({
        discordUsername: me.discordUsername ?? '',
        discordServerNick: me.discordServerNick,
        discordNickname: me.discordNickname,
      })
    : '—';

  const authorDiscordId = me?.discordId ?? session.user.discordId ?? '—';

  const addClubField = () => {
    if (form.clubNames.length >= 3) return;
    setForm({ ...form, clubNames: [...form.clubNames, ''] });
  };

  const updateClubName = (index: number, value: string) => {
    const next = [...form.clubNames];
    next[index] = value;
    setForm({ ...form, clubNames: next });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const joinedClub = form.joinedClub === 'yes';
      const clubNames = joinedClub
        ? form.clubNames.map((n) => n.trim()).filter(Boolean)
        : [];

      const payload = {
        contentExperience: form.contentExperience,
        memorablePerson: form.memorablePerson,
        joinedClub,
        clubNames: joinedClub ? clubNames : undefined,
      };

      const res = await fetch(editId ? `/api/interviews/${editId}` : '/api/interviews', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (editId) {
        toast.success('졸업면담이 수정되었습니다');
      } else {
        const total = (data.pointsAwarded?.graduation ?? 0) + (data.pointsAwarded?.club ?? 0);
        toast.success(`졸업면담이 제출되었습니다. ${formatPoint(total)} 지급!`);
      }
      router.push('/mypage');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <GraduationReviewFab />
      <div className="page-container py-8 sm:py-12 section-gap">
        <h1 className={ds.title}>
          {editId ? '졸업면담 수정' : '졸업면담'}
        </h1>

        <Card className={`${ds.card} max-w-2xl mx-auto overflow-hidden`}>
          <div className={`${ds.cardPad} border-b border-border space-y-4`}>
            <p className="text-sm text-muted-foreground">작성자 정보는 자동으로 채워집니다.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoTile label="작성자" value={authorName} />
              <InfoTile label="반" value={resolveClassName(me)} />
              <InfoTile label="담당 선생님" value={resolveTeacherName(me)} />
              <InfoTile label="Discord User ID" value={authorDiscordId} mono />
            </div>
          </div>

          <form onSubmit={handleSubmit} className={`${ds.cardPad} space-y-5`}>
            <QuestionBlock
              number={1}
              title="평겜마 콘텐츠를 참여하신 경험이 있으실까요? 참여하셨다면 느낀점이 있으실까요?"
              hint="예) 일반내전, 공식내전, 천타온, 옵스나이트 등"
            >
              <Textarea
                required
                value={form.contentExperience}
                onChange={(e) => setForm({ ...form, contentExperience: e.target.value })}
                placeholder="경험과 느낀점을 자유롭게 적어 주세요"
                className="min-h-[120px] bg-background"
              />
            </QuestionBlock>

            <QuestionBlock
              number={2}
              title="최근 함께한 사람 중 인상 깊거나 좋았던 분이 있으실까요?"
              hint="담당 선생님은 제외해 주세요."
            >
              <Textarea
                required
                value={form.memorablePerson}
                onChange={(e) => setForm({ ...form, memorablePerson: e.target.value })}
                placeholder="인상 깊었던 분과 이유를 적어 주세요"
                className="min-h-[120px] bg-background"
              />
            </QuestionBlock>

            <QuestionBlock
              number={3}
              title="동호회에 가입하셨나요?"
            >
              <div className="space-y-3">
                <Select
                  required
                  value={form.joinedClub}
                  onChange={(e) => setForm({ ...form, joinedClub: e.target.value as 'yes' | 'no', clubNames: [''] })}
                  className="max-w-xs bg-background"
                >
                  <option value="no">아니오</option>
                  <option value="yes">예</option>
                </Select>

                <p className="text-sm text-muted-foreground">
                  동호회를 찾고 계신가요?{' '}
                  <a
                    href={CLUB_RECOMMENDATION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    동호회 추천 채널 바로가기
                  </a>
                </p>

                {form.joinedClub === 'yes' && (
                  <div className="space-y-3 pt-1">
                    {form.clubNames.map((name, i) => (
                      <div key={i}>
                        <Label className="text-xs text-muted-foreground">동호회명 {i + 1}</Label>
                        <Input
                          required
                          value={name}
                          onChange={(e) => updateClubName(i, e.target.value)}
                          placeholder="동호회명 입력"
                          className="mt-1.5 bg-background"
                        />
                      </div>
                    ))}
                    {form.clubNames.length < 3 && (
                      <Button type="button" variant="outline" size="sm" onClick={addClubField}>
                        <Plus className="h-4 w-4" /> 동호회 추가
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </QuestionBlock>

            {!editId && (
              <Card className="bg-primary/5 border-primary/25">
                <div className="card-pad space-y-2 text-sm">
                  <h3 className="font-semibold text-foreground">제출 시 포인트 안내</h3>
                  <div className="text-muted-foreground space-y-1">
                    <p>졸업 포인트 {formatPoint(GRADUATION_POINT)}</p>
                    <p>동호회 가입 시 추가 {formatPoint(CLUB_POINT)}</p>
                    <p className="text-foreground font-medium pt-1">
                      최대 {formatPoint(GRADUATION_POINT + CLUB_POINT)} 지급
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? '저장 중...' : editId ? '수정하기' : '제출하기'}
            </Button>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
}
