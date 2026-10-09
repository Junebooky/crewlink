'use client';

import React from 'react';
import { AppShell } from '@/components/common/AppShell';
import { Sliders, ShieldCheck, Database, Server } from 'lucide-react';

export default function OpsSettingsPage() {
  return (
    <AppShell initialRole="ops">
      <div className="max-w-3xl mx-auto px-4 py-6 w-full space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">운영 시스템 설정</h1>
          <p className="text-xs text-slate-500 mt-0.5">인프라 및 자동화 규칙 제어</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Server className="w-4 h-4 text-[#1E60F3]" />
            <span>노무 & 세무 정책 엔진 상태</span>
          </h2>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-800">원천세 세무 엔진</span>
                <span className="text-slate-400 block">KR_RESIDENT_PERSONAL_SERVICE_REVIEW_2026-10-09</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                정상 가동 (소액부징수 면제 미적용)
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-800">PostgreSQL Exclusion Lock 제약</span>
                <span className="text-slate-400 block">`work_reservations` 중복 배정 배제</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                활성화 (EXCLUDE USING gist)
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
