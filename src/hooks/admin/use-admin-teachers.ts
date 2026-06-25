'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { isDiscordSnowflake } from '@/lib/discord/id';

export type AdminTeacher = {
  id: string;
  name: string;
  mbti?: string;
  intro?: string;
  discord?: string;
  discordUserId?: string | null;
  activityDays?: string | null;
  activityTimeSlot?: string | null;
  isActive: boolean;
  maxStudents: number;
  currentStudents: number;
  classId: string;
  class: { name: string; slug: string };
  classes?: { id: string; name: string; slug: string }[];
  classIds?: string[];
};

export type ClassItem = { id: string; name: string };

export type TeacherFormState = {
  name: string;
  mbti: string;
  intro: string;
  discord: string;
  discordUserId: string;
  classId: string;
  classIds: string[];
  maxStudents: number;
  isActive: boolean;
  activityDays: string[];
  activityTimeSlot: string;
};

export const emptyTeacherForm: TeacherFormState = {
  name: '',
  mbti: '',
  intro: '',
  discord: '',
  discordUserId: '',
  classId: '',
  classIds: [],
  maxStudents: 5,
  isActive: true,
  activityDays: [],
  activityTimeSlot: '',
};

export { parseActivityDays } from '@/lib/teacher/activity';

export function useAdminTeachers() {
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([
      fetch('/api/admin/teachers').then((r) => r.json()),
      fetch('/api/classes').then((r) => r.json()),
    ])
      .then(([t, c]) => {
        setTeachers(Array.isArray(t) ? t : []);
        setClasses(
          Array.isArray(c)
            ? c.map((item: { id: string; name: string }) => ({ id: item.id, name: item.name }))
            : [],
        );
      })
      .catch(() => {
        toast.error('선생님 목록을 불러오지 못했습니다');
        setTeachers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (editingId: string | null, form: TeacherFormState) => {
    if (form.classIds.length === 0) {
      toast.error('담당 반을 1개 이상 선택하세요');
      return false;
    }

    const discord = form.discord.trim();
    const discordUserId = form.discordUserId.trim();

    if (discord && isDiscordSnowflake(discord)) {
      toast.error('디스코드 서버 닉네임에 User ID를 넣을 수 없습니다');
      return false;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/admin/teachers/${editingId}` : '/api/admin/teachers';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          mbti: form.mbti || undefined,
          intro: form.intro.trim() || undefined,
          discord: form.discord.trim() || undefined,
          discordUserId: form.discordUserId.trim() || null,
          classIds: form.classIds,
          maxStudents: form.maxStudents,
          isActive: form.isActive,
          activityDays: form.activityDays,
          activityTimeSlot: form.activityTimeSlot.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || '저장 실패');
        return false;
      }
      toast.success('저장되었습니다');
      await load();
      return true;
    } catch {
      toast.error('저장 실패');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/teachers/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || '삭제 실패');
        return false;
      }
      toast.success('삭제되었습니다');
      await load();
      return true;
    } catch {
      toast.error('삭제 실패');
      return false;
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (teacher: AdminTeacher) => {
    const res = await fetch(`/api/admin/teachers/${teacher.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !teacher.isActive }),
    });
    if (!res.ok) {
      toast.error('상태 변경 실패');
      return;
    }
    toast.success(teacher.isActive ? '비활성화되었습니다' : '활성화되었습니다');
    await load();
  };

  return { teachers, classes, loading, saving, deletingId, load, save, remove, toggleActive };
}
