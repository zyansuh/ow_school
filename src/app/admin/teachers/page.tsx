'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/loading';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { ds } from '@/styles/design-system';
import {
  emptyTeacherForm,
  parseActivityDays,
  useAdminTeachers,
  type TeacherFormState,
  type AdminTeacher,
} from '@/hooks/admin/use-admin-teachers';
import { TeacherFormCard } from '@/components/admin/teachers/teacher-form';
import { Pencil, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading';

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

  const busy = deletingId !== null;

  return (
    <div className={ds.pageGap}>
      <AdminPageHeader
        title="선생님 관리"
        description="선생님 등록·수정 및 활동 상태를 관리합니다."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> 추가
          </Button>
        }
      />

      {showForm && (
        <Card className={`${ds.card} ${ds.cardPad}`}>
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

      {loading ? (
        <SkeletonTable rows={5} />
      ) : teachers.length === 0 ? (
        <EmptyState title="선생님이 없습니다" />
      ) : (
        <DataTable
          data={teachers}
          keyExtractor={(t) => t.id}
          emptyTitle="선생님이 없습니다"
          columns={[
            { key: 'name', header: '이름', cell: (t) => <span className="font-medium">{t.name}</span> },
            { key: 'class', header: '반', cell: (t) => t.class.name },
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
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => void toggleActive(t)}>
                      {t.isActive ? '비활성' : '활성'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => {
                        const extra =
                          t.currentStudents > 0
                            ? `\n담당 학생 ${t.currentStudents}명은 미배정으로 전환됩니다.`
                            : '';
                        if (!confirm(`이 선생님을 삭제하시겠습니까?${extra}`)) return;
                        void remove(t.id);
                      }}
                      className="min-w-[2rem]"
                    >
                      {isDeleting ? (
                        <LoadingSpinner className="h-4 w-4 text-danger" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-danger" />
                      )}
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
