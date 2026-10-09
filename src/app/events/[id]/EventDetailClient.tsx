'use client';

import React, { useState } from 'react';
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
  X,
} from 'lucide-react';
import { getEventById, formatRecruitmentDeadline } from '@/lib/data/events';
import { cn } from '@/lib/utils';

export default function EventDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const event = getEventById(id);

  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Application form state
  const [applicantName, setApplicantName] = useState('김크루');
  const [applicantPhone, setApplicantPhone] = useState('010-8291-3829');
  const [confirmNotice, setConfirmNotice] = useState(true);

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

  const deadlineLabel = formatRecruitmentDeadline(event.deadlineDate);

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

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setHasApplied(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink pb-32">
      {/* Top Floating / Sticky Navigation Bar */}
      <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-border px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>목록으로</span>
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
          <span className="text-xs font-bold text-brand">{deadlineLabel}</span>
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

        {/* Daily Wage Highlight Box */}
        <div className="p-5 sm:p-6 rounded-3xl bg-brand-subtle border border-brand-border shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-muted tracking-wider uppercase">보수 안내</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xs font-bold text-muted">하루</span>
                <span className="text-3xl sm:text-4xl font-black text-ink tabular-nums">
                  {event.dailyWageWon.toLocaleString()}
                </span>
                <span className="text-base font-bold text-ink">원</span>
                <span className="text-xs text-muted ml-1 font-medium">(세전)</span>
              </div>
            </div>

            {event.isMultiDayRequired && (
              <div className="sm:text-right">
                <span className="text-xs font-bold text-brand-strong bg-white/80 px-2.5 py-1 rounded-lg border border-brand-border inline-block">
                  {event.dateRangeLabel.includes('3일') ? '3일간 총 약 360,000원' : '전일 참가 기준'}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-brand-border/60 flex items-center gap-2 text-xs text-muted">
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

            {/* 3. 시간 */}
            <div className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-muted shrink-0 w-20">
                <Clock className="w-4 h-4 text-muted" />
                <span>시간</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-ink">{event.workHoursLabel}</span>
                <span className="text-xs text-muted ml-1.5">
                  (휴게 {event.breakMinutes || 60}분 포함)
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

        {/* Crew Protection & Legal Safeguard Banner */}
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
            <p className="text-[11px] text-muted">하루 보수 · 세전</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-ink tabular-nums">
                {event.dailyWageWon.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-ink">원</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            disabled={hasApplied}
            className={cn(
              'h-12 px-6 sm:px-8 rounded-2xl font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer',
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

      {/* Application Confirmation Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-md rounded-3xl border border-border p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-brand uppercase tracking-wider">
                  현장 참여 지원
                </span>
                <h3 className="text-lg font-bold text-ink mt-0.5">지원 내용을 확인해 주세요</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {hasApplied ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-brand-soft text-brand-strong mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-brand" />
                </div>
                <h4 className="font-bold text-base text-ink">지원이 정상적으로 접수되었어요!</h4>
                <p className="text-xs text-muted leading-relaxed break-keep">
                  주최사에서 배정이 확정되면 카카오 알림톡으로 표준 계약서 서명 안내를 보내드려요.
                </p>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsApplyModalOpen(false);
                      router.push('/crew');
                    }}
                    className="w-full h-11 bg-brand hover:bg-brand-hover text-inverse text-xs font-bold rounded-xl transition-colors shadow-xs"
                  >
                    크루 일정 화면으로 이동
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
                {/* Event Summary Card */}
                <div className="p-3.5 rounded-2xl bg-canvas border border-border space-y-1">
                  <p className="font-bold text-ink text-sm truncate">{event.displayTitle}</p>
                  <p className="text-muted">
                    {event.dateRangeLabel} · {event.workHoursLabel}
                  </p>
                  <p className="text-brand font-bold">
                    일급 {event.dailyWageWon.toLocaleString()}원
                  </p>
                </div>

                {/* Applicant info */}
                <div className="space-y-2.5">
                  <div>
                    <label className="font-bold text-ink block mb-1">지원자 이름</label>
                    <input
                      type="text"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-ink text-xs focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-ink block mb-1">연락처</label>
                    <input
                      type="tel"
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-ink text-xs focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                {/* Agreement Checkbox */}
                <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmNotice}
                    onChange={(e) => setConfirmNotice(e.target.checked)}
                    required
                    className="mt-0.5 rounded text-brand focus:ring-brand"
                  />
                  <span className="text-muted leading-tight">
                    행사 일정과 시간을 확인했으며, 배정 시 성실히 참여할 것을 약속해요.
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
                    className="flex-1 h-11 rounded-xl bg-brand hover:bg-brand-hover text-inverse font-bold transition-colors shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? '접수하는 중…' : '지원 완료하기'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
