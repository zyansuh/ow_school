'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/loading';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { ds } from '@/styles/design-system';
import {
  emptyTeacherForm,
  parseActivityDays,
  useAdminTeachers,
  type TeacherFormState,
  type AdminTeacher,
} from '@/hooks/admin/use-admin-teachers';
import { TeacherFormDialog } from '@/components/admin/teachers/teacher-form-dialog';
import { LoadingSpinner } from '@/components/ui/loading';

function classLabels(t: AdminTeacher) {
  const names = t.classes?.map((c) => c.name) ?? [t.class.name];
  return names;
}

export default function AdminTeachersPage() {
  const { teachers, classes, loading, saving, deletingId, save, remove, toggleActive } = useAdminTeachers();
  const [form, setForm] = useState<TeacherFormState>(emptyTeacherForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyTeacherForm);
    setFormOpen(true);
  };

  const openEdit = (t: AdminTeacher) => {
    const classIds = t.classIds?.length ? t.classIds : [t.classId];
    setEditing(t.id);
    setForm({
      name: t.name,
      mbti: t.mbti || '',
      gender: t.gender || '',
      region: t.region || '',
      birthYear: t.birthYear != null ? String(t.birthYear) : '',
      intro: t.intro || '',
      discord: t.discord || '',
      discordUserId: t.discordUserId || '',
      classId: classIds[0] ?? t.classId,
      classIds,
      maxStudents: t.maxStudents,
      isActive: t.isActive,
      activityDays: parseActivityDays(t.activityDays),
      activityTimeSlot: t.activityTimeSlot || '',
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setForm(emptyTeacherForm);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await save(editing, form);
    if (ok) closeForm();
  };

  const busy = deletingId !== null || saving;

  return (
    <div className={ds.pageGap}>
      <AdminPageHeader
        title="선생님 관리"
        description="선생님 등록·수정 및 활동 상태를 관리합니다. 한 선생님이 여러 반을 담당할 수 있습니다."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> 추가
          </Button>
        }
      />

      <TeacherFormDialog
        open={formOpen}
        editing={editing}
        form={form}
        classes={classes}
        saving={saving}
        onChange={setForm}
        onSubmit={handleSave}
        onClose={closeForm}
      />

      {loading ? (
        <SkeletonTable rows={5} />
      ) : teachers.length === 0 ? (
        <EmptyState title="선생님이 없습니다" description="「추가」 버튼으로 선생님을 등록하세요." />
      ) : (
        <DataTable
          data={teachers}
          keyExtractor={(t) => t.id}
          emptyTitle="선생님이 없습니다"
          columns={[
            { key: 'name', header: '이름', cell: (t) => <span className="font-medium">{t.name}</span> },
            {
              key: 'class',
              header: '담당 반',
              cell: (t) => (
                <div className="flex flex-wrap gap-1">
                  {classLabels(t).map((name) => (
                    <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
                  ))}
                </div>
              ),
            },
            { key: 'mbti', header: 'MBTI', cell: (t) => t.mbti || '-', hideOnMobile: true },
            { key: 'count', header: '인원', cell: (t) => `${t.currentStudents}/${t.maxStudents}` },
            {
              key: 'discord',
              header: 'Discord ID',
              cell: (t) =>
                t.discordUserId ? (
                  <Badge variant="success" className="font-mono text-[10px]">{t.discordUserId.slice(0, 8)}…</Badge>
                ) : (
                  <Badge variant="warning">미연결</Badge>
                ),
              hideOnMobile: true,
            },
            {
              key: 'status',
              header: '상태',
              cell: (t) => <Badge variant={t.isActive ? 'success' : 'danger'}>{t.isActive ? '활동' : '비활성'}</Badge>,
            },
            {
              key: 'action',
              header: '관리',
              mobileFooter: true,
              cell: (t) => {
                const isDeleting = deletingId === t.id;
                return (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => openEdit(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                      수정
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => void toggleActive(t)}>
                      {t.isActive ? '비활성' : '활성'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        const extra =
                          t.currentStudents > 0
                            ? `\n담당 학생 ${t.currentStudents}명은 미배정으로 전환됩니다.`
                            : '';
                        if (!confirm(`이 선생님을 삭제하시겠습니까?${extra}`)) return;
                        void remove(t.id);
                      }}
                      className="text-danger border-danger/30"
                    >
                      {isDeleting ? <LoadingSpinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                      삭제
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      )}
    </div>
  );
}
