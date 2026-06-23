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
  /** Teacher.discord 저장값 — guild → global → username */
  discordLabel: string | null;
  displayName: string;
  isAdmin?: boolean;
};

type Props = {
  onSelect: (user: DiscordSearchUser) => void;
  placeholder?: string;
  hint?: string;
  selectedDiscordId?: string;
  selectedDiscordLabel?: string | null;
};

function formatSearchPrimary(u: DiscordSearchUser) {
  if (u.serverNickname) return { text: u.serverNickname, sub: '서버 닉' as const };
  if (u.discordLabel) return { text: u.discordLabel, sub: '표시 이름' as const };
  return { text: null, sub: null };
}

export function DiscordUserSearch({
  onSelect,
  placeholder = '서버 닉·Discord User ID 검색 (2자 이상)',
  hint = '검색 후 선택하면 대상 유저의 Discord User ID와 서버 닉네임(또는 fallback)이 입력됩니다.',
  selectedDiscordId,
  selectedDiscordLabel,
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
          <span className="font-mono text-success">대상 ID: {selectedDiscordId}</span>
          {selectedDiscordLabel ? (
            <Badge variant="outline" className="text-foreground font-normal">
              {selectedDiscordLabel}
            </Badge>
          ) : (
            <span className="text-muted-foreground">닉네임 미조회</span>
          )}
        </div>
      )}
      {searching && <p className="text-sm text-muted-foreground">검색 중...</p>}
      {query.trim().length >= 2 && !searching && results.length === 0 && (
        <p className="text-sm text-muted-foreground">검색 결과가 없습니다 (로그인 이력이 있는 유저만 검색됩니다)</p>
      )}
      {results.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden max-h-48 overflow-y-auto">
          {results.map((u) => {
            const primary = formatSearchPrimary(u);
            return (
              <li
                key={u.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-surface/40"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {primary.text ?? <span className="text-muted-foreground">닉네임 없음</span>}
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
            );
          })}
        </ul>
      )}
    </div>
  );
}

export type DiscordIdLookupResult = {
  discordLabel: string | null;
  serverNickname: string | null;
  globalDisplayName: string | null;
  discordUsername: string | null;
};

type IdLookupProps = {
  discordUserId: string;
  onResolved: (payload: DiscordIdLookupResult) => void;
};

export function DiscordUserIdLookup({ discordUserId, onResolved }: IdLookupProps) {
  const onResolvedRef = useRef(onResolved);
  onResolvedRef.current = onResolved;

  const [state, setState] = useState<{
    loading: boolean;
    discordLabel: string | null;
    serverNickname: string | null;
    globalDisplayName: string | null;
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
      setState({
        loading: true,
        discordLabel: null,
        serverNickname: null,
        globalDisplayName: null,
        discordUsername: null,
      });
      fetch(`/api/admin/users/lookup?discordId=${encodeURIComponent(id)}`)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          setState({
            loading: false,
            discordLabel: data.discordLabel ?? null,
            serverNickname: data.serverNickname ?? null,
            globalDisplayName: data.globalDisplayName ?? null,
            discordUsername: data.discordUsername ?? null,
            message: data.message,
          });
          onResolvedRef.current({
            discordLabel: data.discordLabel ?? null,
            serverNickname: data.serverNickname ?? null,
            globalDisplayName: data.globalDisplayName ?? null,
            discordUsername: data.discordUsername ?? null,
          });
        })
        .catch(() => {
          if (!cancelled) {
            setState({
              loading: false,
              discordLabel: null,
              serverNickname: null,
              globalDisplayName: null,
              discordUsername: null,
              message: 'ERROR',
            });
          }
        });
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [discordUserId]);

  if (!isDiscordSnowflake(discordUserId.trim())) return null;

  const displayNick = state?.serverNickname ?? state?.discordLabel;

  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2.5 text-sm flex flex-wrap items-center gap-2',
        displayNick ? 'border-success/30 bg-success/5' : 'border-border bg-surface/40',
      )}
    >
      {state?.loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">대상 유저 닉네임 조회 중...</span>
        </>
      ) : displayNick ? (
        <>
          <Badge variant="success" className="shrink-0">
            {state?.serverNickname ? '서버 닉' : '표시 이름'}
          </Badge>
          <span className="font-medium text-foreground">{displayNick}</span>
          {state?.discordUsername && (
            <span className="text-xs text-muted-foreground ml-auto">@{state.discordUsername}</span>
          )}
        </>
      ) : (
        <span className="text-muted-foreground text-xs">
          {state?.message === 'NOT_IN_GUILD'
            ? '대상 유저가 디스코드 서버에 없습니다'
            : state?.message === 'NOT_FOUND'
              ? '로그인 이력이 없습니다. 대상 유저가 한 번 로그인하면 조회됩니다'
              : '서버 닉·글로벌 닉·username을 찾지 못했습니다'}
        </span>
      )}
    </div>
  );
}
