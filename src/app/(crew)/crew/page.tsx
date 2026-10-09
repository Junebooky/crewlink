'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/common/AppShell';
import { StatusBadge, CrewLinkStatus } from '@/components/common/StatusBadge';
import {
  MapPin,
  Clock,
  Calendar,
  Building,
  Navigation,
  QrCode,
  FileCheck2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CrewTodayPage() {
  // Real state backed by server response without optimistic illusions
  const [status, setStatus] = useState<CrewLinkStatus>('NEED_CONFIRMATION');
  const [isDeparting, setIsDeparting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Near-future event details
  const todayEvent = {
    title: '2026 서울 모빌리티 엑스포 현장 운영',
    clientName: '(주)모빌리티랩스',
    role: 'VIP 라운지 안내 및 리셉션',
    date: '2026년 10월 9일 (오늘)',
    shiftTime: '13:00 ~ 19:00 (6시간)',
    meetingTime: '12:30까지 집합 (30분 전)',
    venueName: '코엑스 3층 D홀 리셉션 데스크',
    roadAddress: '서울 강남구 영동대로 513',
    hourlyRateWon: 15000,
    estimatedTotalWon: 90000,
    contractSigned: false, // Contract needed
  };

  const handleDepart = async () => {
    setIsDeparting(true);
    setServerError(null);
    try {
      // Direct call to simulate / execute server confirmation
      const res = await fetch('/api/crew/depart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: 'asgn-001' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '출발 상태 전송에 실패했습니다.');
      }
      // ONLY update UI upon confirmed server response (Non-negotiable rule #5)
      setStatus('DEPARTED');
    } catch (err: unknown) {
      setServerError((err as Error).message || '서버 응답 오류가 발생했습니다.');
    } finally {
      setIsDeparting(false);
    }
  };

  return (
    <AppShell initialRole="crew">
      <div className="max-w-2xl mx-auto px-4 py-5 w-full space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">오늘의 배정 일정</h1>
            <p className="text-xs text-slate-500 mt-0.5">배정된 도급 과업 및 출결 상태를 확인하세요.</p>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="p-3 bg-[#FFF0F3] border border-[#FDC4D0] rounded-xl text-[#BB2449] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Electronic Contract Notice Banner if not signed */}
        {!todayEvent.contractSigned && (
          <Link
            href="/crew/contract"
            className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-amber-900">전자서약서 작성이 필요합니다</div>
                <div className="text-xs text-amber-700">현장 과업 시작 전 법적 과업지시서(SOW)에 서명해 주세요.</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-500" />
          </Link>
        )}

        {/* Main Event Card (C01) */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-[#1E60F3] bg-blue-50 px-2 py-0.5 rounded">도급 과업</span>
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                {todayEvent.clientName}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{todayEvent.title}</h2>
            <p className="text-sm text-slate-600 mt-1">{todayEvent.role}</p>
          </div>

          <div className="p-5 space-y-3.5 text-sm">
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-slate-400 font-medium">활동 시간</div>
                <div className="font-semibold text-slate-800">{todayEvent.shiftTime}</div>
                <div className="text-xs text-red-600 font-medium mt-0.5">{todayEvent.meetingTime}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-slate-400 font-medium">집합 위치</div>
                <div className="font-semibold text-slate-800">{todayEvent.venueName}</div>
                <div className="text-xs text-slate-500">{todayEvent.roadAddress}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-400 font-medium w-full flex justify-between items-center">
                <span>예정 정산 보수 (세전)</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {todayEvent.estimatedTotalWon.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

          {/* Action CTA Box (Single Primary CTA according to specification) */}
          <div className="p-4 bg-slate-50 border-t border-slate-100">
            {status === 'NEED_CONFIRMATION' && (
              <button
                type="button"
                onClick={handleDepart}
                disabled={isDeparting}
                className={cn(
                  'w-full h-12 rounded-xl bg-[#1E60F3] hover:bg-[#164BC4] text-white font-bold text-base',
                  'flex items-center justify-center gap-2 shadow-sm transition-colors',
                  'disabled:opacity-60 disabled:cursor-not-allowed'
                )}
              >
                <Navigation className="w-5 h-5" />
                <span>{isDeparting ? '출발 상태 전송 중...' : '출발했어요'}</span>
              </button>
            )}

            {status === 'DEPARTED' && (
              <div className="space-y-2">
                <Link
                  href="/crew/checkin"
                  className={cn(
                    'w-full h-12 rounded-xl bg-[#08734E] hover:bg-[#065F40] text-white font-bold text-base',
                    'flex items-center justify-center gap-2 shadow-sm transition-colors'
                  )}
                >
                  <QrCode className="w-5 h-5" />
                  <span>현장 QR 출근 스캔하기</span>
                </Link>
                <p className="text-[11px] text-center text-slate-500">
                  현장 관리자 데스크에 비치된 유효 QR 코드를 스캔하세요.
                </p>
              </div>
            )}

            {status === 'ARRIVED_CONFIRMED' && (
              <div className="p-3 bg-[#E7F5EE] border border-[#B6E6CE] rounded-xl flex items-center justify-center gap-2 text-[#08734E] font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>도착 확인이 완료되었습니다. 과업을 안전하게 진행해 주세요.</span>
              </div>
            )}

            {status === 'OPS_REVIEW' && (
              <div className="p-3 bg-[#FFF3D9] border border-[#FDE19E] rounded-xl flex items-center justify-center gap-2 text-[#895400] font-bold text-sm">
                <Clock className="w-5 h-5" />
                <span>대면 확인 요청 접수됨 - 현장 운영자의 승인을 기다려요.</span>
              </div>
            )}
          </div>
        </div>

        {/* Safety & Compliance Card */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-5 h-5 text-[#1E60F3] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-800">크루링크 노무 준수 안내:</strong> 본 과업은 도급 계약(SOW)에 따라 수행되며,
            지각·노쇼에 대한 임의 벌금 차감은 근로기준법 및 관련 법령에 의해 절대 적용되지 않습니다.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
