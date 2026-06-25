'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
import { ContentFormDialog } from '@/components/admin/contents/content-form-dialog';
import {
  contentToForm,
  emptyContentForm,
  useAdminContents,
  type ContentFormState,
} from '@/hooks/admin/use-admin-contents';
import type { ContentPostDetail } from '@/lib/contents/types';
import { formatDate } from '@/lib/utils';
import { ds } from '@/styles/design-system';
import { LoadingSpinner } from '@/components/ui/loading';

export default function AdminContentsPage() {
  const { posts, loading, saving, deletingId, load, save, remove } = useAdminContents();
  const [form, setForm] = useState<ContentFormState>(emptyContentForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyContentForm);
    setFormOpen(true);
  };

  const openEdit = (post: ContentPostDetail) => {
    setEditing(post.id);
    setForm(contentToForm(post));
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setForm(emptyContentForm);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await save(editing, form);
    if (ok) closeForm();
  };

  return (
    <div className={ds.pageGap}>
      <AdminPageHeader
        title="컨텐츠 소개"
        description="평겜마 컨텐츠·이벤트·가이드 게시글을 등록·수정합니다."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/contents" target="_blank">
                <ExternalLink className="h-4 w-4" /> 공개 페이지
              </Link>
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" /> 추가
            </Button>
          </div>
        }
      />

      <ContentFormDialog
        open={formOpen}
        editing={editing}
        form={form}
        saving={saving}
        onChange={setForm}
        onSubmit={handleSave}
        onClose={closeForm}
      />

      {loading ? (
        <SkeletonTable rows={4} />
      ) : posts.length === 0 ? (
        <EmptyState title="게시글이 없습니다" description="「추가」 버튼으로 첫 컨텐츠를 등록하세요." />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post.id}
              className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4 shadow-card"
            >
              <div className="relative h-28 w-full sm:w-40 shrink-0 overflow-hidden rounded-lg bg-muted">
                {post.thumbnailUrl ? (
                  <Image src={post.thumbnailUrl} alt="" fill className="object-cover" sizes="160px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                    썸네일 없음
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-start gap-2">
                  <h2 className="font-semibold text-foreground break-words [overflow-wrap:anywhere] line-clamp-2">
                    {post.title}
                  </h2>
                  <Badge variant={post.published ? 'success' : 'outline'}>
                    {post.published ? '공개' : '비공개'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 break-words [overflow-wrap:anywhere]">
                  {post.summary}
                </p>
                <p className="text-xs text-subtle">{formatDate(post.createdAt)} · 이미지 {post.images.length}장</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(post)}>
                    <Pencil className="h-3.5 w-3.5" /> 수정
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/contents/${post.id}`} target="_blank">보기</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-danger border-danger/30"
                    disabled={deletingId === post.id}
                    onClick={() => {
                      if (!confirm(`「${post.title}」을(를) 삭제하시겠습니까?`)) return;
                      void remove(post.id);
                    }}
                  >
                    {deletingId === post.id ? (
                      <LoadingSpinner className="h-3.5 w-3.5" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    삭제
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
