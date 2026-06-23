'use client';

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
import { MBTI_TYPES } from '@/lib/mbti';
import { cn } from '@/lib/utils';
import { DiscordUserSearch } from '@/components/admin/discord-user-search';
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
  const toggleClass = (classId: string) => {
    const next = form.classIds.includes(classId)
      ? form.classIds.filter((id) => id !== classId)
      : [...form.classIds, classId];
    onChange({ ...form, classIds: next, classId: next[0] ?? '' });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>{editing ? '선생님 수정' : '새 선생님 등록'}</DialogTitle>
          <DialogDescription>
            담당 반은 여러 개 선택할 수 있습니다. 저장 시 DB에 즉시 반영됩니다.
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
              <Field label="디스코드 유저명">
                <Input
                  value={form.discord}
                  onChange={(e) => onChange({ ...form, discord: e.target.value })}
                  placeholder="@username"
                />
              </Field>
              <Field label="최대 인원">
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={form.maxStudents}
                  onChange={(e) => onChange({ ...form, maxStudents: Number(e.target.value) })}
                />
              </Field>
            </div>

            <Field label="Discord 계정 연결" hint="로그인한 유저를 검색해 User ID를 자동 입력하세요.">
              <DiscordUserSearch
                selectedDiscordId={form.discordUserId || undefined}
                onSelect={(u) =>
                  onChange({
                    ...form,
                    discordUserId: u.discordId,
                    discord: u.discordUsername,
                  })
                }
              />
            </Field>

            <Field label="Discord User ID" hint="닉 변경에도 유지되는 고유 ID. 비워두면 미연결 상태로 저장됩니다.">
              <Input
                value={form.discordUserId}
                onChange={(e) => onChange({ ...form, discordUserId: e.target.value })}
                placeholder="예: 123456789012345678"
                className="font-mono text-sm"
              />
            </Field>

            <Field label="프로필 이미지 URL">
              <Input
                value={form.profileImage}
                onChange={(e) => onChange({ ...form, profileImage: e.target.value })}
                placeholder="https://..."
              />
            </Field>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">담당 반 *</h3>
            <p className="text-xs text-muted-foreground">복수 선택 가능 · 첫 번째 반이 주 담당 반으로 표시됩니다</p>
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
            {form.classIds.length === 0 && (
              <p className="text-xs text-danger">담당 반을 1개 이상 선택하세요</p>
            )}
          </section>

          <section className="space-y-3">
            <Field label="소개">
              <Textarea
                value={form.intro}
                onChange={(e) => onChange({ ...form, intro: e.target.value })}
                className="min-h-[120px]"
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
