'use client';

import React from 'react';
import { AppShell } from '@/components/common/AppShell';
import { Building, ShieldCheck, Mail, Phone, FileCheck } from 'lucide-react';

export default function ClientProfilePage() {
  return (
    <AppShell initialRole="client">
      <div className="max-w-2xl mx-auto px-4 py-6 w-full space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">고객사 조직 정보</h1>
          <p className="text-xs text-slate-500 mt-0.5">B2B 사업자 등록 및 도급 발주 권한 정보</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
              <Building className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-slate-900">(주)네온패밀리</h2>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  인증된 사업자
                </span>
              </div>
              <p className="text-xs text-slate-500">사업자등록번호: 120-88-12345</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">대표자명</span>
              <span className="font-semibold text-slate-800">박대표</span>
            </div>
            <div>
              <span className="text-slate-400 block">세금계산서 발행 이메일</span>
              <span className="font-semibold text-slate-800">finance@neonfamily.com</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
