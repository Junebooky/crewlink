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
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CrewTodayPage() {
  const [status, setStatus] = useState<CrewLinkStatus>('NEED_CONFIRMATION');
  const [isDeparting, setIsDeparting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const todayEvent = {
    title: '2026 서울 모빌리티 엑스포 현장 운영',
    clientName: '(주)네온패밀리',
    role: 'VIP 라운지 · 안내·리셉션',
    date: '2026년 10월 9일 (오늘)',
    shiftTime: '13:00 ~ 19:00 (6시간)',
    meetingTime: '12:30까지 모여요 · 시작 30분 전',
    venueName: '코엑스 3층 D홀 · 리셉션 데스크',
    roadAddress: '서울 강남구 영동대로 513',
    hourlyRateWon: 15000,
    estimatedTotalWon: 90000,
    contractSigned: false,
  };

  const handleDepart = async () => {
    setIsDeparting(true);
    setServerError(null);
    try {
      const res = await fetch('/api/crew/depart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-person-id': '11111111-1111-1111-1111-111111111111',
        },
        body: JSON.stringify({ assignmentId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '출발 소식을 보내지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.');
      }
      setStatus('DEPARTED');
    } catch (err: unknown) {
      setServerError((err as Error).message || '연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsDeparting(false);
    }
  };

  return (
    <AppShell initialRole="crew">
      <div className="max-w-2xl mx-auto px-4 py-5 w-full space-y-5 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink tracking-tight">오늘 함께할 현장</h1>
            <p className="text-xs text-muted mt-0.5">시간과 장소를 확인하고, 출발할 때 알려주세요.</p>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="p-3 bg-error-bg border border-error-border rounded-xl text-error text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Electronic Contract Notice Banner if not signed */}
        {!todayEvent.contractSigned && (
          <Link
            href="/crew/contract"
            className="flex items-center justify-between p-4 bg-surface-muted border border-neutral-border rounded-xl hover:bg-brand-soft transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand text-inverse flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-ink">시작 전에 계약을 확인해 주세요</div>
                <div className="text-xs text-muted">업무와 보수 안내를 읽고 서명해 주세요.</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted" />
          </Link>
        )}

        {/* Main Event Card */}
        <div className="bg-surface border border-border rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-border-subtle">
            <div className="flex items-center justify-between text-xs text-muted mb-2">
              <span className="font-semibold text-brand bg-brand-subtle px-2 py-0.5 rounded">오늘 함께해요</span>
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                {todayEvent.clientName}
              </span>
            </div>
            <h2 className="text-lg font-bold text-ink leading-snug">{todayEvent.title}</h2>
            <p className="text-sm text-muted mt-1">{todayEvent.role}</p>
          </div>

          <div className="p-5 space-y-3.5 text-sm">
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-muted mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-muted font-medium">근무 시간</div>
                <div className="font-semibold text-ink">{todayEvent.shiftTime}</div>
                <div className="text-xs text-brand-strong font-medium mt-0.5">{todayEvent.meetingTime}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-muted font-medium">모이는 곳</div>
                <div className="font-semibold text-ink">{todayEvent.venueName}</div>
                <div className="text-xs text-muted">{todayEvent.roadAddress}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-border-subtle">
              <div className="text-xs text-muted font-medium w-full flex justify-between items-center">
                <span>예상 보수 · 세전</span>
                <span className="text-base font-bold text-ink tabular-nums">
                  {todayEvent.estimatedTotalWon.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

          {/* Action CTA Box (Touch Target Height 52px Minimum) */}
          <div className="p-4 bg-canvas border-t border-border-subtle">
            {status === 'NEED_CONFIRMATION' && (
              <button
                type="button"
                onClick={handleDepart}
                disabled={isDeparting}
                className={cn(
                  'w-full min-h-[52px] rounded-xl bg-brand hover:bg-brand-hover text-inverse font-bold text-base',
                  'flex items-center justify-center gap-2 shadow-sm transition-colors',
                  'disabled:opacity-60 disabled:cursor-not-allowed'
                )}
              >
                <Navigation className="w-5 h-5" />
                <span>{isDeparting ? '출발 소식 보내는 중…' : '출발했어요'}</span>
              </button>
            )}

            {status === 'DEPARTED' && (
              <div className="space-y-2">
                <Link
                  href="/crew/checkin"
                  className={cn(
                    'w-full min-h-[52px] rounded-xl bg-brand hover:bg-brand-hover text-inverse font-bold text-base',
                    'flex items-center justify-center gap-2 shadow-sm transition-colors'
                  )}
                >
                  <QrCode className="w-5 h-5" />
                  <span>QR로 도착 확인</span>
                </Link>
                <p className="text-[11px] text-center text-muted">
                  현장 데스크의 QR을 스캔해 주세요.
                </p>
              </div>
            )}

            {status === 'ARRIVED_CONFIRMED' && (
              <div className="p-3 bg-brand-soft border border-brand-border rounded-xl flex items-center justify-center gap-2 text-brand-strong font-bold text-sm min-h-[52px]">
                <CheckCircle2 className="w-5 h-5" />
                <span>도착 확인을 마쳤어요. 오늘도 안전하게 함께해요.</span>
              </div>
            )}

            {status === 'OPS_REVIEW' && (
              <div className="p-3 bg-surface-muted border border-neutral-border rounded-xl flex items-center justify-center gap-2 text-muted font-bold text-sm min-h-[52px]">
                <Clock className="w-5 h-5" />
                <span>확인을 요청했어요. 운영자 확인을 기다리고 있어요.</span>
              </div>
            )}
          </div>
        </div>

        {/* Safety & Compliance Card */}
        <div className="p-4 bg-surface border border-border rounded-xl flex items-start gap-3 text-xs text-muted">
          <ShieldCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-ink">보수 안내:</strong> 지각·노쇼를 이유로 사전에 정한 벌금이나 위약금을 보수에서 일괄 공제하지 않아요. 계약 내용은 계약 확인 화면에서 확인해 주세요.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
