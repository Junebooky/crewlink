'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Clock,
  DollarSign,
  User,
  Briefcase,
  PlusCircle,
  Receipt,
  Inbox,
  Shield,
  Sliders,
  CheckCircle,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ShieldAlert,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { AccountMenu } from './AccountMenu';

export type UserRole = 'crew' | 'client' | 'ops';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_CONFIG: Record<UserRole, { title: string; items: NavItem[] }> = {
  crew: {
    title: '크루',
    items: [
      { id: 'today', label: '오늘', href: '/crew', icon: Clock },
      { id: 'schedule', label: '일정', href: '/crew/schedule', icon: Calendar },
      { id: 'settlements', label: '정산', href: '/crew/settlements', icon: DollarSign },
      { id: 'profile', label: '내 정보', href: '/crew/profile', icon: User },
    ],
  },
  client: {
    title: '주최사',
    items: [
      { id: 'events', label: '내 행사', href: '/client', icon: Briefcase },
      { id: 'request', label: '행사 요청', href: '/client/request', icon: PlusCircle },
      { id: 'billing', label: '결제', href: '/client/payments', icon: Receipt },
      { id: 'profile', label: '내 정보', href: '/client/profile', icon: User },
    ],
  },
  ops: {
    title: '운영팀',
    items: [
      { id: 'inbox', label: '작업함', href: '/ops', icon: Inbox },
      { id: 'projects', label: '행사', href: '/ops/projects', icon: Briefcase },
      { id: 'payouts', label: '지급', href: '/ops/payouts', icon: DollarSign },
      { id: 'settings', label: '설정', href: '/ops/settings', icon: Sliders },
    ],
  },
};

export interface AppShellProps {
  children: React.ReactNode;
  initialRole?: UserRole;
}

