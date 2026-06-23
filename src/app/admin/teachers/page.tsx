'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingPage, EmptyState } from '@/components/ui/loading';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';

type Teacher = {
  id: string; name: string; mbti?: string; intro?: string; discord?: string;
  isActive: boolean; maxStudents: number; currentStudents: number; classId: string;
  class: { name: string; slug: string };
};

type ClassItem = { id: string; name: string };

const empty = { name: '', mbti: '', intro: '', discord: '', classId: '', maxStudents: 5, isActive: true };

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      fetch('/api/admin/teachers').then((r) => r.json()),
      fetch('/api/classes').then((r) => r.json()),
    ]).then(([t, c]) => { setTeachers(t); setClasses(c); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/admin/teachers/${editing}` : '/api/admin/teachers';
    const method = editing ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res.ok) { toast.error('저장 실패'); return; }
    toast.success('저장되었습니다');
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch(`/api/admin/teachers/${id}`, { method: 'DELETE' });
    toast.success('삭제되었습니다'); load();
  };

  const toggleActive = async (t: Teacher) => {
    await fetch(`/api/admin/teachers/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    load();
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">선생님 관리</h1>
        <Button size="sm" onClick={() => { setShowForm(true); setEditing(null); setForm(empty); }}><Plus className="h-4 w-4" /> 추가</Button>
      </div>

      {showForm && (
        <Card className="bg-gray-900/80 border-gray-800">
          <form onSubmit={save} className="card-pad space-y-4">
            <h2 className="font-semibold">{editing ? '수정' : '새 선생님'}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>이름 *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2" /></div>
              <div><Label>반 *</Label><Select required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="mt-2"><option value="">선택</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
              <div><Label>MBTI</Label><Input value={form.mbti} onChange={(e) => setForm({ ...form, mbti: e.target.value })} className="mt-2" /></div>
              <div><Label>디스코드</Label><Input value={form.discord} onChange={(e) => setForm({ ...form, discord: e.target.value })} className="mt-2" /></div>
              <div><Label>최대 인원</Label><Input type="number" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: Number(e.target.value) })} className="mt-2" /></div>
            </div>
            <div><Label>소개</Label><Textarea value={form.intro} onChange={(e) => setForm({ ...form, intro: e.target.value })} className="mt-2" /></div>
            <div className="flex gap-2"><Button type="submit">저장</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>취소</Button></div>
          </form>
        </Card>
      )}

      {teachers.length === 0 ? <EmptyState title="선생님이 없습니다" /> : (
        <Card className="bg-gray-900/80 border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800 text-gray-400 text-left"><th className="p-4">이름</th><th className="p-4">반</th><th className="p-4">인원</th><th className="p-4">상태</th><th className="p-4">관리</th></tr></thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="border-b border-gray-800/50">
                  <td className="p-4 font-medium">{t.name}</td>
                  <td className="p-4">{t.class.name}</td>
                  <td className="p-4">{t.currentStudents}/{t.maxStudents}</td>
                  <td className="p-4"><Badge variant={t.isActive ? 'success' : 'danger'}>{t.isActive ? '활동' : '비활성'}</Badge></td>
                  <td className="p-4 flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(t.id); setForm({ name: t.name, mbti: t.mbti || '', intro: t.intro || '', discord: t.discord || '', classId: t.classId, maxStudents: t.maxStudents, isActive: t.isActive }); setShowForm(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(t)}>{t.isActive ? '비활성' : '활성'}</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
