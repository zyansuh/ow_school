'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isDiscordSnowflake } from '@/lib/discord-id';

export type DiscordSearchUser = {
  id: string;
  discordId: string;
  discordUsername: string;
  serverNickname: string | null;
  displayName: string;
  isAdmin?: boolean;
};

type Props = {
  onSelect: (user: DiscordSearchUser) => void;
  placeholder?: string;
  hint?: string;
  selectedDiscordId?: string;
  selectedServerNickname?: string | null;
};

export function DiscordUserSearch({
  onSelect,
  placeholder = '서버 닉·Discord User ID 검색 (2자 이상)',
  hint = '검색 후 선택하면 Discord User ID와 서버 닉네임이 자동 입력됩니다.',
  selectedDiscordId,
  selectedServerNickname,
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
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono text-success">ID: {selectedDiscordId}</span>
          {selectedServerNickname ? (
            <Badge variant="outline" className="text-foreground font-normal">
              서버 닉: {selectedServerNickname}
            </Badge>
          ) : (
            <span className="text-muted-foreground">서버 닉 미설정</span>
          )}
        </div>
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
                <p className="font-medium truncate">
                  {u.serverNickname ?? (
                    <span className="text-muted-foreground">서버 닉 없음</span>
                  )}
                </p>
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

type IdLookupProps = {
  discordUserId: string;
  onResolved: (payload: { serverNickname: string | null; discordUsername: string | null }) => void;
};

export function DiscordUserIdLookup({ discordUserId, onResolved }: IdLookupProps) {
  const onResolvedRef = useRef(onResolved);
  onResolvedRef.current = onResolved;

  const [state, setState] = useState<{
    loading: boolean;
    serverNickname: string | null;
    discordUsername: string | null;
    message?: string;
  } | null>(null);

  useEffect(() => {
    const id = discordUserId.trim();
    if (!isDiscordSnowflake(id)) {
      setState(null);
      return;
    }

    let cancelled = false;
    const t = setTimeout(() => {
      setState({ loading: true, serverNickname: null, discordUsername: null });
      fetch(`/api/admin/users/lookup?discordId=${encodeURIComponent(id)}`)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          setState({
            loading: false,
            serverNickname: data.serverNickname ?? null,
            discordUsername: data.discordUsername ?? null,
            message: data.message,
          });
          onResolvedRef.current({
            serverNickname: data.serverNickname ?? null,
            discordUsername: data.discordUsername ?? null,
          });
        })
        .catch(() => {
          if (!cancelled) {
            setState({ loading: false, serverNickname: null, discordUsername: null, message: 'ERROR' });
          }
        });
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [discordUserId]);

  if (!isDiscordSnowflake(discordUserId.trim())) return null;

  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2.5 text-sm flex items-center gap-2',
        state?.serverNickname ? 'border-success/30 bg-success/5' : 'border-border bg-surface/40',
      )}
    >
      {state?.loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">서버 닉네임 조회 중...</span>
        </>
      ) : state?.serverNickname ? (
        <>
          <Badge variant="success" className="shrink-0">서버 닉</Badge>
          <span className="font-medium text-foreground">{state.serverNickname}</span>
          {state.discordUsername && (
            <span className="text-xs text-muted-foreground ml-auto">@{state.discordUsername}</span>
          )}
        </>
      ) : (
        <span className="text-muted-foreground text-xs">
          {state?.message === 'NOT_IN_GUILD'
            ? '디스코드 서버에 없거나 미가입입니다'
            : state?.message === 'NOT_FOUND'
              ? '로그인 이력이 없습니다. 해당 유저가 한 번 로그인하면 조회됩니다'
              : '서버 닉네임이 설정되지 않았습니다 (글로벌 닉만 사용 중)'}
        </span>
      )}
    </div>
  );
}
