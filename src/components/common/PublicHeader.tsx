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
  const [activeRole, setActiveRole] = useState<'crew' | 'client' | 'ops'>('crew');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Reactive Supabase auth synchronization
  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function syncAuth() {
      try {
        const isExplicitlyLoggedOut =
          typeof window !== 'undefined' && localStorage.getItem('crewlink_logged_out') === 'true';

        if (isExplicitlyLoggedOut) {
          if (isMounted) {
            setSessionUser(null);
            setIsAuthLoading(false);
          }
          return;
        }

        // supabase.auth.getSession() 검사 완료 전까지는 버튼 노출 방지
        await supabase.auth.getSession();

        // In dev mode, resolve actor matching the active role (crew, client, ops)
        const currentRole =
          (typeof window !== 'undefined' &&
            (localStorage.getItem('crewlink_active_role') as 'crew' | 'client' | 'ops')) ||
          'crew';

        if (isMounted) {
          setActiveRole(currentRole);
        }

        const roleActorMap: Record<string, string> = {
          crew: '11111111-1111-1111-1111-111111111111',
          client: '33333333-3333-3333-3333-333333333333',
          ops: '22222222-2222-2222-2222-222222222222',
        };

        const actorId = roleActorMap[currentRole] || roleActorMap.crew;

        const headers: Record<string, string> =
          process.env.NODE_ENV !== 'production'
            ? { 'x-actor-person-id': actorId }
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
        if (isMounted) setIsAuthLoading(false);
      }
    }

    // Initial check
    syncAuth();

    // Listen to custom profile update event (e.g. when crew updates photo)
    const handleAuthChanged = () => syncAuth();
    window.addEventListener('crewlink:auth-changed', handleAuthChanged);

    // Listen reactively to explicit auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT') {
        setSessionUser(null);
        setIsAuthLoading(false);
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

  const handleRoleSelect = (r: 'crew' | 'client' | 'ops') => {
    setActiveRole(r);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crewlink_active_role', r);
      window.dispatchEvent(new CustomEvent('crewlink:auth-changed'));
    }
    const targetHref = r === 'crew' ? '/crew' : r === 'client' ? '/client' : '/ops';
    window.location.href = targetHref;
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between select-none transition-colors gap-2 sm:gap-4',
        className
      )}
    >
      {/* 좌측: 로고 (CrewLink) + 데스크톱 네비게이션 */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs group-hover:scale-105 transition-transform shrink-0">
            <Image
              src="/crewlink_app_icon.png"
              alt="CrewLink Logo"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <span className="font-extrabold text-base sm:text-lg text-ink tracking-tight whitespace-nowrap">
            CrewLink
          </span>
        </Link>

        {/* 데스크톱/태블릿 네비게이션 */}
        <nav className="hidden sm:flex items-center gap-1 shrink-0">
          <Link
            href="/"
            className={cn(
              'px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap',
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
              'px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap',
              isCurrent('/guide')
                ? 'bg-brand-soft text-brand-strong font-bold'
                : 'text-muted hover:text-ink hover:bg-canvas'
            )}
          >
            이용 안내
          </Link>
        </nav>
      </div>

      {/* 중앙: [크루 | 주최사 | 운영진] 3개 세그먼트 탭 상시 노출 */}
      <div className="flex items-center justify-center shrink-0">
        <div className="flex items-center bg-surface-muted/90 p-0.5 sm:p-1 rounded-xl border border-border/50 text-xs font-semibold shadow-2xs shrink-0">
          {(['crew', 'client', 'ops'] as const).map((r) => {
            const isSelected = activeRole === r;
            const label = r === 'crew' ? '크루' : r === 'client' ? '주최사' : '운영진';
            return (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleSelect(r)}
                className={cn(
                  'px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0',
                  isSelected
                    ? 'bg-surface text-brand shadow-xs font-extrabold'
                    : 'text-muted hover:text-ink'
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 우측: 계정/로그인 영역 */}
      <div className="flex items-center justify-end shrink-0">
        {isAuthLoading ? (
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-muted/60 border border-border/40 animate-pulse shrink-0"
            aria-hidden="true"
          />
        ) : sessionUser ? (
          <AccountMenu
            user={sessionUser}
            activeRole={activeRole}
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
            onClick={() => {
              if (activeRole === 'client') {
                window.location.href = '/client/login';
              } else {
                setIsLoginModalOpen(true);
              }
            }}
            className="h-9 px-3 sm:px-4 rounded-xl bg-brand hover:bg-brand-hover text-inverse text-xs sm:text-sm font-bold transition-colors shadow-2xs flex items-center justify-center cursor-pointer whitespace-nowrap shrink-0"
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
