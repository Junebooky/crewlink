'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/common/AppShell';
import { HeadcountInput } from '@/components/common/HeadcountInput';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Layers,
  Users,
  Calculator,
  ShieldCheck,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SCOPE_PRESETS = [
  'POS 결제 · 영수증 발행',
  '외국어 응대 · 영어·일본어·중국어',
  '대기열 · 관람객 동선 관리',
  'VIP 라운지 · 의전·케이터링',
  '등록 데스크 · 명찰 배부',
  '체험 부스 · 진행·시연',
];

export default function ClientRequestWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [title, setTitle] = useState('2026 하반기 글로벌 AI 컨퍼런스');
  const [roadAddress, setRoadAddress] = useState('서울 강남구 영동대로 513 코엑스');
  const [detailAddress, setDetailAddress] = useState('3층 D홀 전관');
  const [eventDate, setEventDate] = useState('2026-10-15');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [breakMinutes, setBreakMinutes] = useState(60);

  // Step 2: Scope
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    '외국어 응대 · 영어·일본어·중국어',
    '대기열 · 관람객 동선 관리',
    '등록 데스크 · 명찰 배부',
  ]);

  // Step 3: Specs & Headcount
  const [headcountGuide, setHeadcountGuide] = useState(4);
  const [headcountVIP, setHeadcountVIP] = useState(2);
  const [headcountDesk, setHeadcountDesk] = useState(2);
  const [uniformSpec, setUniformSpec] = useState<'PROVIDED_BY_CLIENT' | 'ALL_BLACK_FORMAL'>('ALL_BLACK_FORMAL');

  // API Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Slide Presentation Refs & Dynamic Height
  const step1Ref = React.useRef<HTMLDivElement>(null);
  const step2Ref = React.useRef<HTMLDivElement>(null);
  const step3Ref = React.useRef<HTMLDivElement>(null);
  const step4Ref = React.useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);

  React.useEffect(() => {
    const refs = [step1Ref, step2Ref, step3Ref, step4Ref];
    const activeEl = refs[currentStep - 1]?.current;
    if (!activeEl) return;

    const updateHeight = () => {
      if (activeEl) {
        setContainerHeight(activeEl.offsetHeight);
      }
    };

    updateHeight();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        updateHeight();
      });
      observer.observe(activeEl);
      return () => observer.disconnect();
    }
  }, [
    currentStep,
    title,
    eventDate,
    startTime,
    endTime,
    breakMinutes,
    roadAddress,
    detailAddress,
    selectedScopes,
    headcountGuide,
    headcountVIP,
    headcountDesk,
    uniformSpec,
  ]);

  // Calculate pure working hours reflecting break time
  const startParts = startTime.split(':').map(Number);
  const endParts = endTime.split(':').map(Number);
  const startTotalMins = (startParts[0] || 0) * 60 + (startParts[1] || 0);
  const endTotalMins = (endParts[0] || 0) * 60 + (endParts[1] || 0);
  const rawDurationMins = Math.max(0, endTotalMins - startTotalMins);
  const netWorkMinutes = Math.max(60, rawDurationMins - breakMinutes);
  const hours = Number((netWorkMinutes / 60).toFixed(1));

  const hourlyRateWon = 15000;
  const totalHeadcount = headcountGuide + headcountVIP + headcountDesk;
  const staffRemunerationWon = Math.floor(totalHeadcount * hours * hourlyRateWon);
  // B2B Pricing structure: Remuneration + Platform fee 15% + VAT 10%
  const platformFeeWon = Math.floor(staffRemunerationWon * 0.15);
  const supplyPriceWon = staffRemunerationWon + platformFeeWon;
  const vatWon = Math.floor(supplyPriceWon * 0.10);
  const totalOrderAmountWon = supplyPriceWon + vatWon;

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
  };

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/client/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-person-id': '33333333-3333-3333-3333-333333333333',
        },
        body: JSON.stringify({
          title,
          roadAddress,
          detailAddress,
          venueName: roadAddress,
          eventDate,
          startTime,
          endTime,
          breakMinutes,
          headcount: totalHeadcount,
          hourlyRateWon,
          selectedScopes,
          positionSpecs: [
            { role: '동선 관리 · 일반 안내', count: headcountGuide },
            { role: 'VIP 라운지 · 리셉션', count: headcountVIP },
            { role: '등록 데스크', count: headcountDesk },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '요청을 보내지 못했어요. 입력한 내용을 확인하고 다시 시도해 주세요.');
      }

      router.push('/client');
    } catch (err: unknown) {
      setSubmitError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell initialRole="client">
      <div className="max-w-2xl mx-auto px-4 py-6 w-full space-y-6">
        <div>
          <span className="text-xs font-bold text-brand bg-brand-subtle px-2.5 py-1 rounded-full uppercase tracking-wider">
            새 행사 요청
          </span>
          <h1 className="text-2xl font-bold text-ink mt-2">어떤 행사를 준비하세요?</h1>
          <p className="text-xs text-muted mt-1">
            필요한 역할과 인원을 알려주세요. 예상 비용까지 한눈에 확인해요.
          </p>
        </div>

        {/* 4-Step Progress Indicator with Background Track */}
        <div className="relative pt-1">
          {/* Step Labels */}
          <div className="grid grid-cols-4 text-center mb-2.5">
            {[
              { step: 1, label: '행사 정보' },
              { step: 2, label: '필요한 역할' },
              { step: 3, label: '인원·복장' },
              { step: 4, label: '예상 비용' },
            ].map((item) => {
              const isActive = currentStep === item.step;
              const isPast = currentStep > item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => {
                    if (item.step < currentStep) {
                      setCurrentStep(item.step as 1 | 2 | 3 | 4);
                    }
                  }}
                  disabled={item.step > currentStep}
                  className={cn(
                    'py-1 px-1 text-xs transition-colors flex flex-col items-center justify-center',
                    item.step < currentStep ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
                    isActive
                      ? 'text-brand font-bold'
                      : isPast
                        ? 'text-brand-strong font-medium'
                        : 'text-muted'
                  )}
                >
                  <span className="text-[10px] uppercase tracking-wider block">
                    단계 {item.step}
                  </span>
                  <span className="text-xs truncate block mt-0.5">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Continuous Background Bar Track with smooth animated fill */}
          <div className="relative w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-350 ease-out"
              style={{
                width: `${(currentStep / 4) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Slide Presentation Container (PPT Slide Transition) */}
        <div
          className="w-full overflow-hidden transition-[height] duration-350 ease-out"
          style={{ height: containerHeight ? `${containerHeight}px` : undefined }}
        >
          <div
            className="flex items-start transition-transform duration-350 ease-out will-change-transform"
            style={{
              transform: `translateX(-${(currentStep - 1) * 100}%)`,
              width: '100%',
            }}
          >
            {/* STEP 1: EVENT OVERVIEW */}
            <div
              ref={step1Ref}
              className="w-full shrink-0"
              inert={currentStep !== 1 ? true : undefined}
              aria-hidden={currentStep !== 1}
            >
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-4 shadow-xs">
                <h2 className="text-base font-bold text-ink flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-brand" />
                  행사 정보를 알려주세요
                </h2>

                <div>
                  <label className="text-xs font-bold text-muted block mb-1">행사명</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-11 px-3 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted block mb-1">행사 날짜</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full h-11 px-3 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-brand focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-muted block mb-1">시작 시간</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full h-11 px-3 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-brand focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted block mb-1">종료 시간</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full h-11 px-3 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-brand focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted block mb-1">쉬는 시간 (분)</label>
                  <input
                    type="number"
                    min={0}
                    step={30}
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(Number(e.target.value))}
                    className="w-full h-11 px-3 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                  <p className="text-[11px] text-muted mt-1">
                    근무 시간: {hours}시간 · 전체 {rawDurationMins}분 중 쉬는 시간 {breakMinutes}분
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted block mb-1">도로명 주소</label>
                  <input
                    type="text"
                    value={roadAddress}
                    onChange={(e) => setRoadAddress(e.target.value)}
                    className="w-full h-11 px-3 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted block mb-1">상세 장소</label>
                  <input
                    type="text"
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    className="w-full h-11 px-3 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* STEP 2: SCOPE OF WORK */}
            <div
              ref={step2Ref}
              className="w-full shrink-0"
              inert={currentStep !== 2 ? true : undefined}
              aria-hidden={currentStep !== 2}
            >
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-4 shadow-xs">
                <h2 className="text-base font-bold text-ink flex items-center gap-2">
                  <Layers className="w-5 h-5 text-brand" />
                  어떤 역할이 필요한가요?
                </h2>
                <p className="text-xs text-muted">
                  크루가 맡을 일을 골라주세요. 여러 개를 선택할 수 있어요.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {SCOPE_PRESETS.map((scope) => {
                    const isSelected = selectedScopes.includes(scope);
                    return (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => toggleScope(scope)}
                        className={cn(
                          'p-3.5 min-h-[52px] rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-all cursor-pointer',
                          isSelected
                            ? 'border-brand bg-brand-subtle text-brand font-bold shadow-xs'
                            : 'border-border text-muted hover:border-border bg-surface'
                        )}
                      >
                        <span>{scope}</span>
                        {isSelected && <Check className="w-4 h-4 text-brand shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* STEP 3: HEADCOUNT & SPECS */}
            <div
              ref={step3Ref}
              className="w-full shrink-0"
              inert={currentStep !== 3 ? true : undefined}
              aria-hidden={currentStep !== 3}
            >
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-5 shadow-xs">
                <h2 className="text-base font-bold text-ink flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand" />
                  몇 명이 함께하면 될까요?
                </h2>

                {/* Stepper Inputs in unified, consistent container cards */}
                <div className="space-y-3">
                  {[
                    {
                      id: 'guide',
                      title: '동선 관리 · 일반 안내',
                      sub: '시간당 15,000원',
                      value: headcountGuide,
                      onChange: setHeadcountGuide,
                      min: 1,
                    },
                    {
                      id: 'vip',
                      title: 'VIP 라운지 · 리셉션',
                      sub: '외국어 응대가 가능한 크루',
                      value: headcountVIP,
                      onChange: setHeadcountVIP,
                      min: 0,
                    },
                    {
                      id: 'desk',
                      title: '등록 데스크',
                      sub: 'POS 결제 · 명찰 배부',
                      value: headcountDesk,
                      onChange: setHeadcountDesk,
                      min: 0,
                    },
                  ].map((role) => (
                    <div
                      key={role.id}
                      className="p-4 bg-white border border-border rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-brand-border transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-sm font-bold text-ink leading-snug break-keep">
                          {role.title}
                        </div>
                        <div className="text-xs text-muted mt-1 leading-normal break-keep">
                          {role.sub}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <HeadcountInput
                          id={`headcount-${role.id}`}
                          value={role.value}
                          onChange={role.onChange}
                          min={role.min}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Uniform */}
                <div className="pt-4 border-t border-border-subtle">
                  <label className="text-xs font-bold text-muted block mb-2">복장 안내</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setUniformSpec('ALL_BLACK_FORMAL')}
                      className={cn(
                        'p-3.5 min-h-[52px] border rounded-xl text-left font-medium transition-colors cursor-pointer',
                        uniformSpec === 'ALL_BLACK_FORMAL'
                          ? 'border-brand bg-brand-subtle text-brand font-bold'
                          : 'border-border text-muted bg-surface'
                      )}
                    >
                      <div className="break-keep">올블랙 정장·슬랙스</div>
                      <div className="text-[10px] text-muted mt-0.5 break-keep">크루가 준비해요</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUniformSpec('PROVIDED_BY_CLIENT')}
                      className={cn(
                        'p-3.5 min-h-[52px] border rounded-xl text-left font-medium transition-colors cursor-pointer',
                        uniformSpec === 'PROVIDED_BY_CLIENT'
                          ? 'border-brand bg-brand-subtle text-brand font-bold'
                          : 'border-border text-muted bg-surface'
                      )}
                    >
                      <div className="break-keep">행사 유니폼 제공</div>
                      <div className="text-[10px] text-muted mt-0.5 break-keep">미리 사이즈를 확인해요</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 4: SUMMARY & FORMAL QUOTE */}
            <div
              ref={step4Ref}
              className="w-full shrink-0"
              inert={currentStep !== 4 ? true : undefined}
              aria-hidden={currentStep !== 4}
            >
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-5 shadow-xs">
                <h2 className="text-base font-bold text-ink flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-brand" />
                  예상 비용을 확인해 주세요
                </h2>

                {/* Overview Summary */}
                <div className="p-4 bg-canvas rounded-xl space-y-2 text-xs text-muted">
                  <div className="flex justify-between">
                    <span className="text-muted">행사명</span>
                    <span className="font-bold text-ink">{title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">행사 날짜·근무 시간</span>
                    <span>{eventDate} (근무 {hours}시간)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">필요한 크루</span>
                    <span className="font-bold text-brand">{totalHeadcount}명</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">선택한 역할</span>
                    <span>{selectedScopes.length}개 역할</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2.5 text-xs text-muted pt-2">
                  <div className="flex justify-between items-center">
                    <span>크루 보수 ({totalHeadcount}명 × {hours}시간 × 15,000원)</span>
                    <span className="font-semibold text-ink tabular-nums">
                      {staffRemunerationWon.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted">
                    <span>운영료 (15%)</span>
                    <span className="tabular-nums">+{platformFeeWon.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-ink pt-2 border-t border-border-subtle">
                    <span>공급가액</span>
                    <span className="tabular-nums">{supplyPriceWon.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center text-muted">
                    <span>부가가치세 (10%)</span>
                    <span className="tabular-nums">+{vatWon.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center text-base font-black text-brand pt-3 border-t-2 border-border">
                    <span>예상 총액</span>
                    <span className="tabular-nums">{totalOrderAmountWon.toLocaleString()}원</span>
                  </div>
                </div>

                {submitError && (
                  <div className="p-3 bg-error-bg border border-error-border rounded-xl text-error text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Wizard Footer Controls */}
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 min-h-[52px] border border-border bg-surface text-muted font-bold text-sm rounded-xl hover:bg-canvas transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>이전</span>
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 min-h-[52px] bg-brand hover:bg-brand-hover text-inverse font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>다음</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="flex-1 min-h-[52px] bg-brand hover:bg-brand-hover text-inverse font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{isSubmitting ? '요청 보내는 중…' : '운영 요청 보내기'}</span>
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
