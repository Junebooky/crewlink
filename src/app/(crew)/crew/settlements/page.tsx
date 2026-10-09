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
            <h1 className="text-xl font-bold text-slate-900">정산 명세서</h1>
            <p className="text-xs text-slate-500 mt-0.5">C06 원천징수 영수증 및 실수령액 내역</p>
          </div>
          <StatusBadge status="SETTLED" />
        </div>

        {/* Paper Receipt Card UI */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
            <div>
              <div className="text-[11px] font-semibold text-blue-400 tracking-wider uppercase">
                CREWLINK OFFICIAL RECEIPT
              </div>
              <h2 className="text-lg font-bold mt-1">2026 서울 모빌리티 엑스포</h2>
              <p className="text-xs text-slate-400 mt-0.5">과업 수행일: 2026년 10월 9일 (6시간)</p>
            </div>
            <Receipt className="w-8 h-8 text-blue-400 opacity-80" />
          </div>

          {/* Receipt Body */}
          <div className="p-6 space-y-5 text-sm">
            {/* Payee / Project Info */}
            <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-100 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block">수령인 (크루)</span>
                <span className="font-semibold text-slate-800">김크루 (개인용역)</span>
              </div>
              <div>
                <span className="text-slate-400 block">발주 고객사</span>
                <span className="font-semibold text-slate-800">(주)모빌리티랩스</span>
              </div>
              <div>
                <span className="text-slate-400 block">지급 일자</span>
                <span className="font-semibold text-slate-800 tabular-nums">{paidOnDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block">지급 계좌</span>
                <span className="font-semibold text-slate-800">국민은행 (토큰화 검증됨)</span>
              </div>
            </div>

            {/* Income Itemization */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. 지급 보수 내역
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>기본 도급 보수 (15,000원 × 6h)</span>
                <span className="font-medium text-slate-900 tabular-nums">
                  {taxableGross.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>원거리 현장 교통비 지원 (실비 실비보전)</span>
                <span className="font-medium text-slate-900 tabular-nums">
                  +{transportExpense.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>총 지급액 (세전)</span>
                <span className="tabular-nums">{(taxableGross + transportExpense).toLocaleString()}원</span>
              </div>
            </div>

            {/* Withholding Tax Itemization */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. 원천징수 세액 공제 (3.3%)
              </div>
              <div className="flex justify-between items-center text-slate-600 text-xs">
                <span>사업소득세 (국세 3%, 10원 미만 절사)</span>
                <span className="text-red-600 font-medium tabular-nums">
                  -{taxBreakdown.incomeTaxWon.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 text-xs">
                <span>지방소득세 (지방세 0.3%, 10원 미만 절사)</span>
                <span className="text-red-600 font-medium tabular-nums">
                  -{taxBreakdown.localIncomeTaxWon.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center font-bold text-red-600 pt-1 border-t border-slate-100 text-xs">
                <span>원천징수 공제 합계액</span>
                <span className="tabular-nums">-{taxBreakdown.totalTaxWon.toLocaleString()}원</span>
              </div>
            </div>

            {/* Final Net Pay Highlight */}
            <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-[#1E60F3] block">최종 실수령액</span>
                <span className="text-[11px] text-slate-500">원천징수 공제 후 실입금액</span>
              </div>
              <div className="text-2xl font-black text-[#1E60F3] tabular-nums">
                {finalNetPayout.toLocaleString()}원
              </div>
            </div>

            {/* Legal / Policy Note */}
            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1 leading-relaxed">
              <div className="flex items-center gap-1 font-semibold text-slate-700">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>세무 계산 규정 준수 안내</span>
              </div>
              <div>• 국고금 관리법 제47조 및 지방회계법 제55조에 따라 10원 미만은 절사 계산되었습니다.</div>
              <div>• 2024년 7월 1일 이후 지급분으로 소액부징수(1,000원 미만) 면제 규정이 적용되지 않습니다.</div>
              <div>• 정책 버전: {taxBreakdown.taxPolicyVersion}</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
