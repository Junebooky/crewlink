'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AccountMenu } from './AccountMenu';

export interface PublicHeaderProps {
  className?: string;
}

export function PublicHeader({ className }: PublicHeaderProps) {
  const pathname = usePathname();
  const [sessionUser, setSessionUser] = useState<{
    fullName: string;
    email?: string;
    roles: string[];
  } | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Fetch session user from /api/auth/me
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user && isMounted) {
            setSessionUser(data.user);
          }
        }
      } catch (err) {
        // Silently default to unauthenticated public mode
      } finally {
        if (isMounted) setIsLoadingSession(false);
      }
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const isCurrent = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between select-none transition-colors',
        className
      )}
    >
      {/* Brand & Crew Navigation */}
      <div className="flex items-center gap-6 sm:gap-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-brand text-inverse flex items-center justify-center font-black text-lg shadow-xs group-hover:scale-105 transition-transform">
            C
          </div>
          <span className="font-extrabold text-base sm:text-lg text-ink tracking-tight">
            CrewLink
          </span>
        </Link>

        {/* Public Crew Links (NO client links in top header!) */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors',
              isCurrent('/')
                ? 'bg-brand-soft text-brand-strong font-bold'
                : 'text-muted hover:text-ink hover:bg-canvas'
            )}
          >
            현장 찾기
          </Link>
          <Link
            href="/guide"
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors',
              isCurrent('/guide')
                ? 'bg-brand-soft text-brand-strong font-bold'
                : 'text-muted hover:text-ink hover:bg-canvas'
            )}
          >
            이용 안내
          </Link>
        </nav>
      </div>

      {/* Right Action: Logged In (AccountMenu) vs Logged Out ([로그인]) */}
      <div className="flex items-center gap-2">
        {isLoadingSession ? (
          <div className="w-20 h-8 rounded-full bg-surface-muted animate-pulse" />
        ) : sessionUser ? (
          <AccountMenu
            user={sessionUser}
            onLogout={() => {
              setSessionUser(null);
              window.location.reload();
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              // Quick demo crew session login or redirect
              window.location.href = '/crew';
            }}
            className="h-9 px-4 rounded-xl bg-brand hover:bg-brand-hover text-inverse text-xs sm:text-sm font-bold transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
          >
            로그인
          </button>
        )}
      </div>
    </header>
  );
}