export function AppShell({ children, initialRole }: AppShellProps) {
  const pathname = usePathname();

  // Synchronous role determination on the very first render (Zero FOUC)
  const role: UserRole = pathname.startsWith('/crew')
    ? 'crew'
    : pathname.startsWith('/client') || pathname.startsWith('/biz')
    ? 'client'
    : pathname.startsWith('/ops')
    ? 'ops'
    : initialRole || 'crew';

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<{
    fullName: string;
    email?: string;
    roles: string[];
    profileImageUrl?: string | null;
  } | null>(null);

  // Synchronize session and profile info across all shell pages
  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function syncAuth() {
      try {
        const isExplicitlyLoggedOut =
          typeof window !== 'undefined' && localStorage.getItem('crewlink_logged_out') === 'true';

        const roleActorMap: Record<string, string> = {
          crew: '11111111-1111-1111-1111-111111111111',
          client: '33333333-3333-3333-3333-333333333333',
          ops: '22222222-2222-2222-2222-222222222222',
        };

        const actorId = roleActorMap[role] || roleActorMap.crew;

        const headers: Record<string, string> =
          process.env.NODE_ENV !== 'production' && !isExplicitlyLoggedOut
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
      }
    }

    syncAuth();

    const handleAuthChanged = () => syncAuth();
    window.addEventListener('crewlink:auth-changed', handleAuthChanged);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT' || !session) {
        setSessionUser(null);
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        syncAuth();
      }
    });

    return () => {
      isMounted = false;
      window.removeEventListener('crewlink:auth-changed', handleAuthChanged);
      subscription.unsubscribe();
    };
  }, [role]);

  // Virtual Viewport detection for mobile software keyboards
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const vv = window.visualViewport;
    const initialHeight = window.innerHeight;

    const handleResize = () => {
      const diff = initialHeight - vv.height;
      setIsKeyboardOpen(diff > 150);
    };

    vv.addEventListener('resize', handleResize);
    return () => {
      vv.removeEventListener('resize', handleResize);
    };
  }, []);

  const navItems = NAV_CONFIG[role].items;

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col md:flex-row">
      {/* PC: 224px Fixed Sidebar */}
      <aside className="hidden md:flex flex-col w-[224px] bg-surface border-r border-border shrink-0 sticky top-0 h-screen z-30 select-none">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-border-subtle">
          <Link href="/" className="flex items-center gap-2 group">
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
            <span className="font-extrabold text-base sm:text-lg text-ink tracking-tight">CrewLink</span>
          </Link>
        </div>

        {/* Role Switcher (Always Visible) */}
        <div className="px-4 py-3 border-b border-border-subtle bg-canvas">
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
            화면 미리보기
          </div>
          <div className="grid grid-cols-3 gap-1 bg-surface-muted p-1 rounded-lg text-xs font-semibold">
            {(['crew', 'client', 'ops'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('crewlink_active_role', r);
                    window.dispatchEvent(new CustomEvent('crewlink:auth-changed'));
                  }
                  window.location.href = NAV_CONFIG[r].items[0].href;
                }}
                className={cn(
                  'py-1 rounded text-center transition-all cursor-pointer',
                  role === r
                    ? 'bg-surface text-brand shadow-xs font-bold'
                    : 'text-muted hover:text-ink'
                )}
              >
                {r === 'crew' ? '크루' : r === 'client' ? '주최사' : '운영진'}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-soft text-brand font-semibold'
                    : 'text-muted hover:bg-canvas hover:text-ink'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-brand' : 'text-muted')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-border-subtle flex items-center justify-between text-xs text-muted">
          {sessionUser ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5 min-w-0">
                <AccountMenu user={sessionUser} activeRole={role} />
                <div className="min-w-0">
                  <div className="font-semibold text-ink truncate text-xs">{sessionUser.fullName}</div>
                  <div className="text-[10px] text-muted truncate">{NAV_CONFIG[role].title}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-surface-muted border border-border flex items-center justify-center font-bold text-muted">
                {role === 'crew' ? '김' : role === 'client' ? '박' : '최'}
              </div>
              <div>
                <div className="font-semibold text-ink">
                  {role === 'crew' ? '김크루' : role === 'client' ? '(주)네온패밀리' : '최마스터'}
                </div>
                <div className="text-[10px] text-muted">{NAV_CONFIG[role].title}</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden h-14 bg-surface border-b border-border px-4 flex items-center justify-between sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg overflow-hidden shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <Image
              src="/crewlink_app_icon.png"
              alt="CrewLink Logo"
              width={28}
              height={28}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <span className="font-extrabold text-ink tracking-tight">CrewLink</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-subtle text-brand font-semibold ml-1">
            {NAV_CONFIG[role].title}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Role toggle (Always Visible) */}
          <div className="flex items-center gap-1">
            {(['crew', 'client', 'ops'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('crewlink_active_role', r);
                    window.dispatchEvent(new CustomEvent('crewlink:auth-changed'));
                  }
                  window.location.href = NAV_CONFIG[r].items[0].href;
                }}
                className={cn(
                  'px-2 py-1 text-xs rounded font-medium transition-colors cursor-pointer',
                  role === r ? 'bg-brand text-inverse' : 'text-muted hover:bg-surface-muted'
                )}
              >
                {r === 'crew' ? '크루' : r === 'client' ? '주최사' : '운영진'}
              </button>
            ))}
          </div>
          {sessionUser && <AccountMenu user={sessionUser} activeRole={role} />}
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className={cn(
          'flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden',
          !isKeyboardOpen ? 'pb-[76px] md:pb-6' : 'pb-6'
        )}
      >
        {children}
      </main>

      {/* Mobile: 4-Tab Bottom Fixed Navigation */}
      {!isKeyboardOpen && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-surface border-t border-border z-40 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] shadow-lg"
          role="navigation"
          aria-label="주요 메뉴"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-colors',
                  isActive ? 'text-brand font-semibold' : 'text-muted hover:text-ink'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={cn('w-5 h-5 mb-1', isActive ? 'text-brand' : 'text-muted')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
