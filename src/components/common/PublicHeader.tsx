'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { AccountMenu } from './AccountMenu';
import { LoginModal } from '@/components/auth/LoginModal';

export interface PublicHeaderProps {
  className?: string;
}

export function PublicHeader({ className }: PublicHeaderProps) {
  const pathname = usePathname();
  const [sessionUser, setSessionUser] = useState<{
    fullName: string;
    email?: string;
    roles: string[];
    profileImageUrl?: string | null;
  } | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Reactive Supabase auth synchronization
  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function syncAuth() {
      try {
        const isExplicitlyLoggedOut =
          typeof window !== 'undefined' && localStorage.getItem('crewlink_logged_out') === 'true';

        // In dev mode, provide fallback dev actor header if not explicitly logged out
        const headers: Record<string, string> =
          process.env.NODE_ENV !== 'production' && !isExplicitlyLoggedOut
            ? { 'x-actor-person-id': '11111111-1111-1111-1111-111111111111' }
            : {};

        const res = await fetch('/api/auth/me', {
          cache: 'no-store',
          headers,
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.authenticated && data.user) {
              setSessionUser(data.user);
            } else {
              setSessionUser(null);
            }
          }
        } else if (isMounted) {
          setSessionUser(null);
        }
      } catch {
        if (isMounted) setSessionUser(null);
      } finally {
        if (isMounted) setIsLoadingSession(false);
      }
    }

    // Initial check
    syncAuth();

    // Listen to custom profile update event (e.g. when crew updates photo)
    const handleAuthChanged = () => syncAuth();
    window.addEventListener('crewlink:auth-changed', handleAuthChanged);

    // Listen reactively to auth state changes (explicit sign in, sign out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT' || !session) {
        setSessionUser(null);
        setIsLoadingSession(false);
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('crewlink_logged_out');
        }
        syncAuth();
      }
    });

    return () => {
      isMounted = false;
      window.removeEventListener('crewlink:auth-changed', handleAuthChanged);
      subscription.unsubscribe();
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
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs group-hover:scale-105 transition-transform shrink-0">
            <Image
              src="/crewlink_favicon.png"
              alt="CrewLink Logo"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              priority
            />
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
            onLogout={async () => {
              if (typeof window !== 'undefined') {
                localStorage.setItem('crewlink_logged_out', 'true');
              }
              const supabase = createClient();
              await supabase.auth.signOut();
              setSessionUser(null);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="h-9 px-4 rounded-xl bg-brand hover:bg-brand-hover text-inverse text-xs sm:text-sm font-bold transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
          >
            로그인
          </button>
        )}
      </div>

      {/* 모바일 퍼스트 로그인 모달 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectTo="/crew"
      />
    </header>
  );
}
