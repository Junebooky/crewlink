'use client';

import React from 'react';
import { AppShell } from '@/components/common/AppShell';
import { Building, ShieldCheck, Mail, Phone, FileCheck } from 'lucide-react';

export default function ClientProfilePage() {
  return (
    <AppShell initialRole="client">
      <div className="max-w-2xl mx-auto px-4 py-6 w-full space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">우리 회사</h1>
          <p className="text-xs text-muted mt-0.5">회사 정보와 증빙 받을 이메일을 확인해요.</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-ink text-inverse flex items-center justify-center font-bold text-lg">
              <Building className="w-6 h-6 text-brand-strong" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-ink">(주)네온패밀리</h2>
                <span className="text-[11px] font-bold text-brand-strong bg-brand-subtle border border-brand-border px-2 py-0.5 rounded-full">
                  사업자 확인
                </span>
              </div>
              <p className="text-xs text-muted">사업자등록번호 · 120-88-12345</p>
            </div>
          </div>

          <div className="pt-3 border-t border-border-subtle grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted block">대표자</span>
              <span className="font-semibold text-ink">박대표</span>
            </div>
            <div>
              <span className="text-muted block">증빙 받을 이메일</span>
              <span className="font-semibold text-ink">finance@neonfamily.com</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
