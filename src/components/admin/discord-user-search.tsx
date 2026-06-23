'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type DiscordSearchUser = {
  id: string;
  discordId: string;
  discordUsername: string;
  displayName: string;
  isAdmin?: boolean;
};

type Props = {
  onSelect: (user: DiscordSearchUser) => void;
  placeholder?: string;
  hint?: string;
  selectedDiscordId?: string;
};

export function DiscordUserSearch({
  onSelect,
  placeholder = '서버 닉·유저명·Discord User ID 검색 (2자 이상)',
  hint = '검색 후 선택하면 Discord User ID와 유저명이 자동 입력됩니다.',
  selectedDiscordId,
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DiscordSearchUser[]>([]);
  const [searching, setSearching] = useState(false);

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

  return (
    <div className="space-y-2">
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full"
      />
      {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
      {selectedDiscordId && (
        <p className="text-xs font-mono text-success">
          선택됨: {selectedDiscordId}
        </p>
      )}
      {searching && <p className="text-sm text-muted-foreground">검색 중...</p>}
      {query.trim().length >= 2 && !searching && results.length === 0 && (
        <p className="text-sm text-muted-foreground">검색 결과가 없습니다 (로그인 이력이 있는 유저만 검색됩니다)</p>
      )}
      {results.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden max-h-48 overflow-y-auto">
          {results.map((u) => (
            <li
              key={u.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-surface/40"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{u.displayName}</p>
                <p className="text-xs text-muted-foreground truncate font-mono">
                  @{u.discordUsername} · {u.discordId}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {u.isAdmin && <Badge variant="outline" className="text-[10px]">관리자</Badge>}
                <Button
                  type="button"
                  size="sm"
                  variant={selectedDiscordId === u.discordId ? 'default' : 'outline'}
                  onClick={() => {
                    onSelect(u);
                    setQuery('');
                    setResults([]);
                  }}
                >
                  {selectedDiscordId === u.discordId ? '선택됨' : '선택'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
