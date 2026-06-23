'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export type AdminTeacher = {
  id: string;
  name: string;
  profileImage?: string;
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
};

export type ClassItem = { id: string; name: string };

export type TeacherFormState = {
  name: string;
  profileImage: string;
  mbti: string;
  intro: string;
  discord: string;
  discordUserId: string;
  classId: string;
  maxStudents: number;
  isActive: boolean;
  activityDays: string[];
  activityTimeSlot: string;
};

export const emptyTeacherForm: TeacherFormState = {
  name: '',
  profileImage: '',
  mbti: '',
  intro: '',
  discord: '',
  discordUserId: '',
  classId: '',
  maxStudents: 5,
  isActive: true,
  activityDays: [],
  activityTimeSlot: '',
};

export function parseActivityDays(json?: string | null) {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function useAdminTeachers() {
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return Promise.all([
      fetch('/api/admin/teachers').then((r) => r.json()),
      fetch('/api/classes').then((r) => r.json()),
    ]).then(([t, c]) => {
      setTeachers(t);
      setClasses(c.map((item: { id: string; name: string }) => ({ id: item.id, name: item.name })));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (editingId: string | null, form: TeacherFormState) => {
    const url = editingId ? `/api/admin/teachers/${editingId}` : '/api/admin/teachers';
    const method = editingId ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        discordUserId: form.discordUserId.trim() || null,
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
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/teachers/${id}`, { method: 'DELETE' });
    toast.success('삭제되었습니다');
    await load();
  };

  const toggleActive = async (teacher: AdminTeacher) => {
    await fetch(`/api/admin/teachers/${teacher.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !teacher.isActive }),
    });
    await load();
  };

  return { teachers, classes, loading, load, save, remove, toggleActive };
}
