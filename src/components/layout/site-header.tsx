'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Gamepad2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { signInWithDiscord } from '@/hooks/auth/use-discord-sign-in';
import { userDisplayName } from '@/lib/users/display';
import { userHeaderSubtitle } from '@/lib/users/header';
import { SITE_NAME } from '@/lib/site-brand';

import { Button } from '@/components/ui/button';

function buildNav(isTeacher?: boolean) {
  const items = [
    { href: '/', label: '홈' },
    { href: '/#classes', label: '클래스 소개' },
    { href: '/interview', label: '졸업면담' },
    { href: '/mypage', label: '마이페이지' },
  ];
  if (isTeacher) items.push({ href: '/teacher', label: '반장 페이지' });
  return items;
}

export function SiteHeader() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const user = session?.user;
  const NAV = buildNav(user?.isTeacher);

  return (
    <header className="relative z-20 border-b border-border bg-background/80 backdrop-blur-md sticky top-0">
      <div className="page-container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-foreground hover:text-primary transition-colors shrink-0">
          <Gamepad2 className="h-5 w-5 text-primary" />
          <span className="text-sm sm:text-base hidden xs:inline">{SITE_NAME}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => (
            <Button key={item.href} variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="hidden sm:flex items-center gap-3 text-right">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {userDisplayName(user)}님
                </p>
                <p className="text-xs text-secondary truncate">
                  {userHeaderSubtitle(user)}
                </p>
                {user.discordRoleNames?.length > 0 && (
                  <p className="text-[10px] text-gray-500 truncate max-w-[140px]">
                    {user.discordRoleNames.slice(0, 2).join(' · ')}
                  </p>
                )}
              </div>
              {user.discordAvatar && (
                <Image src={user.discordAvatar} alt="" width={36} height={36} className="rounded-full border border-gray-700" />
              )}
              <Button variant="outline" size="sm" onClick={() => signOut()}>로그아웃</Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => void signInWithDiscord()}>Discord 로그인</Button>
          )}

          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background/95 px-4 py-4 space-y-2">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block py-2.5 text-muted-foreground hover:text-foreground">
              {item.label}
            </Link>
          ))}
          {user && (
            <div className="pt-3 border-t border-gray-800 space-y-2">
              <p className="text-sm text-gray-200">
                {userDisplayName(user)}님 · {userHeaderSubtitle(user)}
              </p>
              {user.discordRoleNames?.length > 0 && (
                <p className="text-xs text-gray-500">{user.discordRoleNames.join(' · ')}</p>
              )}
              <Button variant="outline" size="sm" onClick={() => signOut()}>로그아웃</Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
