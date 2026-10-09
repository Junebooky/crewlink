'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/common/AppShell';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Calendar, Clock, MapPin, Building, ChevronRight } from 'lucide-react';

export default function CrewSchedulePage() {
  const schedules = [
    {
      id: 'asgn-001',
      title: '2026 서울 모빌리티 엑스포 현장 운영',
      date: '2026-10-09 (오늘)',
      time: '13:00 ~ 19:00',
      venue: '코엑스 3층 D홀',
      client: '(주)모빌리티랩스',
      status: 'DEPARTED' as const,
      pay: '90,000원',
    },
    {
      id: 'asgn-002',
      title: '글로벌 AI 컨퍼런스 동시통역 리셉션',
      date: '2026-10-12 (월)',
      time: '09:00 ~ 18:00',
      venue: '그랜드 인터컨티넨탈 파르나스',
      client: 'AI이노베이션포럼',
      status: 'CONTRACT_PENDING' as const,
      pay: '135,000원',
    },
  ];

  return (
    <AppShell initialRole="crew">
      <div className="max-w-xl mx-auto px-4 py-5 w-full space-y-4">
        <div>
          <h1 className="text-xl font-bold text-ink">내 일정</h1>
          <p className="text-xs text-muted mt-0.5">앞으로 함께할 현장을 확인해요.</p>
        </div>

        <div className="space-y-3">
          {schedules.map((item) => (
            <Link
              key={item.id}
              href="/crew"
              className="block p-4 bg-surface border border-border rounded-xl hover:border-border transition-colors shadow-xs"
            >
              <div className="flex items-start justify-between mb-2">
                <StatusBadge status={item.status} size="sm" />
                <span className="text-xs font-bold text-ink tabular-nums">{item.pay}</span>
              </div>
              <h2 className="font-bold text-ink text-sm">{item.title}</h2>
              <div className="text-xs text-muted mt-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted" />
                  <span>{item.date} ({item.time})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted" />
                  <span>{item.venue}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
