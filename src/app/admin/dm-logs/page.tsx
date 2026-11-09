'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { LoadingSpinner } from '@/components/ui/loading';
import { formatDateTime } from '@/lib/utils';

type DmLog = {
  id: string;
  type: string;
  recipientDiscordId: string;
  userId: string | null;
  teacherId: string | null;
  content: string;
  status: string;
  skipReason: string | null;
  error: string | null;
  attempts: number;
  lastAttemptAt: string | null;
  createdAt: string;
};

const TYPE_LABEL: Record<string, string> = {
  admission_student: '입학(학생)',
  graduation_student: '졸업(학생)',
  graduation_teacher: '졸업(선생님)',
  application_teacher: '신청(선생님)',
  interview_teacher: '면담(선생님)',
  manual: '수동',
};

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
  sent: 'success',
  failed: 'danger',
  skipped: 'warning',
  pending: 'info',
};

export default function AdminDmLogsPage() {
  const [logs, setLogs] = useState<DmLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
      const res = await fetch(`/api/admin/dm-logs${q}`);
      if (!res.ok) throw new Error('load failed');
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch {
      toast.error('DM 내역을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRetry(id: string) {
    setRetryingId(id);
    try {
      const res = await fetch(`/api/admin/dm-logs/${id}/retry`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'retry failed');
      if (data.sent) toast.success('DM 재발송 성공');
      else toast.warning(`재발송 실패/스킵: ${data.skipReason ?? data.error ?? data.status}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '재발송 실패');
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">DM 발송 내역</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discord Bot DM 기록입니다. OAuth 로그인과 별개로, 봇 토큰·서버 가입·DM 수신 설정이 필요합니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {['', 'sent', 'failed', 'skipped', 'pending'].map((s) => (
          <Button
            key={s || 'all'}
            size="sm"
            variant={statusFilter === s ? 'default' : 'outline'}
            onClick={() => setStatusFilter(s)}
          >
            {s || '전체'}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => void load()} disabled={loading}>
          새로고침
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : (
        <DataTable
          layout="wide"
          scrollHint
          data={logs}
          keyExtractor={(r) => r.id}
          emptyTitle="DM 기록이 없습니다"
          columns={[
            {
              key: 'createdAt',
              header: '시각',
              width: '10rem',
              cell: (r) => (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateTime(r.createdAt)}
                </span>
              ),
            },
            {
              key: 'type',
              header: '유형',
              width: '8rem',
              cell: (r) => <span className="text-sm">{TYPE_LABEL[r.type] ?? r.type}</span>,
            },
            {
              key: 'status',
              header: '상태',
              width: '10rem',
              cell: (r) => (
                <Badge variant={STATUS_VARIANT[r.status] ?? 'info'}>
                  {r.status}
                  {r.skipReason ? ` · ${r.skipReason}` : ''}
                </Badge>
              ),
            },
            {
              key: 'recipient',
              header: '수신자',
              width: '8rem',
              cell: (r) => (
                <span className="font-mono text-xs">{r.recipientDiscordId.slice(0, 12)}…</span>
              ),
            },
            {
              key: 'attempts',
              header: '시도',
              width: '4rem',
              cell: (r) => <span className="text-sm">{r.attempts}</span>,
            },
            {
              key: 'content',
              header: '내용',
              width: '16rem',
              cell: (r) => (
                <p className="text-xs text-muted-foreground max-w-xs truncate" title={r.content}>
                  {r.content}
                </p>
              ),
            },
            {
              key: 'actions',
              header: '',
              width: '6rem',
              hideOnMobile: true,
              cell: (r) =>
                r.status === 'sent' ? null : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={retryingId === r.id}
                    onClick={() => void onRetry(r.id)}
                  >
                    재시도
                  </Button>
                ),
            },
          ]}
        />
      )}
    </div>
  );
}
