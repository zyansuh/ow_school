'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/loading';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { ds } from '@/styles/design-system';
import { cn } from '@/lib/utils';
import {
  emptyTeacherForm,
  parseActivityDays,
  useAdminTeachers,
  type TeacherFormState,
  type AdminTeacher,
} from '@/hooks/admin/use-admin-teachers';
import { TeacherFormDialog } from '@/components/admin/teachers/teacher-form-dialog';
import { LoadingSpinner } from '@/components/ui/loading';
import { AdminSavedViewsBar } from '@/components/admin/admin-saved-views-bar';
import { AdminClassFilterBar } from '@/components/admin/admin-class-filter-bar';
import { useAdminClassFilter } from '@/hooks/admin/use-admin-class-filter';
import { ADMIN_CLASS_ALL, matchesClassFilter } from '@/lib/admin/class-filter';

function classLabels(t: AdminTeacher) {
  const names = t.classes?.map((c) => c.name) ?? [t.class.name];
  return names;
}

type TeacherViewFilter = 'all' | 'nearFull' | 'inactive';

function isNearFull(t: AdminTeacher) {
  if (!t.isActive || t.maxStudents <= 0) return false;
  const remaining = t.maxStudents - t.currentStudents;
  return remaining <= 1 && remaining >= 0;
}

export default function AdminTeachersPage() {
  return (
    <Suspense
      fallback={
        <div className={ds.pageGap}>
          <AdminPageHeader title="선생님 관리" description="불러오는 중…" />
          <SkeletonTable rows={5} />
        </div>
      }
    >
      <AdminTeachersInner />
    </Suspense>
  );
}

function AdminTeachersInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { classFilter } = useAdminClassFilter();
  const viewFilter: TeacherViewFilter = searchParams.get('nearFull')
    ? 'nearFull'
    : searchParams.get('inactive')
      ? 'inactive'
      : 'all';

  const setViewFilter = (v: TeacherViewFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('nearFull');
    params.delete('inactive');
    if (v === 'nearFull') params.set('nearFull', '1');
    if (v === 'inactive') params.set('inactive', '1');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const { teachers, classes, loading, saving, deletingId, save, remove, toggleActive } =
    useAdminTeachers();
  const [form, setForm] = useState<TeacherFormState>(emptyTeacherForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [opsNotes, setOpsNotes] = useState<Record<string, string>>({});
  const [classNotes, setClassNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/admin/ops-notes')
      .then((r) => r.json())
      .then((d) => {
        setOpsNotes(d.teachers ?? {});
        setClassNotes(d.classes ?? {});
      })
      .catch(() => undefined);
  }, []);

  const filtered = useMemo(() => {
    let list = teachers;
    if (viewFilter === 'nearFull') list = list.filter(isNearFull);
    if (viewFilter === 'inactive') list = list.filter((t) => !t.isActive);
    if (classFilter !== ADMIN_CLASS_ALL) {
      list = list.filter((t) =>
        classLabels(t).some((name) => matchesClassFilter(name, classFilter)),
      );
    }
    return list;
  }, [teachers, viewFilter, classFilter]);

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

  const VIEW_FILTERS: { value: TeacherViewFilter; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'nearFull', label: '정원 임박' },
    { value: 'inactive', label: '비활성' },
  ];

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

      <AdminClassFilterBar className="mb-3" />
      <div className="flex flex-wrap gap-2 mb-4">
        {VIEW_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setViewFilter(f.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm transition-colors min-h-10',
              viewFilter === f.value
                ? 'bg-primary/15 text-primary font-medium'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <AdminSavedViewsBar className="mb-4" saveBasePath="/admin/teachers" />

      {classFilter !== ADMIN_CLASS_ALL && classNotes[classFilter] && (
        <p className="text-sm text-muted-foreground mb-4 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <span className="font-medium text-foreground">{classFilter} 메모 · </span>
          {classNotes[classFilter]}
        </p>
      )}

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
      ) : filtered.length === 0 ? (
        <EmptyState
          title="선생님이 없습니다"
          description={
            viewFilter === 'all'
              ? '「추가」 버튼으로 선생님을 등록하세요.'
              : '해당 조건에 맞는 선생님이 없습니다.'
          }
        />
      ) : (
        <DataTable
          data={filtered}
          keyExtractor={(t) => t.id}
          emptyTitle="선생님이 없습니다"
          columns={[
            {
              key: 'name',
              header: '이름',
              cell: (t) => (
                <div>
                  <span className="font-medium">{t.name}</span>
                  {opsNotes[t.id] && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{opsNotes[t.id]}</p>
                  )}
                </div>
              ),
            },
            {
              key: 'class',
              header: '담당 반',
              cell: (t) => (
                <div className="flex flex-wrap gap-1">
                  {classLabels(t).map((name) => (
                    <Badge key={name} variant="outline" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              ),
            },
            { key: 'mbti', header: 'MBTI', cell: (t) => t.mbti || '-', hideOnMobile: true },
            {
              key: 'count',
              header: '인원',
              cell: (t) => (
                <span className={cn(isNearFull(t) && 'text-warning font-medium')}>
                  {t.currentStudents}/{t.maxStudents}
                  {isNearFull(t) ? ' · 임박' : ''}
                </span>
              ),
            },
            {
              key: 'discord',
              header: 'Discord ID',
              cell: (t) =>
                t.discordUserId ? (
                  <Badge variant="success" className="font-mono text-[10px]">
                    {t.discordUserId.slice(0, 8)}…
                  </Badge>
                ) : (
                  <Badge variant="warning">미연결</Badge>
                ),
              hideOnMobile: true,
            },
            {
              key: 'status',
              header: '상태',
              cell: (t) => (
                <Badge variant={t.isActive ? 'success' : 'danger'}>
                  {t.isActive ? '활동' : '비활성'}
                </Badge>
              ),
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
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void toggleActive(t)}
                    >
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
                      {isDeleting ? (
                        <LoadingSpinner className="h-3.5 w-3.5" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
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
