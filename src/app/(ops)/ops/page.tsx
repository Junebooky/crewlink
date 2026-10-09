'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/common/AppShell';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AccessibleSheet } from '@/components/common/AccessibleSheet';
import {
  Inbox,
  AlertTriangle,
  UserCheck,
  Send,
  X,
  Lock,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InboxTask {
  id: string;
  type: 'MANUAL_FACE_TO_FACE' | 'T30_VACANCY_ALERT' | 'UNCONFIRMED_DEPARTURE';
  title: string;
  crewName: string;
  shiftName: string;
  venueName: string;
  reportedAt: string;
  version: number; // Concurrency lock key
  details: string;
  urgency: 'high' | 'medium';
}

export default function OpsDashboardPage() {
  const [activeQueue, setActiveQueue] = useState<'ALL' | 'MANUAL' | 'T30'>('ALL');

  // Inbox Task Queue
  const [tasks, setTasks] = useState<InboxTask[]>([
    {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      type: 'MANUAL_FACE_TO_FACE',
      title: '현장 카메라 인식 불가 - 대면 출근 확인 요청',
      crewName: '김*루',
      shiftName: '2026 서울 모빌리티 엑스포 (리셉션)',
      venueName: '코엑스 3층 D홀',
      reportedAt: '12:35 (5분 전)',
      version: 1,
      details: '조명 반사로 QR 스캔 실패. 현장 데스크 3층 D홀 입구 대기 중.',
      urgency: 'high',
    },
    {
      id: '99999999-9999-9999-9999-999999999999',
      type: 'T30_VACANCY_ALERT',
      title: 'T-30 결원 주의 경보: 출발 미확인',
      crewName: '한*진',
      shiftName: '2026 서울 모빌리티 엑스포 (무대 대기열 통제)',
      venueName: '코엑스 3층 D홀',
      reportedAt: '12:30 (10분 전)',
      version: 1,
      details: '행사 시작 30분 전까지 [출발했어요] 미입력 상태. 긴급 대타 파견 후보 조회 필요.',
      urgency: 'high',
    },
    {
      id: 'task-03',
      type: 'UNCONFIRMED_DEPARTURE',
      title: '집합 시각 15분 경과 미도착 알림',
      crewName: '윤*영',
      shiftName: '체험 부스 인솔 가이드',
      venueName: '코엑스 3층 D홀',
      reportedAt: '12:45',
      version: 2,
      details: '12:10 출발 기록 후 현장 도착 QR 스캔 미완료 상태.',
      urgency: 'medium',
    },
  ]);

  // O02 Slide-over Sheet State
  const [selectedTask, setSelectedTask] = useState<InboxTask | null>(null);
  const [resolutionReason, setResolutionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // O03 Emergency Replacement State
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [candidateList, setCandidateList] = useState([
    { id: '11111111-1111-1111-1111-111111111111', name: '김*루', distance: '1.2km', rating: '★ 4.96', total: 24, status: '대기 중' },
    { id: 'cand-2', name: '송*우', distance: '2.1km', rating: '★ 4.88', total: 15, status: '대기 중' },
    { id: 'cand-3', name: '임*아', distance: '3.0km', rating: '★ 4.92', total: 31, status: '대기 중' },
  ]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>('11111111-1111-1111-1111-111111111111');
  const [isDispatching, setIsDispatching] = useState(false);

  // O02 Handle Resolve with optimistic lock (version check) & mandatory reason
  const handleApprove = async () => {
    if (!selectedTask) return;
    if (!resolutionReason.trim()) {
      setErrorMessage('예외 승인 처리 시 [처리 사유] 입력은 필수입니다.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ops/resolve-exception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedTask.id,
          expectedVersion: selectedTask.version,
          reason: resolutionReason,
          action: 'APPROVE',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '처리 중 오류가 발생했습니다.');
      }

      // Remove resolved task from inbox queue
      setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
      setSelectedTask(null);
      setResolutionReason('');
      setSuccessToast(`[${selectedTask.crewName}] 건이 정상 승인 완료되었습니다.`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  // O03 Handle Atomic Replacement Dispatch
  const handleDispatchReplacement = async () => {
    if (!selectedCandidate) return;
    setIsDispatching(true);
    try {
      const res = await fetch('/api/ops/dispatch-replacement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: '99999999-9999-9999-9999-999999999999',
          candidatePersonId: selectedCandidate,
          expectedVersion: 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '대타 제안 실패');
      }

      setShowReplacementModal(false);
      setTasks((prev) => prev.filter((t) => t.type !== 'T30_VACANCY_ALERT'));
      const matchedName = candidateList.find((c) => c.id === selectedCandidate)?.name || '후보 크루';
      setSuccessToast(`긴급 대타 [${matchedName}] 님에게 대타 제안이 안전하게 전송되었습니다.`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsDispatching(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeQueue === 'MANUAL') return t.type === 'MANUAL_FACE_TO_FACE';
    if (activeQueue === 'T30') return t.type === 'T30_VACANCY_ALERT';
    return true;
  });

  return (
    <AppShell initialRole="ops">
      <div className="max-w-5xl mx-auto px-4 py-6 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full uppercase">
                O01 작업함 (INBOX)
              </span>
              <span className="text-xs text-slate-500">실시간 예외 큐 관제</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">현장 운영 관제 작업함</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              미확인 출근, T-30 결원 경보 및 대면 수동 확인 요청을 안전하게 심사·승인합니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowReplacementModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 min-h-[52px] bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>O03 긴급 대타 파견 모듈</span>
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Queue Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
          {[
            { key: 'ALL', label: `전체 작업 (${tasks.length})` },
            { key: 'MANUAL', label: `수동 대면 확인 요청 (${tasks.filter((t) => t.type === 'MANUAL_FACE_TO_FACE').length})` },
            { key: 'T30', label: `T-30 결원 경보 (${tasks.filter((t) => t.type === 'T30_VACANCY_ALERT').length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveQueue(tab.key as any)}
              className={cn(
                'px-3.5 py-2 rounded-lg font-medium transition-colors',
                activeQueue === tab.key
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Task List (O01) */}
        {filteredTasks.length === 0 ? (
          <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center text-slate-400 text-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <div className="font-bold text-slate-700">모든 예외 작업이 처리되었습니다</div>
            <div className="text-xs text-slate-400 mt-1">대기 중인 긴급 큐가 없습니다.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => {
                  setSelectedTask(task);
                  setErrorMessage(null);
                  setResolutionReason('');
                }}
                className={cn(
                  'p-4 bg-white border rounded-xl hover:shadow-sm cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4',
                  task.urgency === 'high' ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                )}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-[11px] font-bold px-2 py-0.5 rounded-md',
                        task.type === 'MANUAL_FACE_TO_FACE'
                          ? 'bg-blue-100 text-blue-700'
                          : task.type === 'T30_VACANCY_ALERT'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      )}
                    >
                      {task.type === 'MANUAL_FACE_TO_FACE'
                        ? '대면 확인 요청'
                        : task.type === 'T30_VACANCY_ALERT'
                        ? 'T-30 결원 경보'
                        : '미도착 알림'}
                    </span>
                    <span className="text-xs text-slate-400">{task.reportedAt}</span>
                    <span className="text-[10px] font-mono text-slate-400 border px-1.5 rounded">
                      Lock v{task.version}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{task.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-1">{task.details}</p>

                  <div className="text-xs text-slate-500 flex items-center gap-3 pt-1">
                    <span>크루: <strong className="text-slate-800">{task.crewName}</strong></span>
                    <span>• {task.shiftName}</span>
                    <span>• {task.venueName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-[#1E60F3] hover:underline flex items-center gap-1">
                    <span>심사하기</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* O02 Accessible Slide-over Sheet */}
        <AccessibleSheet
          open={Boolean(selectedTask)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTask(null);
              setErrorMessage(null);
              setResolutionReason('');
            }
          }}
          title={selectedTask?.title || '예외 심사'}
          description="현장 예외 요청을 심사하고 승인 또는 반려합니다."
          side="right"
        >
          {selectedTask && (
            <div className="flex flex-col h-full justify-between">
              {/* Sheet Body */}
              <div className="p-5 space-y-4 flex-1 overflow-y-auto text-xs">
                {/* Concurrency Lock indicator */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-slate-700">다른 운영자의 처리 여부를 확인해요</span>
                  </div>
                  <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                    Target Lock v{selectedTask.version}
                  </span>
                </div>

                {/* Target info */}
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">대상 크루</span>
                    <span className="font-bold text-slate-900">{selectedTask.crewName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">배정 행사</span>
                    <span>{selectedTask.shiftName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">요청 사유</span>
                    <span className="font-medium text-slate-900">{selectedTask.details}</span>
                  </div>
                </div>

                {/* Mandatory Resolution Reason Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    처리 사유 및 근거 기록 <span className="text-red-500">*필수</span>
                  </label>
                  <textarea
                    value={resolutionReason}
                    onChange={(e) => setResolutionReason(e.target.value)}
                    placeholder="예: 현장 안내데스크에서 신분증 및 본인 일치 확인 완료 후 수동 승인함."
                    className="w-full h-24 p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#1E60F3] focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400">
                    * 처리 사유는 공정 감사 로그(`audit_events`)에 영구 기록됩니다.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-[#FFF0F3] border border-[#FDC4D0] rounded-xl text-[#BB2449] text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Sheet Actions */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="flex-1 min-h-[52px] border border-slate-300 bg-white text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isProcessing || !resolutionReason.trim()}
                  className="flex-1 min-h-[52px] bg-[#1E60F3] hover:bg-[#164BC4] text-white font-bold text-xs rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isProcessing ? '처리 중...' : '예외 승인 완료'}</span>
                </button>
              </div>
            </div>
          )}
        </AccessibleSheet>

        {/* O03 Accessible Emergency Replacement Modal */}
        <AccessibleSheet
          open={showReplacementModal}
          onOpenChange={setShowReplacementModal}
          title="인근 활동 크루 배정"
          description="행사 시작 30분 전 결원 슬롯에 대해 인근 크루 1인을 대타 제안합니다."
          side="center"
        >
          <div className="p-6 space-y-5">
            {/* Nearby Candidate List */}
            <div className="space-y-2 text-xs">
              {candidateList.map((cand) => (
                <div
                  key={cand.id}
                  onClick={() => setSelectedCandidate(cand.id)}
                  className={cn(
                    'p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors',
                    selectedCandidate === cand.id
                      ? 'border-[#1E60F3] bg-blue-50/60 font-bold'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900">{cand.name}</div>
                    <div className="text-slate-500 mt-0.5">
                      거리 {cand.distance} • 평점 {cand.rating} • 수행 {cand.total}회
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#1E60F3] font-semibold bg-blue-50 px-2 py-1 rounded">
                      출발 가능
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-relaxed">
              * 배정 확정 시 `work_reservations` 중복 배정 배제 제약에 의해 동시 배정이 차단되며,
              알림톡으로 즉시 출발 지시가 전송됩니다.
            </div>

            {errorMessage && (
              <div className="p-3 bg-[#FFF0F3] border border-[#FDC4D0] rounded-xl text-[#BB2449] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowReplacementModal(false)}
                className="flex-1 min-h-[52px] border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleDispatchReplacement}
                disabled={!selectedCandidate || isDispatching}
                className="flex-1 min-h-[52px] bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{isDispatching ? '제안 전송 중...' : '대타 제안 보내기'}</span>
              </button>
            </div>
          </div>
        </AccessibleSheet>
      </div>
    </AppShell>
  );
}
