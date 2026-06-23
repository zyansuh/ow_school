'use client';

import { Button } from '@/components/ui/button';
import { Input, Label, Textarea, Select } from '@/components/ui/input';
import { TeacherActivityFields } from '@/components/teacher/teacher-activity-fields';
import type { TeacherFormState } from '@/hooks/admin/use-admin-teachers';
import type { ClassItem } from '@/hooks/admin/use-admin-teachers';

type Props = {
  editing: string | null;
  form: TeacherFormState;
  classes: ClassItem[];
  onChange: (form: TeacherFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
};

export function TeacherFormCard({ editing, form, classes, onChange, onSubmit, onCancel }: Props) {
  return (
    <form onSubmit={onSubmit} className="card-pad space-y-4">
      <h2 className="font-semibold">{editing ? '수정' : '새 선생님'}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>이름 *</Label>
          <Input required value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className="mt-2" />
        </div>
        <div>
          <Label>반 *</Label>
          <Select required value={form.classId} onChange={(e) => onChange({ ...form, classId: e.target.value })} className="mt-2">
            <option value="">선택</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div>
          <Label>MBTI</Label>
          <Input value={form.mbti} onChange={(e) => onChange({ ...form, mbti: e.target.value })} className="mt-2" />
        </div>
        <div>
          <Label>디스코드 유저명</Label>
          <Input value={form.discord} onChange={(e) => onChange({ ...form, discord: e.target.value })} className="mt-2" />
        </div>
        <div className="sm:col-span-2">
          <Label>Discord User ID *</Label>
          <Input
            value={form.discordUserId}
            onChange={(e) => onChange({ ...form, discordUserId: e.target.value })}
            placeholder="숫자 Discord ID (권장)"
            className="mt-2 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">닉 변경에도 유지되는 고유 식별자입니다</p>
        </div>
        <div>
          <Label>프로필 이미지 URL</Label>
          <Input value={form.profileImage} onChange={(e) => onChange({ ...form, profileImage: e.target.value })} className="mt-2" />
        </div>
        <div>
          <Label>최대 인원</Label>
          <Input type="number" value={form.maxStudents} onChange={(e) => onChange({ ...form, maxStudents: Number(e.target.value) })} className="mt-2" />
        </div>
      </div>
      <div>
        <Label>소개</Label>
        <Textarea value={form.intro} onChange={(e) => onChange({ ...form, intro: e.target.value })} className="mt-2" />
      </div>
      <TeacherActivityFields
        activityDays={form.activityDays}
        activityTimeSlot={form.activityTimeSlot}
        onChange={({ activityDays, activityTimeSlot }) => onChange({ ...form, activityDays, activityTimeSlot })}
      />
      <div className="flex gap-2">
        <Button type="submit">저장</Button>
        <Button type="button" variant="outline" onClick={onCancel}>취소</Button>
      </div>
    </form>
  );
}
