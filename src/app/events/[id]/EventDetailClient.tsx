'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Share2,
  AlertCircle,
  Building2,
  BadgeCheck,
  Briefcase,
  ChevronRight,
  Sparkles,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { getEventById, formatRecruitmentDeadline } from '@/lib/data/events';
import { AccessibleSheet } from '@/components/common/AccessibleSheet';
import { cn } from '@/lib/utils';

function generateEventDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates.length > 0 ? dates : [startDate];
}

function formatDateShort(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[1]}.${parts[2]}`;
  }
  return dateStr;
}

export default function EventDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const event = getEventById(id);

  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Available event dates
  const allEventDates = useMemo(() => {
    return event ? generateEventDates(event.startDate, event.endDate) : [];
  }, [event]);

  // Selected dates for attendance (defaults to all event dates)
  const [selectedDates, setSelectedDates] = useState<string[]>(allEventDates);

  // Application form state: confirmNotice default false (Task 4.3 requirement)
  const [applicantName, setApplicantName] = useState('김크루');
  const [applicantPhone, setApplicantPhone] = useState('010-8291-3829');
  const [confirmNotice, setConfirmNotice] = useState(false);

  if (!event) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-surface border border-border flex items-center justify-center text-muted mb-4 shadow-xs">
          <AlertCircle className="w-8 h-8 text-brand" />
        </div>
        <h1 className="text-xl font-bold text-ink mb-1.5">현장 공고를 찾을 수 없어요</h1>
        <p className="text-xs text-muted mb-6 max-w-sm">
          이미 마감되었거나 주소가 변경되었을 수 있어요. 메인 화면에서 다른 현장을 확인해 보세요.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-inverse text-xs font-bold transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>전체 현장 목록으로</span>
        </Link>
      </div>
    );
  }

  // Dynamic wage calculation: dailyWageWon * selectedDates.length (Task 4.1 requirement)
  const totalWageWon = event.dailyWageWon * Math.max(1, selectedDates.length);
  // Break minutes nullish coalescing: breakMinutes ?? 60 (Task 4.2 requirement)
  const displayBreakMinutes = event.breakMinutes ?? 60;
  const deadlineLabel = formatRecruitmentDeadline(event.deadlineDate);

  const toggleDate = (dateStr: string) => {
    if (event.isMultiDayRequired) return; // 전일 필수 근무인 경우 고정
    setSelectedDates((prev) => {
      if (prev.includes(dateStr)) {
        if (prev.length <= 1) return prev; // 최소 1일 선택 유지
        return prev.filter((d) => d !== dateStr);
      } else {
        return [...prev, dateStr].sort();
      }
    });
  };

  const handleCopyAddress = () => {
    const textToCopy = event.detailedAddress || `${event.regionLabel} ${event.stationInfo || ''}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Real DB application submission calling POST /api/crew/applications (Task 4.3 requirement)
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmNotice) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/crew/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-person-id': '11111111-1111-1111-1111-111111111111',
        },
        body: JSON.stringify({
          eventId: event.id,
          applicantName,
          applicantPhone,
          agreeNotice: confirmNotice,
          selectedDates,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '지원 접수에 실패했어요. 잠시 후 다시 시도해 주세요.');
      }

      setHasApplied(true);
    } catch (err: unknown) {
      setSubmitError((err as Error).message || '서버와 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink pb-32">
      {/* Top Sticky Navigation Bar */}
      <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>공고 목록으로</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="공고 링크 복사"
            className="h-8 px-2.5 rounded-lg border border-border bg-surface hover:bg-canvas text-xs font-semibold text-muted hover:text-ink transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-brand" />
                <span className="text-brand">복사됨</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">공유</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Category & Deadline Pill Header */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-muted bg-surface-muted px-2.5 py-1 rounded-full border border-border-subtle">
            {event.categoryLabel}
          </span>
          <span className="text-xs font-bold text-brand-strong bg-brand-soft px-2.5 py-1 rounded-md border border-brand-border">
            {deadlineLabel}
          </span>
        </div>

        {/* Hero Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight leading-snug break-keep">
            {event.title}
          </h1>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted">
            <span className="font-semibold text-ink flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-muted" />
              {event.hostName}
            </span>
            {event.hostVerified && (
              <span className="inline-flex items-center gap-0.5 text-brand-strong font-bold text-[11px] bg-brand-soft px-1.5 py-0.5 rounded-md border border-brand-border">
                <BadgeCheck className="w-3 h-3 text-brand" />
                <span>인증 주최사</span>
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Wage Highlight Box */}
        <div className="p-5 sm:p-6 rounded-3xl bg-brand-subtle border border-brand-border shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-muted tracking-wider uppercase">
                선택 근무일 비례 예상 보수
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xs font-bold text-muted">
                  {selectedDates.length > 1 ? `${selectedDates.length}일간 합산` : '하루'}
                </span>
                <span className="text-3xl sm:text-4xl font-black text-brand-strong tabular-nums">
                  {totalWageWon.toLocaleString()}
                </span>
                <span className="text-base font-bold text-ink">원</span>
                <span className="text-xs text-muted ml-1 font-medium">(세전)</span>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-bold text-brand-strong bg-surface px-2.5 py-1 rounded-lg border border-brand-border inline-block shadow-2xs">
                하루 기준 {event.dailyWageWon.toLocaleString()}원
              </span>
            </div>
          </div>

          {/* Date Selector Chips for Multi-Day */}
          {allEventDates.length > 1 && (
            <div className="pt-2 border-t border-brand-border/60">
              <p className="text-xs font-semibold text-ink mb-1.5 flex items-center justify-between">
                <span>근무 일정 선택 ({selectedDates.length}일 선택됨)</span>
                {event.isMultiDayRequired && (
                  <span className="text-[11px] text-brand font-bold">전일 연속 근무 필수</span>
                )}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allEventDates.map((dateStr) => {
                  const isSelected = selectedDates.includes(dateStr);
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      disabled={event.isMultiDayRequired}
                      onClick={() => toggleDate(dateStr)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border',
                        isSelected
                          ? 'bg-brand text-inverse border-brand shadow-2xs'
                          : 'bg-surface text-muted border-border hover:border-brand-border cursor-pointer',
                        event.isMultiDayRequired && 'cursor-default'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-inverse" />}
                      <span>{formatDateShort(dateStr)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-brand-border/60 flex items-center gap-2 text-xs text-muted">
            <Sparkles className="w-3.5 h-3.5 text-brand shrink-0" />
            <span>사업소득세(3.3%) 원천징수 후 근무 종료 시 계좌로 투명하게 입금돼요.</span>
          </div>
        </div>

        {/* Core Schedule & Location Info Grid */}
        <div className="bg-surface rounded-3xl border border-border p-5 sm:p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-ink tracking-tight flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand" />
            <span>근무 핵심 요약</span>
          </h2>

          <div className="divide-y divide-border-subtle text-xs sm:text-sm">
            {/* 1. 장소 */}
            <div className="py-3 flex items-start justify-between gap-3 first:pt-0">
              <div className="flex items-center gap-2 text-muted shrink-0 w-20">
                <MapPin className="w-4 h-4 text-muted" />
                <span>장소</span>
              </div>
              <div className="text-right flex-1 min-w-0">
                <p className="font-bold text-ink">
                  {event.regionLabel} {event.stationInfo ? `· ${event.stationInfo}` : ''}
                </p>
                {event.detailedAddress && (
                  <p className="text-xs text-muted mt-0.5 break-keep">{event.detailedAddress}</p>
                )}
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedAddress ? '주소 복사됨!' : '상세 주소 복사'}</span>
                </button>
              </div>
            </div>

            {/* 2. 날짜 */}
            <div className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-muted shrink-0 w-20">
                <Calendar className="w-4 h-4 text-muted" />
                <span>날짜</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-ink">{event.dateRangeLabel}</span>
                {event.isMultiDayRequired && (
                  <span className="ml-2 text-[11px] font-semibold text-brand bg-brand-soft px-2 py-0.5 rounded-md border border-brand-border">
                    전일 연속 근무
                  </span>
                )}
              </div>
            </div>

            {/* 3. 시간 & 휴게시간 널 병합 (breakMinutes ?? 60) */}
            <div className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-muted shrink-0 w-20">
                <Clock className="w-4 h-4 text-muted" />
                <span>시간</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-ink">{event.workHoursLabel}</span>
                <span className="text-xs text-muted ml-1.5">
                  (휴게 {displayBreakMinutes}분 포함)
                </span>
              </div>
            </div>

            {/* 4. 모집 인원 */}
            <div className="py-3 flex items-center justify-between gap-3 last:pb-0">
              <div className="flex items-center gap-2 text-muted shrink-0 w-20">
                <Users className="w-4 h-4 text-muted" />
                <span>모집 인원</span>
              </div>
              <div className="text-right font-medium">
                <span className="font-bold text-ink">총 {event.requiredCount}명</span>
                <span className="text-xs text-brand font-semibold ml-2">
                  (현재 {event.confirmedCount}명 배정 완료)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        {event.description && (
          <div className="bg-surface rounded-3xl border border-border p-5 sm:p-6 shadow-2xs space-y-2.5">
            <h2 className="text-sm font-bold text-ink">현장 소개</h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed break-keep">
              {event.description}
            </p>
          </div>
        )}

        {/* Primary Role Details */}
        <div className="bg-surface rounded-3xl border border-border p-5 sm:p-6 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-ink">담당할 주요 업무</h2>
          <div className="space-y-2">
            {(event.roleDetails || event.primaryRoles.map((r) => ({ role: r, desc: '현장 운영 보조 및 관람객 응대' }))).map(
              (item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-canvas border border-border flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-lg bg-brand-soft text-brand-strong font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-ink">{item.role}</h3>
                    <p className="text-xs text-muted mt-0.5 break-keep leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Uniform & Requirements */}
        <div className="bg-surface rounded-3xl border border-border p-5 sm:p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-ink">복장 및 지원 자격</h2>

          {event.uniformSpec && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted block">복장 안내</span>
              <p className="text-xs sm:text-sm font-medium text-ink bg-canvas p-3 rounded-xl border border-border">
                {event.uniformSpec}
              </p>
            </div>
          )}

          {event.qualifications && event.qualifications.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-semibold text-muted block">우대 사항</span>
              <ul className="space-y-1 text-xs text-muted list-disc list-inside">
                {event.qualifications.map((q, idx) => (
                  <li key={idx} className="break-keep">
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Crew Protection Banner */}
        <div className="p-5 rounded-3xl bg-surface border border-border flex items-start gap-3.5 shadow-2xs">
          <ShieldCheck className="w-6 h-6 text-brand shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-muted leading-relaxed">
            <h3 className="font-bold text-ink text-xs sm:text-sm">크루 권익 보호 보장</h3>
            <p className="break-keep">
              크루링크는 표준 SOW 전자 도급계약을 체결하며, 근로기준법 제20조에 따라 지각·노쇼를
              이유로 사전에 정한 위약금을 보수에서 임의로 공제하지 않습니다.
            </p>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-md border-t border-border px-4 py-3.5 shadow-lg shadow-black/5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-muted">
              {selectedDates.length > 1 ? `${selectedDates.length}일 합산 보수` : '하루 보수'} · 세전
            </p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-brand-strong tabular-nums">
                {totalWageWon.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-ink">원</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            disabled={hasApplied}
            className={cn(
              'min-h-[48px] h-12 px-6 sm:px-8 rounded-2xl font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer',
              hasApplied
                ? 'bg-surface-muted text-muted cursor-not-allowed border border-border'
                : 'bg-brand hover:bg-brand-hover text-inverse shadow-brand/20'
            )}
          >
            {hasApplied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-brand-strong" />
                <span>지원 완료</span>
              </>
            ) : (
              <>
                <span>이 현장 지원하기</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* AccessibleSheet (Radix Dialog: Focus Trap, ESC close, accessible title) */}
      <AccessibleSheet
        open={isApplyModalOpen}
        onOpenChange={setIsApplyModalOpen}
        side="center"
        title="현장 참여 지원 신청"
        description="지원 내용을 확인하고 최종 접수해 주세요."
      >
        <div className="p-6">
          {hasApplied ? (
            <div className="py-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-brand-soft text-brand-strong mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-brand" />
              </div>
              <h4 className="font-bold text-base text-ink">지원이 정상적으로 접수되었어요!</h4>
              <p className="text-xs text-muted leading-relaxed break-keep">
                주최사에서 배정이 확정되면 카카오 알림톡으로 표준 계약서 서명 안내를 보내드려요.
              </p>
              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-border bg-surface text-ink text-xs font-bold hover:bg-canvas transition-colors"
                >
                  공고 상세 보기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsApplyModalOpen(false);
                    router.push('/crew');
                  }}
                  className="flex-1 h-11 bg-brand hover:bg-brand-hover text-inverse text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  크루 일정 화면으로
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
              {submitError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="leading-tight">{submitError}</span>
                </div>
              )}

              {/* Event Summary Card */}
              <div className="p-3.5 rounded-2xl bg-canvas border border-border space-y-1">
                <p className="font-bold text-ink text-sm truncate">{event.displayTitle}</p>
                <p className="text-muted">
                  {event.dateRangeLabel} · {event.workHoursLabel} (휴게 {displayBreakMinutes}분)
                </p>
                <p className="text-brand font-bold">
                  {selectedDates.length}일간 합산 약정 보수: {totalWageWon.toLocaleString()}원
                </p>
              </div>

              {/* Applicant info */}
              <div className="space-y-2.5">
                <div>
                  <label htmlFor="sheet-applicant-name" className="font-bold text-ink block mb-1">
                    지원자 이름
                  </label>
                  <input
                    id="sheet-applicant-name"
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-ink text-xs focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label htmlFor="sheet-applicant-phone" className="font-bold text-ink block mb-1">
                    연락처
                  </label>
                  <input
                    id="sheet-applicant-phone"
                    type="tel"
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-ink text-xs focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Agreement Checkbox: Defaults to FALSE */}
              <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmNotice}
                  onChange={(e) => setConfirmNotice(e.target.checked)}
                  required
                  className="mt-0.5 rounded text-brand focus:ring-brand w-4 h-4"
                />
                <span className="text-muted leading-snug">
                  행사 일정과 근무 시간을 확인했으며, 배정 시 노쇼 없이 성실히 참여할 것을 약속해요. (필수)
                </span>
              </label>

              {/* Action buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-border text-muted font-bold hover:bg-canvas transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !confirmNotice}
                  className="flex-1 h-11 rounded-xl bg-brand hover:bg-brand-hover text-inverse font-bold transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '접수하는 중…' : '지원 접수하기'}
                </button>
              </div>
            </form>
          )}
        </div>
      </AccessibleSheet>
    </div>
  );
}
