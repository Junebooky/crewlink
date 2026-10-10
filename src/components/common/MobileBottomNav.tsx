'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Bookmark, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MobileBottomNavProps {
  className?: string;
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Requirement: Hide bottom bar when entering event detail page (/events/[id]) to avoid overlap with sticky application bar
  const isEventDetail = pathname.startsWith('/events/');
  // Also hide if in organizer or ops areas
  const isExcludedArea = isEventDetail || pathname.startsWith('/ops');

  // Detect virtual viewport changes for software keyboard on mobile
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

  if (isExcludedArea || isKeyboardOpen) {
    return null;
  }

  const tabs = [
    {
      id: 'explore',
      label: '현장 찾기',
      href: '/',
      icon: Compass,
      isActive: pathname === '/' || pathname.startsWith('/events'),
    },
    {
      id: 'saved',
      label: '저장',
      href: '/saved',
      icon: Bookmark,
      isActive: pathname === '/saved',
    },
    {
      id: 'schedule',
      label: '내 활동',
      href: '/crew/schedule',
      icon: Calendar,
      isActive: pathname.startsWith('/crew/schedule') || pathname === '/crew',
    },
    {
      id: 'profile',
      label: '내 정보',
      href: '/crew/profile',
      icon: User,
      isActive: pathname.startsWith('/crew/profile'),
    },
  ];

  return (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-surface/98 backdrop-blur-md border-t border-border z-40 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] shadow-lg shadow-black/5',
        className
      )}
      role="navigation"
      aria-label="하단 탐색 메뉴"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={tab.isActive ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full py-1 min-h-[48px] text-[11px] font-semibold transition-colors',
              tab.isActive
                ? 'text-brand font-bold'
                : 'text-muted hover:text-ink'
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5 mb-1 transition-transform',
                tab.isActive ? 'text-brand scale-110' : 'text-muted'
              )}
            />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
