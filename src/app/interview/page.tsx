'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { signInWithDiscord } from '@/hooks/use-discord-sign-in';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Textarea, Select, Input } from '@/components/ui/input';
import { LoadingPage } from '@/components/ui/loading';
import { toast } from 'sonner';
import { resolveDisplayName } from '@/lib/user-display';
import { GraduationReviewFab } from '@/components/interview/graduation-review-fab';
import { ds } from '@/styles/design-system';
import { CLUB_POINT, CLUB_RECOMMENDATION_URL, formatPoint, GRADUATION_POINT } from '@/lib/points';
import { Plus } from 'lucide-react';

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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-subtle text-xs mb-1">{label}</p>
      <p className="text-foreground text-sm font-medium">{value}</p>
    </div>
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

        <Card className={`${ds.card} max-w-lg mx-auto`}>
          <div className={`${ds.cardPad} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-border`}>
            <ReadOnlyField label="작성자" value={authorName} />
            <ReadOnlyField label="Discord User ID" value={authorDiscordId} />
            <ReadOnlyField label="담당 선생님" value={resolveTeacherName(me)} />
            <ReadOnlyField label="반" value={resolveClassName(me)} />
          </div>

          <form onSubmit={handleSubmit} className={`${ds.cardPad} space-y-6`}>
            <div>
              <Label>질문 1</Label>
              <p className="text-sm text-gray-300 mt-2 mb-1">
                평겜마 콘텐츠를 참여하신 경험이 있으실까요?
                <br />
                참여하셨다면 느낀점이 있으실까요?
              </p>
              <p className="text-xs text-gray-500 mb-2">ex) 일반내전, 공식내전, 천타온, 옵스나이트 등</p>
              <Textarea
                required
                value={form.contentExperience}
                onChange={(e) => setForm({ ...form, contentExperience: e.target.value })}
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label>질문 2</Label>
              <p className="text-sm text-gray-300 mt-2 mb-1">
                최근 함께한 사람 중 인상 깊거나 좋았던 분이 있으실까요?
              </p>
              <p className="text-xs text-gray-500 mb-2">*담당선생님 제외*</p>
              <Textarea
                required
                value={form.memorablePerson}
                onChange={(e) => setForm({ ...form, memorablePerson: e.target.value })}
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label>질문 3 · 동호회 가입 여부</Label>
              <Select
                required
                value={form.joinedClub}
                onChange={(e) => setForm({ ...form, joinedClub: e.target.value as 'yes' | 'no', clubNames: [''] })}
                className="mt-2"
              >
                <option value="no">아니오</option>
                <option value="yes">예</option>
              </Select>

              <p className="text-xs text-gray-500 mt-2">
                동호회를 찾고 계신가요?{' '}
                <a
                  href={CLUB_RECOMMENDATION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  동호회 추천 채널 바로가기
                </a>
              </p>

              {form.joinedClub === 'yes' && (
                <div className="mt-4 space-y-3">
                  {form.clubNames.map((name, i) => (
                    <div key={i}>
                      <Label>동호회명 {i + 1}</Label>
                      <Input
                        required
                        value={name}
                        onChange={(e) => updateClubName(i, e.target.value)}
                        placeholder="동호회명 입력"
                        className="mt-2"
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

            {!editId && (
              <Card className="bg-purple-950/40 border-purple-500/30">
                <div className="card-pad space-y-3 text-sm">
                  <h3 className="font-semibold text-purple-200">동호회 가입 시 추가 포인트!</h3>
                  <div className="text-gray-300 space-y-1">
                    <p>졸업 포인트 {formatPoint(GRADUATION_POINT)}</p>
                    <p>+ 동호회 가입 포인트 {formatPoint(CLUB_POINT)}</p>
                    <p className="text-purple-300 font-medium pt-1">
                      = 총 {formatPoint(GRADUATION_POINT + CLUB_POINT)} 지급
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
