'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Check,
  Share2,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ClayWallet3DAsset } from '@/components/assets/ClayWallet3DAsset';
import { AccessibleSheet } from '@/components/common/AccessibleSheet';
import { AccountMenu } from '@/components/common/AccountMenu';
import { getEventById, type EventItem } from '@/lib/data/events';

interface EventDetailProps {
  id?: string;
  event?: EventItem;
}

export default function EventDetailClient({ id, event }: EventDetailProps) {
  const router = useRouter();
  if (!event) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6 text-muted text-xs">
        공고 정보를 찾을 수 없습니다.
      </div>
    );
  }

  const [selectedDateIds, setSelectedDateIds] = useState<string[]>(
    event.dates.map((d) => d.id)
  );

  // 모달 상태 관리
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeRole, setActiveRole] = useState<'crew' | 'client' | 'ops'>('crew');
  const [sessionUser, setSessionUser] = useState<{
    fullName: string;
    email?: string;
    roles: string[];
    profileImageUrl?: string | null;
  } | null>(null);

  // 사용자 세션 기본값 프리필 (가능한 경우)
  useEffect(() => {
    async function loadSession() {
      try {
        const isExplicitlyLoggedOut =
          typeof window !== 'undefined' && localStorage.getItem('crewlink_logged_out') === 'true';
        if (isExplicitlyLoggedOut) return;

        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setSessionUser(data.user);
            if (data.user.fullName && !applicantName) {
              setApplicantName(data.user.fullName);
            }
          }
        }
      } catch {
        // 무시하고 수동 입력 지원
      }
    }
    loadSession();
  }, []);

  // 가로 스크롤 및 우측 화살표 인디케이터 관제
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollState = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    // 여유 마진 4px
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  };

  useEffect(() => {
    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    return () => window.removeEventListener('resize', checkScrollState);
  }, [event.dates]);

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 120, behavior: 'smooth' });
    }
  };

  const toggleDate = (dateId: string) => {
    setSelectedDateIds((prev) =>
      prev.includes(dateId)
        ? prev.length > 1
          ? prev.filter((item) => item !== dateId)
          : prev
        : [...prev, dateId]
    );
  };

  const totalEstimatedWage = event.dailyWageWon * selectedDateIds.length;
  const selectedDateObjects = event.dates.filter((d) => selectedDateIds.includes(d.id));

  // 전화번호 자동 포맷팅 (010-XXXX-XXXX)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
    if (raw.length <= 3) {
      setApplicantPhone(raw);
    } else if (raw.length <= 7) {
      setApplicantPhone(`${raw.slice(0, 3)}-${raw.slice(3)}`);
    } else {
      setApplicantPhone(`${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`);
    }
  };

  // 지원 신청 제출 핸들러
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim()) {
      setSubmitError('이름을 입력해 주세요.');
      return;
    }
    const cleanPhone = applicantPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setSubmitError('연락처(010-XXXX-XXXX)를 정확히 입력해 주세요.');
      return;
    }
    if (!agreePrivacy) {
      setSubmitError('개인정보 수집 및 제3자 제공에 동의해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/crew/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          selectedDates: selectedDateObjects.map((d) => d.date),
          applicantName: applicantName.trim(),
          applicantPhone: applicantPhone.trim(),
          agreePrivacy: true,
          agreeNotice: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setSubmitError('로그인이 필요한 서비스예요. 로그인 후 다시 지원해 주세요.');
        } else {
          setSubmitError(data.message || '지원 접수 중 오류가 발생했습니다.');
        }
        return;
      }

      setIsSuccess(true);
    } catch {
      setSubmitError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      setIsApplyModalOpen(false);
      // 성공 상태에서 모달 닫을 시 상태 초기화
      if (isSuccess) {
        setIsSuccess(false);
        setSubmitError(null);
      }
    } else {
      setIsApplyModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink pb-28">
      {/* 넛지(Nudge) 애니메이션 키프레임 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes gentleNudge {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }
        .animate-nudge {
          animation: gentleNudge 1.3s ease-in-out infinite;
        }
      `,
        }}
      />

      {/* 1. 상단 내비게이션 바 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border/80 h-14 flex items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted hover:text-ink transition-colors font-medium text-sm group"
        >
          <ArrowLeft className="w-4 h-4 text-muted group-hover:text-ink" />
          <div className="w-7 h-7 rounded-lg overflow-hidden shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <Image
              src="/crewlink_app_icon.png"
              alt="CrewLink Logo"
              width={28}
              height={28}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <span className="font-bold text-ink">공고 목록</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                alert('공고 링크가 복사되었습니다.');
              }
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors cursor-pointer"
            aria-label="공고 공유하기"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {sessionUser && <AccountMenu user={sessionUser} activeRole={activeRole} />}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* 2. 헤더 메타 */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-4 h-4 rounded-full bg-brand flex items-center justify-center shrink-0 shadow-2xs">
                <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
              </span>
              <span className="font-semibold text-ink">{event.hostName}</span>
              <span className="text-border">·</span>
              <span className="text-muted">{event.categoryLabel}</span>
            </div>

            <span className="text-xs font-semibold text-muted tracking-tight">
              {event.deadlineDateLabel}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-ink leading-tight tracking-tight break-keep">
            {event.displayTitle}
          </h1>
        </div>

        {/* 3. 날짜 선택 + 예상 보수 통합 카드 */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-border shadow-2xs space-y-5">
          {/* 상단: 근무 일정 선택 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                근무 일정 선택
              </span>
              <span className="text-xs text-muted">원하는 날짜를 선택해 주세요</span>
            </div>

            {/* 스크롤 트랙 컨테이너 (우측 인디케이터 오버레이 포함) */}
            <div className="relative">
              <div
                ref={scrollContainerRef}
                onScroll={checkScrollState}
                className="p-1 -m-1 flex gap-2 overflow-x-auto scrollbar-none snap-x scroll-smooth"
              >
                {event.dates.map((d) => {
                  const isSelected = selectedDateIds.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDate(d.id)}
                      className={`py-2.5 px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center shrink-0 w-[calc((100%-24px)/4)] min-w-[70px] snap-start ${
                        isSelected
                          ? 'border-brand bg-white text-ink font-bold shadow-xs ring-1 ring-inset ring-brand'
                          : 'border-border/80 bg-canvas text-muted hover:border-brand/40'
                      }`}
                    >
                      <span className="text-xs text-muted mb-0.5">{d.dayOfWeek}요일</span>
                      <span className="text-sm font-semibold tracking-tight">
                        {d.date.slice(5).replace('-', '.')}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 4일 초과 시 우측 스크롤 인디케이터 (화이트 그라데이션 + 넛지 모션) */}
              {event.dates.length > 4 && canScrollRight && (
                <div
                  onClick={handleScrollRight}
                  className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-end pr-0.5 pointer-events-auto cursor-pointer bg-gradient-to-l from-white via-white/85 to-transparent transition-opacity duration-200 select-none"
                  aria-label="다음 일정 보기"
                >
                  <div className="w-6 h-6 rounded-full bg-white border border-brand/30 shadow-2xs flex items-center justify-center text-brand animate-nudge">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 내부 구분선 */}
          <div className="h-px bg-border-subtle" />

          {/* 하단: 선택 근무일 비례 예상 보수 + 3D 클레이 지갑 에셋 */}
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <span>선택 근무일 비례 예상 보수</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                <span className="text-ink font-bold">{selectedDateIds.length}일 선택</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-ink tracking-tight tabular-nums">
                  {totalEstimatedWage.toLocaleString()}
                </span>
                <span className="text-base sm:text-lg font-bold text-ink">원</span>
                <span className="text-xs text-muted ml-1">(세전)</span>
              </div>
              <p className="text-xs text-muted">
                하루 {event.dailyWageWon.toLocaleString()}원 × {selectedDateIds.length}일
              </p>
            </div>

            {/* 3D 클레이 지갑 & 코인 스택 */}
            <ClayWallet3DAsset />
          </div>
        </section>

        {/* 4. 근무 핵심 요약 */}
        <section className="bg-white rounded-3xl p-5 border border-border shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-ink">근무 핵심 요약</h2>
          <div className="space-y-3.5 text-sm">
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-ink">근무 시간</p>
                <p className="text-xs text-muted mt-0.5">
                  {event.workHoursLabel} ({event.breakMinutesLabel})
                </p>
              </div>
            </div>
            <div className="h-px bg-border-subtle" />
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-ink">근무 장소</p>
                <p className="text-xs text-muted mt-0.5">{event.venueAddress}</p>
                <p className="text-xs text-muted/80">{event.venueDetail}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. 담당할 주요 업무 */}
        <section className="bg-white rounded-3xl p-5 border border-border shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-ink">담당할 주요 업무</h2>
          <div className="space-y-2.5">
            {event.roles.map((role, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-2xl border border-border/80 shadow-2xs flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-canvas text-brand-strong flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold border border-border/50">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">{role.title}</p>
                  <p className="text-xs text-muted mt-0.5 break-keep leading-relaxed">
                    {role.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. 복장 규정 */}
        <section className="bg-white rounded-3xl p-5 border border-border shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-ink">복장 규정</h2>
          <div className="p-4 rounded-2xl border border-brand/60">
            <p className="text-sm font-bold text-ink">{event.dressCode.title}</p>
            <p className="text-xs text-muted mt-1 break-keep leading-relaxed">
              {event.dressCode.desc}
            </p>
          </div>
        </section>

        {/* 7. 지원 자격 안내 */}
        <section className="bg-white rounded-3xl p-5 border border-border shadow-2xs space-y-3">
          <h2 className="text-base font-bold text-ink">지원 자격 및 안내</h2>
          <ul className="space-y-2.5 text-xs text-muted">
            {event.qualifications.map((q, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 mt-1.5" />
                <span className="break-keep leading-relaxed">{q}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* 8. 하단 고정 지원 액션 바 (52px CTA) */}
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-border px-4 py-3 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted">선택 {selectedDateIds.length}일 총 예상 보수</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-extrabold text-ink tabular-nums">
                {totalEstimatedWage.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-ink">원</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsApplyModalOpen(true);
            }}
            className="min-h-[52px] px-8 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-sm transition-colors active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>현장 지원하기</span>
          </button>
        </div>
      </footer>

      {/* 9. Radix Dialog 기반 지원 신청 모달 (AccessibleSheet) */}
      <AccessibleSheet
        open={isApplyModalOpen}
        onOpenChange={handleModalClose}
        title={isSuccess ? '지원 완료' : '현장 크루 지원 신청'}
        description={
          isSuccess
            ? '지원이 성공적으로 접수되었습니다.'
            : '신청 정보를 확인하고 지원을 완료해 주세요.'
        }
        side="center"
        className="max-w-md w-[92vw] p-5 sm:p-6"
      >
        {isSuccess ? (
          <div className="py-4 space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-brand-soft border border-brand-border text-brand-strong flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-ink">지원 신청이 접수되었어요!</h3>
              <p className="text-xs text-muted leading-relaxed break-keep">
                주최사 담당자가 지원서를 검토한 후 승인 여부를 알림톡 또는 문자로 안내해 드려요.
              </p>
            </div>

            <div className="bg-canvas rounded-2xl p-4 text-left border border-border/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">지원 행사</span>
                <span className="font-semibold text-ink truncate max-w-[200px]">
                  {event.displayTitle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">선택 일정</span>
                <span className="font-semibold text-ink">
                  총 {selectedDateObjects.length}일 ({selectedDateObjects.map((d) => `${d.date.slice(5)}(${d.dayOfWeek})`).join(', ')})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">예상 총 보수</span>
                <span className="font-bold text-brand-strong">
                  {totalEstimatedWage.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">신청자</span>
                <span className="font-semibold text-ink">{applicantName} ({applicantPhone})</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Link
                href="/crew/schedule"
                className="flex-1 h-11 rounded-xl bg-brand text-white font-bold text-xs flex items-center justify-center hover:bg-brand-hover transition-colors shadow-2xs"
              >
                내 활동(일정) 확인하기
              </Link>
              <button
                type="button"
                onClick={() => handleModalClose(false)}
                className="h-11 px-5 rounded-xl border border-border bg-surface text-ink font-semibold text-xs hover:bg-canvas transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitApplication} className="pt-2 pb-1 space-y-4 text-left">
            {submitError && (
              <div className="p-3 rounded-xl bg-surface border border-brand-border text-brand-strong text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="break-keep leading-tight">{submitError}</span>
              </div>
            )}

            {/* 선택 근무 일자 요약 카드 */}
            <div className="bg-canvas rounded-2xl p-3.5 border border-border/80 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-ink">
                <span>선택한 근무 일정</span>
                <span className="text-brand-strong">{selectedDateObjects.length}일 선택</span>
              </div>
              <div className="flex flex-wrap gap-1 text-[11px]">
                {selectedDateObjects.map((d) => (
                  <span
                    key={d.id}
                    className="px-2 py-0.5 rounded-md bg-surface border border-border text-ink font-medium"
                  >
                    {d.date.slice(5).replace('-', '.')} ({d.dayOfWeek})
                  </span>
                ))}
              </div>
              <div className="pt-1 border-t border-border-subtle flex items-center justify-between text-xs">
                <span className="text-muted">예상 총 보수</span>
                <span className="font-extrabold text-ink text-sm">
                  {totalEstimatedWage.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* 지원자 이름 */}
            <div className="space-y-1">
              <label htmlFor="applicant-name" className="text-xs font-semibold text-ink">
                이름 <span className="text-brand">*</span>
              </label>
              <input
                id="applicant-name"
                type="text"
                required
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="실명을 입력해 주세요"
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-ink text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              />
            </div>

            {/* 지원자 연락처 */}
            <div className="space-y-1">
              <label htmlFor="applicant-phone" className="text-xs font-semibold text-ink">
                연락처 <span className="text-brand">*</span>
              </label>
              <input
                id="applicant-phone"
                type="tel"
                required
                value={applicantPhone}
                onChange={handlePhoneChange}
                placeholder="010-0000-0000"
                maxLength={13}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-ink text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors font-mono"
              />
              <p className="text-[11px] text-muted">선정 결과 및 현장 공지 수신용 연락처입니다.</p>
            </div>

            {/* 개인정보 수집 및 제3자 제공 동의 (체크박스, 기본값 false) */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-border hover:bg-canvas transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-brand border-border focus:ring-brand accent-brand cursor-pointer"
                />
                <div className="text-xs leading-relaxed">
                  <span className="font-semibold text-ink">
                    개인정보 수집 및 주최사 제3자 제공 동의 (필수)
                  </span>
                  <p className="text-[11px] text-muted mt-0.5">
                    현장 출근 확인 및 계약 체결을 위해 주최사에 이름 및 연락처를 제공하는 것에 동의합니다.
                  </p>
                </div>
              </label>
            </div>

            {/* 제출 버튼 */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !agreePrivacy || !applicantName || applicantPhone.length < 10}
                className="w-full min-h-[48px] rounded-xl bg-brand hover:bg-brand-hover disabled:bg-surface-muted disabled:text-muted disabled:border disabled:border-border text-white font-bold text-sm transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>지원서 제출 중…</span>
                  </>
                ) : (
                  <span>지원 신청 완료하기</span>
                )}
              </button>
            </div>
          </form>
        )}
      </AccessibleSheet>
    </div>
  );
}