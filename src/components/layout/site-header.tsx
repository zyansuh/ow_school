'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Gamepad2, Menu, X, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { userDisplayName } from '@/lib/user-display';
import { userHeaderSubtitle } from '@/lib/user-header';
import { Button } from '@/components/ui/button';

const NAV = [
  { href: '/', label: '홈' },
  { href: '/#classes', label: '클래스 소개' },
  { href: '/teachers', label: '선생님' },
  { href: '/apply', label: '수강 신청' },
  { href: '/interview', label: '졸업면담' },
  { href: '/mypage', label: '마이페이지' },
];

export function SiteHeader() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const user = session?.user;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="relative z-20 border-b border-gray-800/50 bg-gray-950/70 backdrop-blur-md sticky top-0">
      <div className="page-container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-white hover:text-purple-300 transition-colors shrink-0">
          <Gamepad2 className="h-5 w-5 text-purple-400" />
          <span className="text-sm sm:text-base hidden xs:inline">OW School</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => (
            <Button key={item.href} variant="ghost" asChild className="text-gray-300 hover:text-white">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="테마 전환"
          >
            {mounted ? (
              theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
            ) : (
              <span className="inline-block h-4 w-4" aria-hidden />
            )}
          </Button>

          {user ? (
            <div className="hidden sm:flex items-center gap-3 text-right">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-100 truncate">
                  {userDisplayName(user)}님
                </p>
                <p className="text-xs text-purple-300 truncate">
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
            <Button size="sm" onClick={() => signIn('discord')}>Discord 로그인</Button>
          )}

          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-gray-800/50 bg-gray-950/95 px-4 py-4 space-y-2">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block py-2.5 text-gray-300 hover:text-white">
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
