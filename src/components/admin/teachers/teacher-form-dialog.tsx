'use client';

import { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea, Select } from '@/components/ui/input';
import { TeacherActivityFields } from '@/components/teacher/teacher-activity-fields';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { MBTI_TYPES } from '@/lib/utils/mbti';
import {
  TEACHER_BIRTH_YEARS,
  TEACHER_GENDER_OPTIONS,
} from '@/lib/teacher/profile';
import { cn } from '@/lib/utils';
import { isDiscordSnowflake } from '@/lib/discord/id';
import {
  DiscordUserSearch,
  DiscordUserIdLookup,
  type DiscordSearchUser,
  type DiscordIdLookupResult,
} from '@/components/admin/discord-user-search';
import type { TeacherFormState, ClassItem } from '@/hooks/admin/use-admin-teachers';

type Props = {
  open: boolean;
  editing: string | null;
  form: TeacherFormState;
  classes: ClassItem[];
  saving: boolean;
  onChange: (form: TeacherFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
};

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
    </div>
  );
}

/** 대상 유저 lookup 결과만 discord 필드에 반영 (운영자 세션 미사용) */
function applyTargetDiscordLabel(
  current: TeacherFormState,
  targetUserId: string,
  discordLabel: string | null,
): TeacherFormState {
  if (current.discordUserId.trim() !== targetUserId.trim()) {
    return current;
  }
  if (!discordLabel || isDiscordSnowflake(discordLabel)) {
    return current;
  }
  return { ...current, discord: discordLabel };
}

export function TeacherFormDialog({
  open,
  editing,
  form,
  classes,
  saving,
  onChange,
  onSubmit,
  onClose,
}: Props) {
  const formRef = useRef(form);
  formRef.current = form;

  const toggleClass = (classId: string) => {
    const next = form.classIds.includes(classId)
      ? form.classIds.filter((id) => id !== classId)
      : [...form.classIds, classId];
    onChange({ ...form, classIds: next, classId: next[0] ?? '' });
  };

  const applyDiscordUser = useCallback(
    (user: DiscordSearchUser) => {
      const label = user.serverNickname?.trim() || user.discordLabel?.trim();
      onChange({
        ...formRef.current,
        discordUserId: user.discordId,
        discord: label && !isDiscordSnowflake(label) ? label : '',
      });
    },
    [onChange],
  );

  const onIdLookupResolved = useCallback(
    (payload: DiscordIdLookupResult) => {
      onChange(
        applyTargetDiscordLabel(
          formRef.current,
          payload.discordId,
          payload.discordLabel,
        ),
      );
    },
    [onChange],
  );

  const onDiscordUserIdChange = (raw: string) => {
    const next: TeacherFormState = { ...form, discordUserId: raw };
    if (!isDiscordSnowflake(raw.trim())) {
      next.discord = '';
    }
    onChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>{editing ? '선생님 수정' : '새 선생님 등록'}</DialogTitle>
          <DialogDescription>
            담당 반은 여러 개 선택할 수 있습니다. Discord 정보는 검색·ID로 선택한 대상 유저 기준입니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="px-6 py-6 space-y-8">
          <section className="space-y-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">기본 정보</h3>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="이름 *">
                <Input
                  required
                  value={form.name}
                  onChange={(e) => onChange({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label="MBTI">
                <Select
                  value={form.mbti}
                  onChange={(e) => onChange({ ...form, mbti: e.target.value })}
                >
                  <option value="">선택 안 함</option>
                  {MBTI_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </Field>
              <Field
                label="디스코드 서버 닉네임"
                hint="개인 계정명이 아닌, 해당 서버에서 표시되는 닉네임이 저장됩니다. 대상 유저 선택·ID 조회 시 자동 입력됩니다."
              >
                <Input
                  value={form.discord}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (isDiscordSnowflake(v.trim())) return;
                    onChange({ ...form, discord: v });
                  }}
                  placeholder="서버 닉네임 (없으면 글로벌 닉·username)"
                />
              </Field>
              <Field label="최대 인원" hint="0명이면 모집 마감으로 표시됩니다">
                <Input
                  type="number"
                  min={0}
                  max={99}
                  value={form.maxStudents}
                  onChange={(e) => onChange({ ...form, maxStudents: Math.max(0, Number(e.target.value) || 0) })}
                />
              </Field>
            </div>

            <Field label="Discord 계정 연결" hint="등록할 대상 유저를 검색해 선택하세요. 운영자 본인 정보는 자동 입력되지 않습니다.">
              <DiscordUserSearch
                selectedDiscordId={form.discordUserId || undefined}
                selectedDiscordLabel={form.discord || null}
                onSelect={applyDiscordUser}
              />
            </Field>

            <Field label="Discord User ID" hint="대상 유저의 Discord User ID만 입력하세요.">
              <Input
                value={form.discordUserId}
                onChange={(e) => onDiscordUserIdChange(e.target.value)}
                placeholder="예: 123456789012345678"
                className="font-mono text-sm"
              />
              <DiscordUserIdLookup
                discordUserId={form.discordUserId}
                onResolved={onIdLookupResolved}
              />
            </Field>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">담당 반 *</h3>
            <p className="text-xs text-muted-foreground">복수 선택 가능 · 첫 번째 반이 주 담당 반으로 표시됩니다</p>
            {classes.length === 0 ? (
              <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                반 목록을 불러오지 못했습니다. 페이지를 새로고침하거나, 터미널에서{' '}
                <code className="text-xs">npm run db:seed</code> 로 반 데이터를 넣어 주세요.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {classes.map((c) => {
                  const selected = form.classIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleClass(c.id)}
                      className={cn(
                        'px-4 py-2 rounded-xl text-sm border transition-colors min-h-10',
                        selected
                          ? 'border-primary/50 bg-primary/15 text-primary font-medium'
                          : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-accent',
                      )}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}
            {classes.length > 0 && form.classIds.length === 0 && (
              <p className="text-xs text-danger">담당 반을 1개 이상 선택하세요</p>
            )}
          </section>

          <section className="space-y-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">선생님 소개</h3>
            <div className="grid sm:grid-cols-3 gap-5">
              <Field label="성별">
                <Select
                  value={form.gender}
                  onChange={(e) => onChange({ ...form, gender: e.target.value })}
                >
                  {TEACHER_GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value || 'none'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="지역">
                <Input
                  value={form.region}
                  onChange={(e) => onChange({ ...form, region: e.target.value })}
                  placeholder="예: 서울, 부산"
                />
              </Field>
              <Field label="연도">
                <Select
                  value={form.birthYear}
                  onChange={(e) => onChange({ ...form, birthYear: e.target.value })}
                >
                  <option value="">선택 안 함</option>
                  {TEACHER_BIRTH_YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}년생
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="소개 글">
              <Textarea
                value={form.intro}
                onChange={(e) => onChange({ ...form, intro: e.target.value })}
                className="min-h-[120px]"
                placeholder="선생님 소개를 입력하세요"
              />
            </Field>
          </section>

          <section className="pt-2 border-t border-border">
            <TeacherActivityFields
              activityDays={form.activityDays}
              activityTimeSlot={form.activityTimeSlot}
              onChange={({ activityDays, activityTimeSlot }) =>
                onChange({ ...form, activityDays, activityTimeSlot })
              }
            />
          </section>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" className="sm:min-w-[88px]" onClick={onClose} disabled={saving}>
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              className="sm:min-w-[88px]"
              disabled={saving || form.classIds.length === 0}
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
