'use client';

import React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Receipt, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CrewSettlementsPage() {
  // Real settlements list from DB (empty in MVP demo)
  const settlements: Array<{
    id: string;
    projectName: string;
    workDate: string;
    grossPayWon: number;
    netPayoutWon: number;
    status: string;
  }> = [];

  return (
    <div className="max-w-xl mx-auto px-4 py-5 w-full space-y-5 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">정산 내역</h1>
          <p className="text-xs text-muted mt-0.5">보수와 비용, 공제 금액을 확인해요.</p>
        </div>
      </div>

      {settlements.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-sm text-ink">아직 완료된 정산 내역이 없어요</p>
            <p className="text-xs text-muted mt-1">
              현장 근무를 마치고 주최사 확인이 완료되면 정산서가 발행돼요.
            </p>
          </div>
          <Link
            href="/crew/schedule"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-inverse text-xs font-bold rounded-xl shadow-xs hover:bg-brand-hover transition-colors mt-2"
          >
            <span>내 일정 확인하기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
