'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/common/AppShell';
import { calculateBusinessIncomePay } from '@/modules/settlements/taxCalculator';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Receipt,
  Download,
  Calendar,
  Building,
  CheckCircle2,
  Info,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CrewSettlementsPage() {
  // Sample settlement case
  const taxableGross = 90000; // 6h * 15,000원
  const transportExpense = 10000; // 실비 교통비 지원
  const paidOnDate = '2026-10-09';

  // Run official tax calculation engine
  const taxBreakdown = calculateBusinessIncomePay({
    taxableGrossWon: taxableGross,
    paidOn: paidOnDate,
    incomeType: 'RESIDENT_PERSONAL_SERVICE',
  });

  const finalNetPayout = taxBreakdown.netTaxablePayWon + transportExpense;

  return (
    <AppShell initialRole="crew">
      <div className="max-w-xl mx-auto px-4 py-5 w-full space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink">정산 내역</h1>
            <p className="text-xs text-muted mt-0.5">보수와 비용, 공제 금액을 확인해요.</p>
          </div>
          <StatusBadge status="SETTLED" />
        </div>

        {/* Paper Receipt Card UI */}
        <div className="bg-surface border border-border rounded-2xl shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-6 bg-ink text-inverse flex justify-between items-start">
            <div>
              <div className="text-[11px] font-semibold text-brand-inverse tracking-wider uppercase">
                CREWLINK · 정산 내역
              </div>
              <h2 className="text-lg font-bold mt-1">2026 서울 모빌리티 엑스포</h2>
              <p className="text-xs text-inverse-muted mt-0.5">근무일: 2026년 10월 9일 · 6시간</p>
            </div>
            <Receipt className="w-8 h-8 text-brand-inverse opacity-80" />
          </div>

          {/* Receipt Body */}
          <div className="p-6 space-y-5 text-sm">
            {/* Payee / Project Info */}
            <div className="grid grid-cols-2 gap-3 pb-4 border-b border-border-subtle text-xs text-muted">
              <div>
                <span className="text-muted block">받는 분</span>
                <span className="font-semibold text-ink">김크루</span>
              </div>
              <div>
                <span className="text-muted block">행사 주최사</span>
                <span className="font-semibold text-ink">(주)모빌리티랩스</span>
              </div>
              <div>
                <span className="text-muted block">지급일</span>
                <span className="font-semibold text-ink tabular-nums">{paidOnDate}</span>
              </div>
              <div>
                <span className="text-muted block">지급 계좌</span>
                <span className="font-semibold text-ink">국민은행</span>
              </div>
            </div>

            {/* Income Itemization */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-muted uppercase tracking-wider">
                받을 금액
              </div>
              <div className="flex justify-between items-center text-muted">
                <span>기본 보수 (시간당 15,000원 × 6시간)</span>
                <span className="font-medium text-ink tabular-nums">
                  {taxableGross.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center text-muted">
                <span>교통비 · 비용 변상</span>
                <span className="font-medium text-ink tabular-nums">
                  +{transportExpense.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center font-bold text-ink pt-2 border-t border-border-subtle">
                <span>총 지급액 · 세전</span>
                <span className="tabular-nums">{(taxableGross + transportExpense).toLocaleString()}원</span>
              </div>
            </div>

            {/* Withholding Tax Itemization */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-muted uppercase tracking-wider">
                공제 금액
              </div>
              <div className="flex justify-between items-center text-muted text-xs">
                <span>사업소득세 (3%)</span>
                <span className="text-ink font-medium tabular-nums">
                  -{taxBreakdown.incomeTaxWon.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center text-muted text-xs">
                <span>지방소득세</span>
                <span className="text-ink font-medium tabular-nums">
                  -{taxBreakdown.localIncomeTaxWon.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center font-bold text-ink pt-1 border-t border-border-subtle text-xs">
                <span>총 공제액</span>
                <span className="tabular-nums">-{taxBreakdown.totalTaxWon.toLocaleString()}원</span>
              </div>
            </div>

            {/* Final Net Pay Highlight */}
            <div className="p-4 border border-brand-border rounded-xl flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-brand block">실지급 예정액</span>
                <span className="text-[11px] text-muted">원천징수 세액을 뺀 금액이에요</span>
              </div>
              <div className="text-2xl font-black text-brand tabular-nums">
                {finalNetPayout.toLocaleString()}원
              </div>
            </div>

            {/* Legal / Policy Note */}
            <div className="p-3 bg-canvas rounded-xl text-[11px] text-muted space-y-1 leading-relaxed">
              <div className="flex items-center gap-1 font-semibold text-muted">
                <Info className="w-3.5 h-3.5 text-muted" />
                <span>계산 기준</span>
              </div>
              <div>• 소득세와 지방소득세는 각각 10원 미만을 버려 계산해요. 자세한 기준은 계산 상세에서 확인해 주세요.</div>
              <div>• 2024년 7월 1일 이후 지급하는 해당 사업소득에는 소액부징수 면제를 적용하지 않아요.</div>
              <div>• 적용 정책: {taxBreakdown.taxPolicyVersion}</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
