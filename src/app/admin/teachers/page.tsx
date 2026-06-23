'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { Plus } from 'lucide-react';
import { adminStyles } from '@/styles/admin';
import {
  emptyTeacherForm,
  parseActivityDays,
  useAdminTeachers,
  type TeacherFormState,
  type AdminTeacher,
} from '@/hooks/admin/use-admin-teachers';
import { TeacherFormCard } from '@/components/admin/teachers/teacher-form';
import { TeacherTable } from '@/components/admin/teachers/teacher-table';

export default function AdminTeachersPage() {
  const { teachers, classes, loading, deletingId, save, remove, toggleActive } = useAdminTeachers();
  const [form, setForm] = useState<TeacherFormState>(emptyTeacherForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyTeacherForm);
    setShowForm(true);
  };

  const openEdit = (t: AdminTeacher) => {
    setEditing(t.id);
    setForm({
      name: t.name,
      profileImage: t.profileImage || '',
      mbti: t.mbti || '',
      intro: t.intro || '',
      discord: t.discord || '',
      discordUserId: t.discordUserId || '',
      classId: t.classId,
      maxStudents: t.maxStudents,
      isActive: t.isActive,
      activityDays: parseActivityDays(t.activityDays),
      activityTimeSlot: t.activityTimeSlot || '',
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await save(editing, form);
    if (ok) {
      setShowForm(false);
      setEditing(null);
      setForm(emptyTeacherForm);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">선생님 관리</h1>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> 추가</Button>
      </div>

      {showForm && (
        <Card className={adminStyles.card}>
          <TeacherFormCard
            editing={editing}
            form={form}
            classes={classes}
            onChange={setForm}
            onSubmit={handleSave}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      {teachers.length === 0 ? (
        <EmptyState title="선생님이 없습니다" />
      ) : (
        <Card className={`${adminStyles.card} overflow-x-auto`}>
          <TeacherTable
            teachers={teachers}
            deletingId={deletingId}
            onEdit={openEdit}
            onToggleActive={toggleActive}
            onRemove={(id) => {
              const t = teachers.find((x) => x.id === id);
              const extra =
                t && t.currentStudents > 0
                  ? `\n담당 학생 ${t.currentStudents}명은 미배정으로 전환됩니다.`
                  : '';
              if (!confirm(`이 선생님을 삭제하시겠습니까?${extra}`)) return;
              void remove(id);
            }}
          />
        </Card>
      )}
    </div>
  );
}
