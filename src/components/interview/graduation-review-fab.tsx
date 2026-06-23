'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageSquareHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label, Textarea } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SITE_NAME } from '@/lib/site-brand';
import { resolveDisplayName, type UserNickFields } from '@/lib/user-display';

type MeData = UserNickFields & {
  displayName?: string;
  class?: { name: string } | null;
  graduationReview?: { id: string } | null;
  applications?: Array<{ class?: { name: string } | null; status: string }>;
};

function resolveClassName(me: MeData | null): string {
  if (!me) return '—';
  if (me.class?.name) return me.class.name;
  const approved = me.applications?.find((a) => a.status === 'approved');
  return approved?.class?.name ?? '미배정';
}

function resolveAuthorName(me: MeData | null, sessionUser?: UserNickFields | null): string {
  if (me) return resolveDisplayName(me);
  if (sessionUser) return resolveDisplayName(sessionUser);
  return '—';
}

export function GraduationReviewFab() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [me, setMe] = useState<MeData | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const loadMe = () =>
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || data.error) return;
        setMe(data);
        if (data.graduationReview) setSubmitted(true);
      });

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (session) loadMe();
  }, [session]);

  useEffect(() => {
    if (open && session) loadMe();
  }, [open, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/graduation-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('졸업후기가 등록되었습니다');
      setSubmitted(true);
      setOpen(false);
      setContent('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '등록 실패');
    } finally {
      setLoading(false);
    }
  };

  const authorName = resolveAuthorName(me, session?.user);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed z-40 flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-950/90 px-4 py-2.5 text-sm font-medium text-amber-200 shadow-lg shadow-amber-900/30 transition-all duration-700 hover:border-amber-400/60 hover:bg-amber-900/90 hover:scale-105',
          'right-4 top-24 sm:right-[max(1rem,calc(50%-22rem))] sm:top-32',
          visible ? 'translate-x-0 opacity-100 animate-float-bob' : 'translate-x-8 opacity-0',
        )}
        aria-label="졸업후기 작성"
      >
        <MessageSquareHeart className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">졸업후기</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>졸업후기 작성</DialogTitle>
            <DialogDescription>
              {SITE_NAME}에서의 경험을 후배들과 공유해주세요.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <p className="text-sm text-gray-400 py-4">이미 졸업후기를 작성하셨습니다. 감사합니다!</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-1">작성자</p>
                  <p className="text-gray-200">{authorName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">반</p>
                  <p className="text-gray-200">{resolveClassName(me)}</p>
                </div>
              </div>
              <div>
                <Label>후기 내용 *</Label>
                <Textarea
                  required
                  minLength={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="수업에서 배운 점, 성장한 점 등을 자유롭게 적어주세요"
                  className="mt-2 min-h-[140px]"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? '등록 중...' : '등록하기'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
