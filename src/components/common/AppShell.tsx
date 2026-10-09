'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  ArrowRightLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type UserRole = 'crew' | 'client' | 'ops';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_CONFIG: Record<UserRole, { title: string; items: NavItem[] }> = {
  crew: {
    title: '크루 모바일',
    items: [
      { id: 'today', label: '오늘', href: '/crew', icon: Clock },
      { id: 'schedule', label: '일정', href: '/crew/schedule', icon: Calendar },
      { id: 'settlements', label: '정산', href: '/crew/settlements', icon: DollarSign },
      { id: 'profile', label: '내 정보', href: '/crew/profile', icon: User },
    ],
  },
  client: {
    title: '광고주 포털',
    items: [
      { id: 'events', label: '내 행사', href: '/client', icon: Briefcase },
      { id: 'request', label: '운영 요청', href: '/client/request', icon: PlusCircle },
      { id: 'billing', label: '결제·증빙', href: '/client/payments', icon: Receipt },
      { id: 'profile', label: '내 정보', href: '/client/profile', icon: User },
    ],
  },
  ops: {
    title: '운영자 관제',
    items: [
      { id: 'inbox', label: '작업함', href: '/ops', icon: Inbox },
      { id: 'projects', label: '행사', href: '/ops/projects', icon: Briefcase },
      { id: 'payouts', label: '지급 관리', href: '/ops/payouts', icon: DollarSign },
      { id: 'settings', label: '설정', href: '/ops/settings', icon: Sliders },
    ],
  },
};

export interface AppShellProps {
  children: React.ReactNode;
  initialRole?: UserRole;
}

export function AppShell({ children, initialRole = 'crew' }: AppShellProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>(initialRole);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Automatically detect role from pathname if URL matches
  useEffect(() => {
    if (pathname.startsWith('/client')) setRole('client');
    else if (pathname.startsWith('/ops')) setRole('ops');
    else if (pathname.startsWith('/crew')) setRole('crew');
  }, [pathname]);

  // Virtual Viewport detection for mobile software keyboards
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const vv = window.visualViewport;
    const initialHeight = window.innerHeight;

    const handleResize = () => {
      // If visualViewport height decreases by more than 150px, keyboard is active
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
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900 flex flex-col md:flex-row">
      {/* PC: 224px Fixed Sidebar */}
      <aside className="hidden md:flex flex-col w-[224px] bg-white border-r border-slate-200 shrink-0 sticky top-0 h-screen z-30 select-none">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1E60F3] text-white flex items-center justify-center font-black text-lg shadow-sm">
              C
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">CrewLink</span>
          </Link>
        </div>

        {/* Role Switcher (Convenient for Pair-Programming & Multi-role Demo) */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            역할 전환
          </div>
          <div className="grid grid-cols-3 gap-1 bg-slate-200/60 p-1 rounded-lg text-xs font-semibold">
            {(['crew', 'client', 'ops'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r);
                  window.location.href = NAV_CONFIG[r].items[0].href;
                }}
                className={cn(
                  'py-1 rounded text-center transition-all',
                  role === r
                    ? 'bg-white text-[#1E60F3] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {r === 'crew' ? '크루' : r === 'client' ? '고객' : '운영자'}
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
                    ? 'bg-[#E8F0FE] text-[#1E60F3] font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#1E60F3]' : 'text-slate-400')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
              {role === 'crew' ? '김' : role === 'client' ? '박' : '최'}
            </div>
            <div>
              <div className="font-semibold text-slate-800">
                {role === 'crew' ? '김크루' : role === 'client' ? '(주)네온패밀리' : '최마스터'}
              </div>
              <div className="text-[10px] text-slate-400">{NAV_CONFIG[role].title}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1E60F3] text-white flex items-center justify-center font-black text-sm">
            C
          </div>
          <span className="font-bold text-slate-900 tracking-tight">CrewLink</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#1E60F3] font-semibold ml-1">
            {NAV_CONFIG[role].title}
          </span>
        </Link>

        {/* Role toggle for mobile demo */}
        <div className="flex items-center gap-1">
          {(['crew', 'client', 'ops'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r);
                window.location.href = NAV_CONFIG[r].items[0].href;
              }}
              className={cn(
                'px-2 py-1 text-xs rounded font-medium transition-colors',
                role === r ? 'bg-[#1E60F3] text-white' : 'text-slate-500 hover:bg-slate-100'
              )}
            >
              {r === 'crew' ? '크루' : r === 'client' ? '고객' : '운영'}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className={cn(
          'flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden',
          // If keyboard is open on mobile, remove padding so bottom CTA flows naturally
          !isKeyboardOpen ? 'pb-[76px] md:pb-6' : 'pb-6'
        )}
      >
        {children}
      </main>

      {/* Mobile: 4-Tab Bottom Fixed Navigation (Height 68px + safe-area-inset-bottom) */}
      {!isKeyboardOpen && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-white border-t border-slate-200 z-40 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] shadow-lg"
          role="navigation"
          aria-label="하단 탭 메뉴"
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
                  isActive ? 'text-[#1E60F3] font-semibold' : 'text-slate-500 hover:text-slate-800'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={cn('w-5 h-5 mb-1', isActive ? 'text-[#1E60F3]' : 'text-slate-400')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
