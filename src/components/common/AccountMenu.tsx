'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Calendar,
  DollarSign,
  Briefcase,
  PlusCircle,
  Receipt,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export interface AccountMenuProps {
  user: {
    fullName: string;
    email?: string;
    roles: string[];
  };
  onLogout?: () => void;
}

export function AccountMenu({ user, onLogout }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or ESC key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/';
    }
  };

  // Determine primary display mode
  const isClient = user.roles.includes('client');
  const roleBadge = isClient ? '주최사' : '크루';

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      <button
        type="button"
        id="account-menu-button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-2 py-1.5 px-2.5 rounded-full border border-border bg-surface hover:bg-canvas text-xs font-bold text-ink transition-colors cursor-pointer shadow-2xs',
          isOpen && 'border-brand ring-2 ring-brand/10'
        )}
      >
        <div className="w-7 h-7 rounded-full bg-brand-soft text-brand-strong font-black text-xs flex items-center justify-center">
          {user.fullName.slice(0, 1) || '크'}
        </div>
        <span className="max-w-[80px] truncate hidden sm:inline">{user.fullName}</span>
        <span className="text-[10px] font-semibold text-brand bg-brand-subtle px-1.5 py-0.5 rounded-md border border-brand-border hidden md:inline">
          {roleBadge}
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-muted transition-transform duration-200',
            isOpen && 'rotate-180 text-brand'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="account-menu-button"
        className={cn(
          'absolute right-0 top-full mt-2 w-56 bg-surface/98 backdrop-blur-md border border-border rounded-2xl p-1.5 shadow-xl shadow-black/8 z-50 origin-top-right transition-all duration-200 ease-out',
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        )}
      >
        {/* User Info Header */}
        <div className="px-3 py-2.5 border-b border-border-subtle mb-1">
          <p className="text-xs font-bold text-ink truncate">{user.fullName}</p>
          {user.email && (
            <p className="text-[11px] text-muted truncate mt-0.5">{user.email}</p>
          )}
          <span className="inline-block mt-1 text-[10px] font-semibold text-brand bg-brand-soft px-1.5 py-0.5 rounded border border-brand-border">
            {isClient ? '주최사 파트너' : '크루 멤버'}
          </span>
        </div>

        {/* Dynamic Items based on verified role */}
        <div className="space-y-0.5">
          {isClient ? (
            <>
              <Link
                href="/client/profile"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-muted hover:text-brand transition-colors"
              >
                <User className="w-3.5 h-3.5 text-muted" />
                <span>회사 계정</span>
              </Link>
              <Link
                href="/client"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-muted hover:text-brand transition-colors"
              >
                <Briefcase className="w-3.5 h-3.5 text-muted" />
                <span>내 행사</span>
              </Link>
              <Link
                href="/client/request"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-muted hover:text-brand transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-brand" />
                <span className="font-bold text-brand">행사 요청</span>
              </Link>
              <Link
                href="/client/payments"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-muted hover:text-brand transition-colors"
              >
                <Receipt className="w-3.5 h-3.5 text-muted" />
                <span>결제·증빙</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/crew/profile"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-muted hover:text-brand transition-colors"
              >
                <User className="w-3.5 h-3.5 text-muted" />
                <span>내 프로필</span>
              </Link>
              <Link
                href="/crew/schedule"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-muted hover:text-brand transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-muted" />
                <span>지원한 현장</span>
              </Link>
              <Link
                href="/crew/settlements"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-muted hover:text-brand transition-colors"
              >
                <DollarSign className="w-3.5 h-3.5 text-muted" />
                <span>정산 내역</span>
              </Link>
            </>
          )}

          <div className="pt-1 mt-1 border-t border-border-subtle">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:bg-surface-muted hover:text-ink transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
