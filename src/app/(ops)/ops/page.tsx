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
      title: 'QR 확인이 어려워요 · 도착 확인 요청',
      crewName: '김크루',
      shiftName: '2026 서울 모빌리티 엑스포 · 리셉션',
      venueName: '코엑스 3층 D홀',
      reportedAt: '12:35 · 5분 전',
      version: 1,
      details: '조명 반사로 QR을 읽지 못했어요. 코엑스 3층 D홀 입구에서 확인을 기다려요.',
      urgency: 'high',
    },
    {
      id: '99999999-9999-9999-9999-999999999999',
      type: 'T30_VACANCY_ALERT',
      title: '시작 30분 전 · 출발 확인 필요',
      crewName: '한유진',
      shiftName: '2026 서울 모빌리티 엑스포 · 무대 대기열 관리',
      venueName: '코엑스 3층 D홀',
      reportedAt: '12:30 · 10분 전',
      version: 1,
      details: '시작 30분 전까지 출발 여부가 확인되지 않았어요. 먼저 참여 여부를 확인하고, 필요하면 대타를 제안해 주세요.',
      urgency: 'high',
    },
    {
      id: 'task-03',
      type: 'UNCONFIRMED_DEPARTURE',
      title: '집합 15분 경과 · 도착 확인 필요',
      crewName: '윤소영',
      shiftName: '체험 부스 · 인솔',
      venueName: '코엑스 3층 D홀',
      reportedAt: '12:45',
      version: 2,
      details: '12:10에 출발했지만 도착 확인이 아직 없어요.',
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
    { id: '11111111-1111-1111-1111-111111111111', name: '김하늘', distance: '1.2km', rating: '★ 4.96', total: 24, status: '대기 중' },
    { id: 'cand-2', name: '송민우', distance: '2.1km', rating: '★ 4.88', total: 15, status: '대기 중' },
    { id: 'cand-3', name: '임서아', distance: '3.0km', rating: '★ 4.92', total: 31, status: '대기 중' },
  ]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>('11111111-1111-1111-1111-111111111111');
  const [isDispatching, setIsDispatching] = useState(false);

  // O02 Handle Resolve with optimistic lock (version check) & mandatory reason
  const handleApprove = async () => {
    if (!selectedTask) return;
    if (!resolutionReason.trim()) {
      setErrorMessage('확인한 내용과 처리 이유를 적어주세요.');
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
        throw new Error(data.message || '처리를 마치지 못했어요. 잠시 후 다시 시도해 주세요.');
      }

      // Remove resolved task from inbox queue
      setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
      setSelectedTask(null);
      setResolutionReason('');
      setSuccessToast(`${selectedTask.crewName} 님의 요청을 승인했어요.`);
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
        throw new Error(data.message || '제안을 보내지 못했어요. 잠시 후 다시 시도해 주세요.');
      }

      setShowReplacementModal(false);
      setTasks((prev) => prev.filter((t) => t.type !== 'T30_VACANCY_ALERT'));
      const matchedName = candidateList.find((c) => c.id === selectedCandidate)?.name || '후보 크루';
      setSuccessToast(`${matchedName} 님에게 제안을 보냈어요. 수락 여부를 확인해 주세요.`);
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
              <span className="text-xs font-bold text-brand-strong bg-brand-subtle px-2.5 py-0.5 rounded-full uppercase">
                작업함
              </span>
              <span className="text-xs text-muted">확인이 필요한 현장 소식</span>
            </div>
            <h1 className="text-2xl font-bold text-ink mt-1">지금 확인할 일</h1>
            <p className="text-xs text-muted mt-0.5">
              도착 확인과 인원 변동을 확인하고, 필요한 조치를 이어가세요.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowReplacementModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 min-h-[52px] bg-brand hover:bg-brand-hover text-inverse text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>대타 찾기</span>
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="p-4 bg-brand-subtle border border-brand-border text-brand-strong rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-strong" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Queue Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-2 text-xs">
          {[
            { key: 'ALL', label: `전체 ${tasks.length}` },
            { key: 'MANUAL', label: `도착 확인 ${tasks.filter((t) => t.type === 'MANUAL_FACE_TO_FACE').length}` },
            { key: 'T30', label: `인원 확인 ${tasks.filter((t) => t.type === 'T30_VACANCY_ALERT').length}` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveQueue(tab.key as any)}
              className={cn(
                'px-3.5 py-2 rounded-lg font-medium transition-colors',
                activeQueue === tab.key
                  ? 'bg-brand-soft text-brand-strong font-bold'
                  : 'text-muted hover:bg-surface-muted'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Task List (O01) */}
        {filteredTasks.length === 0 ? (
          <div className="p-12 bg-surface border border-border rounded-2xl text-center text-muted text-sm">
            <CheckCircle2 className="w-10 h-10 text-brand-strong mx-auto mb-2 opacity-80" />
            <div className="font-bold text-muted">확인할 일을 모두 마쳤어요</div>
            <div className="text-xs text-muted mt-1">새 요청이 오면 이곳에 보여드려요.</div>
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
                  'p-4 bg-surface border rounded-xl hover:shadow-xs cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4',
                  task.urgency === 'high' ? 'border-brand bg-brand-subtle' : 'border-border'
                )}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-[11px] font-bold px-2 py-0.5 rounded-md',
                        task.type === 'MANUAL_FACE_TO_FACE'
                          ? 'bg-brand-soft text-brand-strong'
                          : task.type === 'T30_VACANCY_ALERT'
                          ? 'bg-brand-soft text-brand-strong'
                          : 'bg-surface-muted text-muted'
                      )}
                    >
                      {task.type === 'MANUAL_FACE_TO_FACE'
                        ? '도착 확인'
                        : task.type === 'T30_VACANCY_ALERT'
                        ? '인원 확인'
                        : '도착 미확인'}
                    </span>
                    <span className="text-xs text-muted">{task.reportedAt}</span>
                  </div>

                  <h3 className="font-bold text-ink text-sm">{task.title}</h3>
                  <p className="text-xs text-muted line-clamp-1">{task.details}</p>

                  <div className="text-xs text-muted flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1">
                    <span className="inline-flex items-center gap-1 shrink-0">
                      <span className="text-muted">크루</span>
                      <strong className="font-bold text-ink">{task.crewName}</strong>
                    </span>
                    <span className="text-border-subtle" aria-hidden="true">·</span>
                    <span className="text-ink font-medium">{task.shiftName}</span>
                    <span className="text-border-subtle" aria-hidden="true">·</span>
                    <span>{task.venueName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end self-end md:self-center shrink-0 pt-2 md:pt-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-soft text-brand-strong text-xs font-bold hover:bg-brand hover:text-inverse transition-colors shadow-2xs">
                    <span>확인하기</span>
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
          title={selectedTask?.title || '요청 확인'}
          description="요청 내용과 확인 근거를 살펴보고 처리해 주세요."
          side="right"
        >
          {selectedTask && (
            <div className="flex flex-col h-full justify-between">
              {/* Sheet Body */}
              <div className="p-5 space-y-4 flex-1 overflow-y-auto text-xs">
                {/* Concurrency Lock indicator */}
                <div className="p-3 bg-canvas border border-border rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted" />
                    <span className="font-semibold text-muted">다른 운영자가 먼저 처리했는지 확인해요</span>
                  </div>
                </div>

                {/* Target info */}
                <div className="space-y-2.5 p-3.5 bg-canvas border border-border-subtle rounded-xl text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted shrink-0 whitespace-nowrap">크루</span>
                    <span className="font-bold text-ink text-right">{selectedTask.crewName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted shrink-0 whitespace-nowrap">행사</span>
                    <span className="text-ink text-right break-keep">{selectedTask.shiftName}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 pt-2 border-t border-border-subtle">
                    <span className="text-muted shrink-0 whitespace-nowrap pt-0.5">요청 내용</span>
                    <span className="font-medium text-ink text-right break-keep leading-relaxed flex-1">
                      {selectedTask.details}
                    </span>
                  </div>
                </div>

                {/* Mandatory Resolution Reason Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink block">
                    확인 내용과 처리 이유 <span className="text-brand">필수</span>
                  </label>
                  <textarea
                    value={resolutionReason}
                    onChange={(e) => setResolutionReason(e.target.value)}
                    placeholder="예: 현장 데스크에서 본인과 도착 여부를 확인했어요"
                    className="w-full h-24 p-3 border border-border rounded-xl text-xs text-ink bg-surface focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                  <p className="text-[11px] text-muted">
                    처리 이유는 변경 이력에 남아요.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-error-bg border border-error-border rounded-xl text-error text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Sheet Actions */}
              <div className="p-5 border-t border-border-subtle bg-canvas flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="flex-1 min-h-[52px] border border-border bg-surface text-muted font-bold text-xs rounded-xl hover:bg-canvas"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isProcessing || !resolutionReason.trim()}
                  className="flex-1 min-h-[52px] bg-brand hover:bg-brand-hover text-inverse font-bold text-xs rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isProcessing ? '승인하는 중…' : '승인하기'}</span>
                </button>
              </div>
            </div>
          )}
        </AccessibleSheet>

        {/* O03 Accessible Emergency Replacement Modal */}
        <AccessibleSheet
          open={showReplacementModal}
          onOpenChange={setShowReplacementModal}
          title="대타를 제안해 주세요"
          description="함께할 수 있는 크루를 골라 제안을 보내세요. 수락 후 배정 여부를 확인해 주세요."
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
                      ? 'border-brand bg-brand-subtle font-bold'
                      : 'border-border hover:border-border'
                  )}
                >
                  <div>
                    <div className="text-sm font-bold text-ink">{cand.name}</div>
                    <div className="text-muted mt-0.5">
                      거리 {cand.distance} · 평점 {cand.rating} · 함께한 현장 {cand.total}회
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-brand font-semibold bg-brand-subtle px-2 py-1 rounded">
                      후보 크루
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-surface-muted border border-neutral-border rounded-xl text-[11px] text-muted leading-relaxed">
              제안을 보낸 뒤 수락 여부를 확인해 주세요. 배정 결과와 알림 발송 상태는 각각 확인해요.
            </div>

            {errorMessage && (
              <div className="p-3 bg-error-bg border border-error-border rounded-xl text-error text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowReplacementModal(false)}
                className="flex-1 min-h-[52px] border border-border rounded-xl text-xs font-bold text-muted hover:bg-canvas"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleDispatchReplacement}
                disabled={!selectedCandidate || isDispatching}
                className="flex-1 min-h-[52px] bg-brand hover:bg-brand-hover text-inverse rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{isDispatching ? '제안 보내는 중…' : '대타 제안 보내기'}</span>
              </button>
            </div>
          </div>
        </AccessibleSheet>
      </div>
    </AppShell>
  );
}
