'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { ContentPostDetail } from '@/lib/contents/types';

export type ContentFormState = {
  title: string;
  summary: string;
  body: string;
  thumbnailUrl: string;
  published: boolean;
  images: { url: string; sortOrder: number }[];
};

export const emptyContentForm: ContentFormState = {
  title: '',
  summary: '',
  body: '',
  thumbnailUrl: '',
  published: true,
  images: [],
};

export function contentToForm(post: ContentPostDetail): ContentFormState {
  return {
    title: post.title,
    summary: post.summary,
    body: post.body,
    thumbnailUrl: post.thumbnailUrl ?? '',
    published: post.published,
    images: post.images.map((img, i) => ({ url: img.url, sortOrder: img.sortOrder ?? i })),
  };
}

export function useAdminContents() {
  const [posts, setPosts] = useState<ContentPostDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    return fetch('/api/admin/contents')
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          toast.error('목록을 불러오지 못했습니다');
          setPosts([]);
          return;
        }
        setPosts(data);
      })
      .catch(() => {
        toast.error('목록을 불러오지 못했습니다');
        setPosts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async (editingId: string | null, form: ContentFormState) => {
    if (!form.title.trim()) {
      toast.error('제목을 입력하세요');
      return false;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/admin/contents/${editingId}` : '/api/admin/contents';
      const method = editingId ? 'PATCH' : 'POST';
      const images = form.images.map((img, index) => ({
        url: img.url,
        sortOrder: index,
      }));

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          summary: form.summary.trim() || null,
          body: form.body,
          thumbnailUrl: form.thumbnailUrl.trim() || images[0]?.url || null,
          published: form.published,
          images,
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
      const res = await fetch(`/api/admin/contents/${id}`, { method: 'DELETE' });
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

  return { posts, loading, saving, deletingId, load, save, remove };
}

export async function uploadContentImageFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/admin/contents/upload', { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '업로드 실패');
  return data.url as string;
}
