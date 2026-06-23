'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus } from 'lucide-react';
import { ds } from '@/styles/design-system';
import { toast } from 'sonner';

type SearchUser = {
  id: string;
  discordId: string;
  discordUsername: string;
  displayName: string;
  isAdmin: boolean;
};

type Props = {
  onChanged: () => void;
};

export function AdminGrantSearch({ onChanged }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [grantingId, setGrantingId] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      setSearching(true);
      fetch(`/api/admin/users?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then((d) => setResults(Array.isArray(d) ? d : []))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const grant = async (userId: string, name: string) => {
    if (!confirm(`「${name}」님을 관리자로 등록할까요?`)) return;
    setGrantingId(userId);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'grant', userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '등록 실패');
      }
      toast.success('관리자로 등록되었습니다');
      setQuery('');
      setResults([]);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '등록 실패');
    } finally {
      setGrantingId(null);
    }
  };

  return (
    <Card className={`${ds.card} ${ds.cardPad}`}>
      <div className="flex items-center gap-2 mb-1">
        <UserPlus className="h-4 w-4 text-primary shrink-0" />
        <h2 className={ds.sectionTitle}>관리자 등록</h2>
      </div>
      <p className={`${ds.subtitle} mb-4`}>
        서버 닉네임·디스코드 이름·Discord ID로 검색 (2자 이상)
      </p>
      <Input
        placeholder="검색어 입력..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full"
      />
      {searching && <p className="text-sm text-muted-foreground mt-2">검색 중...</p>}
      {query.trim().length >= 2 && !searching && results.length === 0 && (
        <p className="text-sm text-muted-foreground mt-2">검색 결과가 없습니다</p>
      )}
      {results.length > 0 && (
        <ul className="mt-3 divide-y divide-border rounded-xl border border-border overflow-hidden">
          {results.map((u) => (
            <li
              key={u.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface/40"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{u.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  @{u.discordUsername} · {u.discordId}
                </p>
              </div>
              {u.isAdmin ? (
                <Badge variant="success" className="shrink-0 self-start sm:self-center">
                  이미 관리자
                </Badge>
              ) : (
                <Button
                  size="sm"
                  className="w-full sm:w-auto shrink-0 min-h-11 sm:min-h-0"
                  disabled={grantingId === u.id}
                  onClick={() => void grant(u.id, u.displayName)}
                >
                  {grantingId === u.id ? '등록 중...' : '등록'}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
