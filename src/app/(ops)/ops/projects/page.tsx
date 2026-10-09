'use client';

import React from 'react';
import { AppShell } from '@/components/common/AppShell';
import { Briefcase, Calendar, MapPin, Users } from 'lucide-react';

export default function OpsProjectsPage() {
  const projects = [
    {
      id: 'proj-01',
      title: '2026 서울 모빌리티 엑스포 현장 운영',
      client: '(주)모빌리티랩스',
      date: '2026-10-09',
      venue: '코엑스 3층 D홀',
      headcount: 8,
      status: '진행 중',
    },
    {
      id: 'proj-02',
      title: '글로벌 AI 컨퍼런스 동시통역 리셉션',
      client: 'AI이노베이션포럼',
      date: '2026-10-12',
      venue: '그랜드 인터컨티넨탈 파르나스',
      headcount: 12,
      status: '모집 마감',
    },
  ];

  return (
    <AppShell initialRole="ops">
      <div className="max-w-5xl mx-auto px-4 py-6 w-full space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">행사 목록</h1>
          <p className="text-xs text-muted mt-0.5">진행 중인 행사와 다음 일정을 확인해요.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="p-5 bg-surface border border-border rounded-xl shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-brand bg-brand-subtle px-2 py-0.5 rounded">
                  {p.status}
                </span>
                <span className="text-xs text-muted">{p.client}</span>
              </div>
              <h2 className="font-bold text-base text-ink">{p.title}</h2>
              <div className="text-xs text-muted space-y-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted" />
                  <span>{p.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted" />
                  <span>{p.venue}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted" />
                  <span>배정 {p.headcount}명</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
