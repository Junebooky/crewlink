'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusBadge, CrewLinkStatus } from '@/components/common/StatusBadge';
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  Loader2,
  AlertCircle,
  Briefcase,
  ChevronRight,
  ArrowRight,
  Undo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApplicationItem {
  id: string;
  projectId: string;
  projectTitle: string;
  hostName: string;
  venueName: string;
  roadAddress: string;
  shiftId: string;
  date: string;
  startTime: string;
  endTime: string;
  dailyWage: number;
  status: 'applied' | 'approved' | 'rejected' | 'withdrawn';
  appliedAt: string;
}

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
}

export default function CrewSchedulePage() {
  const [activeTab, setActiveTab] = useState<'assignments' | 'applied'>('assignments');
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await fetch('/api/crew/applications', { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('로그인이 필요합니다. 상단에서 크루 계정을 선택해 주세요.');
        }
        throw new Error('일정 데이터를 불러오지 못했습니다.');
      }
      const data = await res.json();
      setApplications(data.applications || []);
      setAssignments(data.assignments || []);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || '네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleWithdraw = async (applicationId: string) => {
    if (!confirm('이 지원을 정말 철회하시겠습니까?')) return;

    setWithdrawingId(applicationId);
    try {
      const res = await fetch(`/api/crew/applications?id=${applicationId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '지원 철회에 실패했습니다.');
      }
      await fetchSchedule();
    } catch (err: unknown) {
      alert((err as Error).message || '지원 철회 중 오류가 발생했습니다.');
    } finally {
      setWithdrawingId(null);
    }
  };

  // Convert status to CrewLinkStatus badge
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
      case 'applied':
        return 'APPLIED';
      case 'approved':
        return 'ACCEPTED';
      case 'rejected':
        return 'REJECTED';
      case 'withdrawn':
        return 'CANCELLED';
      default:
        return 'APPLIED';
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-5 w-full space-y-4 pb-20">
      <div>
        <h1 className="text-xl font-bold text-ink">내 활동 및 일정</h1>
        <p className="text-xs text-muted mt-0.5">선발된 확정 일정과 지원 현황을 확인해요.</p>
      </div>

      {/* Segment Tabs */}
      <div className="flex bg-surface-muted p-1 rounded-xl border border-border text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          className={cn(
            'flex-1 py-2 rounded-lg transition-all text-center',
            activeTab === 'assignments'
              ? 'bg-surface text-brand shadow-xs font-extrabold'
              : 'text-muted hover:text-ink'
          )}
        >
          확정된 현장 ({assignments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('applied')}
          className={cn(
            'flex-1 py-2 rounded-lg transition-all text-center',
            activeTab === 'applied'
              ? 'bg-surface text-brand shadow-xs font-extrabold'
              : 'text-muted hover:text-ink'
          )}
        >
          지원 현황 ({applications.length})
        </button>
      </div>

      {/* Loading & Error State */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-muted gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
          <span className="text-xs">내 일정을 조회하는 중...</span>
        </div>
      ) : errorMessage ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={fetchSchedule}
            className="px-2 py-1 bg-white rounded font-bold text-red-600 border border-red-200"
          >
            다시 시도
          </button>
        </div>
      ) : activeTab === 'assignments' ? (
        // Confirmed Assignments View
        assignments.length === 0 ? (
          <div className="py-16 bg-surface border border-border rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-ink">아직 확정된 일정이 없어요</p>
              <p className="text-xs text-muted mt-1">
                원하는 현장에 지원하고 선발 결과를 기다려 보세요.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-inverse text-xs font-bold rounded-xl shadow-xs hover:bg-brand-hover transition-colors"
            >
              <span>새로운 현장 둘러보기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-surface border border-border rounded-2xl shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <StatusBadge status={mapStatus(item.status)} size="sm" />
                  <span className="text-sm font-extrabold text-ink tabular-nums">
                    {item.dailyWage.toLocaleString()}원
                  </span>
                </div>
                <div>
                  <h2 className="font-bold text-ink text-sm">{item.projectTitle}</h2>
                  <p className="text-xs text-muted font-medium mt-0.5">{item.hostName}</p>
                </div>
                <div className="text-xs text-muted space-y-1.5 pt-2 border-t border-border-subtle">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span>
                      {item.date} ({item.startTime} ~ {item.endTime})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span className="truncate">
                      {item.venueName} · {item.roadAddress}
                    </span>
                  </div>
                </div>
                <div className="pt-1 flex justify-end">
                  <Link
                    href="/crew"
                    className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
                  >
                    <span>출발 및 현장 안내 보기</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Applications View
        applications.length === 0 ? (
          <div className="py-16 bg-surface border border-border rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-ink">지원한 내역이 없어요</p>
              <p className="text-xs text-muted mt-1">다양한 행사 공고를 확인하고 지원해 보세요.</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-inverse text-xs font-bold rounded-xl shadow-xs hover:bg-brand-hover transition-colors"
            >
              <span>공고 보러 가기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-4 bg-surface border border-border rounded-2xl shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <StatusBadge status={mapStatus(app.status)} size="sm" />
                  <span className="text-sm font-bold text-ink tabular-nums">
                    {app.dailyWage.toLocaleString()}원
                  </span>
                </div>
                <div>
                  <h2 className="font-bold text-ink text-sm">{app.projectTitle}</h2>
                  <p className="text-xs text-muted font-medium mt-0.5">{app.hostName}</p>
                </div>
                <div className="text-xs text-muted space-y-1.5 pt-2 border-t border-border-subtle">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span>근무일: {app.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span className="truncate">{app.venueName}</span>
                  </div>
                </div>

                {/* Withdraw action only if status === 'applied' */}
                {app.status === 'applied' && (
                  <div className="pt-2 border-t border-border-subtle flex justify-end">
                    <button
                      type="button"
                      disabled={withdrawingId === app.id}
                      onClick={() => handleWithdraw(app.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {withdrawingId === app.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Undo2 className="w-3 h-3" />
                      )}
                      <span>지원 철회</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
