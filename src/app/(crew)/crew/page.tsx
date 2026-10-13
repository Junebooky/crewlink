'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Loader2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getKSTDateString } from '@/lib/utils/date';

interface AssignmentItem {
  id: string;
  shiftId: string;
  projectId: string;
  projectTitle: string;
  hostName: string;
  venueName: string;
  roadAddress: string;
  date: string;
  startTime: string;
  endTime: string;
  dailyWage: number;
  status: string;
  assignedAt: string;
  departedAt?: string | null;
  checkedInAt?: string | null;
}

export default function CrewTodayPage() {
  const [todayAssignment, setTodayAssignment] = useState<AssignmentItem | null>(null);
  const [nextAssignment, setNextAssignment] = useState<AssignmentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeparting, setIsDeparting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadTodayData() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/crew/applications', { cache: 'no-store' });
        if (!res.ok) {
          if (res.status === 401) {
            setServerError('로그인이 필요합니다. 상단에서 크루 계정을 선택해 주세요.');
          }
          return;
        }
        const data = await res.json();
        const assignments: AssignmentItem[] = data.assignments || [];

        const todayKST = getKSTDateString();
        const todayMatch = assignments.find((a) => a.date === todayKST);
        const futureMatches = assignments
          .filter((a) => a.date > todayKST)
          .sort((a, b) => a.date.localeCompare(b.date));

        if (isMounted) {
          setTodayAssignment(todayMatch || null);
          setNextAssignment(futureMatches[0] || null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setServerError((err as Error).message || '현장 정보를 조회하지 못했습니다.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTodayData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDepart = async (assignmentId: string) => {
    setIsDeparting(true);
    setServerError(null);
    try {
      const res = await fetch('/api/crew/depart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignmentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '출발 소식을 보내지 못했어요. 잠시 후 다시 시도해 주세요.');
      }
      if (todayAssignment) {
        setTodayAssignment({ ...todayAssignment, status: 'departed' });
      }
    } catch (err: unknown) {
      setServerError((err as Error).message || '연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsDeparting(false);
    }
  };

  const mapStatus = (status: string): CrewLinkStatus => {
    switch (status) {
      case 'assigned':
        return 'NEED_CONFIRMATION';
      case 'departed':
        return 'DEPARTED';
      case 'checked_in':
        return 'CHECKED_IN';
      case 'completed':
        return 'COMPLETED';
      default:
        return 'APPLIED';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-muted gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
        <span className="text-xs">오늘의 현장 정보를 확인하는 중...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 w-full space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">오늘 함께할 현장</h1>
          <p className="text-xs text-muted mt-0.5">시간과 장소를 확인하고, 출발할 때 알려주세요.</p>
        </div>
        {todayAssignment && <StatusBadge status={mapStatus(todayAssignment.status)} />}
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Case 1: No assignment for today */}
      {!todayAssignment ? (
        <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 bg-brand-soft rounded-2xl flex items-center justify-center mx-auto text-brand">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-ink">오늘은 예정된 현장이 없어요</h2>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              푹 쉬고 충전하는 날이에요. 다음 일정을 확인하거나 새로운 공고를 둘러보세요.
            </p>
          </div>

          {/* Next upcoming schedule preview if any */}
          {nextAssignment && (
            <div className="p-4 bg-canvas rounded-2xl border border-border-subtle text-left space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-brand bg-brand-soft px-2 py-0.5 rounded-md">
                  다음 예정 현장
                </span>
                <span className="text-xs font-bold text-ink tabular-nums">
                  {nextAssignment.date}
                </span>
              </div>
              <h3 className="font-bold text-ink text-sm truncate">{nextAssignment.projectTitle}</h3>
              <p className="text-xs text-muted truncate">
                {nextAssignment.venueName} · {nextAssignment.startTime} ~ {nextAssignment.endTime}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <Link
              href="/crew/schedule"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface border border-border text-ink text-xs font-bold hover:bg-canvas transition-colors shadow-2xs flex items-center justify-center gap-1.5"
            >
              <span>내 일정 전체 보기</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand text-inverse text-xs font-bold hover:bg-brand-hover transition-colors shadow-2xs flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>새로운 공고 찾기</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Case 2: Today's Assignment Details */
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-brand">{todayAssignment.hostName}</span>
                <h2 className="text-lg font-extrabold text-ink mt-0.5">
                  {todayAssignment.projectTitle}
                </h2>
              </div>
              <span className="text-base font-extrabold text-ink tabular-nums">
                {todayAssignment.dailyWage.toLocaleString()}원
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted pt-2 border-t border-border-subtle">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand shrink-0" />
                <span>
                  근무: {todayAssignment.startTime} ~ {todayAssignment.endTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand shrink-0" />
                <span className="truncate">{todayAssignment.venueName}</span>
              </div>
            </div>

            {/* Departure Action Button */}
            {todayAssignment.status === 'assigned' && (
              <button
                type="button"
                disabled={isDeparting}
                onClick={() => handleDepart(todayAssignment.id)}
                className="w-full h-12 rounded-xl bg-brand hover:bg-brand-hover text-inverse text-sm font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                {isDeparting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                <span>출발해요</span>
              </button>
            )}

            {todayAssignment.status === 'departed' && (
              <div className="p-3 bg-brand-soft rounded-xl text-brand-strong text-xs font-bold flex items-center justify-between">
                <span>현장으로 이동 중이에요. 안전하게 도착해 주세요!</span>
                <Link
                  href="/crew/checkin"
                  className="px-2.5 py-1 bg-brand text-inverse rounded-lg text-xs font-bold"
                >
                  도착 인증
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
