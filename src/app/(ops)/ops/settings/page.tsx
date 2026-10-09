'use client';

import React from 'react';
import { AppShell } from '@/components/common/AppShell';
import { Sliders, ShieldCheck, Database, Server } from 'lucide-react';

export default function OpsSettingsPage() {
  return (
    <AppShell initialRole="ops">
      <div className="max-w-3xl mx-auto px-4 py-6 w-full space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">운영 설정</h1>
          <p className="text-xs text-muted mt-0.5">계산 기준과 배정 규칙을 확인해요.</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-bold text-sm text-ink flex items-center gap-2">
            <Server className="w-4 h-4 text-brand" />
            <span>운영 기준</span>
          </h2>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-canvas rounded-lg flex justify-between items-center">
              <div>
                <span className="font-semibold text-ink">정산 계산 기준</span>
                <span className="text-muted block">KR_RESIDENT_PERSONAL_SERVICE_REVIEW_2026-10-09</span>
              </div>
              <span className="text-[11px] font-bold text-brand-strong bg-brand-subtle px-2 py-0.5 rounded">
                적용 상태 확인
              </span>
            </div>

            <div className="p-3 bg-canvas rounded-lg flex justify-between items-center">
              <div>
                <span className="font-semibold text-ink">중복 배정 방지</span>
                <span className="text-muted block">같은 시간에 여러 현장이 배정되지 않도록 확인해요.</span>
              </div>
              <span className="text-[11px] font-bold text-brand-strong bg-brand-subtle px-2 py-0.5 rounded">
                적용 상태 확인
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
