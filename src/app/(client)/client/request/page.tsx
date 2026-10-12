'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/common/AppShell';
import { HeadcountInput } from '@/components/common/HeadcountInput';
import {
  Calendar,
  Clock,
  Briefcase,
  Layers,
  Users,
  Calculator,
  Check,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { KakaoPlaceSearchInput } from '@/components/client/KakaoPlaceSearchInput';

const SCOPE_PRESETS = [
  'POS 결제 · 영수증 발행',
  '외국어 응대 · 영어·일본어·중국어',
  '대기열 · 관람객 동선 관리',
  'VIP 라운지 · 의전·케이터링',
  '등록 데스크 · 명찰 배부',
  '체험 부스 · 진행·시연',
];

const DRESS_CODE_PRESETS = [
  { id: 'DARK_SUIT', title: '어두운 계열 정장 (블랙/네이비 수트)', desc: '단정한 수트 자켓 및 슬랙스, 구두' },
  { id: 'SEMI_FORMAL', title: '깔끔한 세미 정장 (슬랙스 + 셔츠/자켓)', desc: '단정한 셔츠나 블라우스, 슬랙스' },
  { id: 'CASUAL', title: '캐주얼 (티셔츠 + 청바지, 편한 운동화)', desc: '활동하기 편한 깔끔한 티셔츠와 운동화' },
  { id: 'CLIENT_UNIFORM', title: '주최사 유니폼 제공 (단정한 하의 지참)', desc: '현장에서 상의 유니폼 지급 (슬랙스 등 지참)' },
  { id: 'CUSTOM', title: '기타 (직접 입력)', desc: '행사 특성에 맞는 복장 가이드를 직접 작성해요' },
];

/**
 * 토스 스타일 슬라이딩 인디케이터 세그먼트 탭
 */
interface SlidingSegmentedTabProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
}

function SlidingSegmentedTab<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SlidingSegmentedTabProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((opt) => opt.value === value)
  );
  const count = options.length;
  const widthPercent = 100 / count;

  return (
    <div
      className={cn(
        'relative p-1 rounded-2xl bg-surface-muted border border-border flex items-center select-none',
        className
      )}
    >
      {/* 슬라이딩 배경 칩 */}
      <div
        className="absolute top-1 bottom-1 rounded-xl bg-white shadow-xs transition-all duration-200 ease-out pointer-events-none"
        style={{
          width: `calc(${widthPercent}% - 4px)`,
          left: '2px',
          transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 4}px))`,
        }}
      />
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative z-10 flex-1 py-2.5 text-center text-xs sm:text-sm font-bold transition-colors cursor-pointer',
              isSelected ? 'text-ink' : 'text-muted hover:text-ink/80'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Helper to generate YYYY-MM-DD date range safely without timezone shifts
 */
function getDatesInRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  if (!startStr) return dates;
  if (!endStr || endStr < startStr) return [startStr];

  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  const curr = new Date(Date.UTC(sy, sm - 1, sd));
  const end = new Date(Date.UTC(ey, em - 1, ed));

  while (curr <= end) {
    const y = curr.getUTCFullYear();
    const m = String(curr.getUTCMonth() + 1).padStart(2, '0');
    const d = String(curr.getUTCDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return dates;
}

interface RoleSetting {
  headcount: number;
  hourlyRate: number;
  allowForeign: boolean;
  allowLeader: boolean;
}

export default function ClientRequestWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State: Step 1 Event Overview
  const [title, setTitle] = useState('2026 하반기 글로벌 AI 컨퍼런스');
  const [venueName, setVenueName] = useState('코엑스');
  const [roadAddress, setRoadAddress] = useState('서울 강남구 영동대로 513 코엑스');
  const [detailAddress, setDetailAddress] = useState('3층 D홀 전관');
  const [latitude, setLatitude] = useState<number | null>(37.511854);
  const [longitude, setLongitude] = useState<number | null>(127.059287);

  // 일자 및 시간
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [startDate, setStartDate] = useState('2026-10-15');
  const [endDate, setEndDate] = useState('2026-10-18');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [breakMinutes, setBreakMinutes] = useState(60);

  // Step 2: Scope of Work
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    '외국어 응대 · 영어·일본어·중국어',
    '대기열 · 관람객 동선 관리',
    '등록 데스크 · 명찰 배부',
  ]);

  // Step 3: Hourly Wage & Headcount Builder
  const [wageMode, setWageMode] = useState<'UNIFORM' | 'DIFFERENTIAL'>('UNIFORM');
  const [uniformHourlyRate, setUniformHourlyRate] = useState(13000);
  const [uniformAllowForeign, setUniformAllowForeign] = useState(false);
  const [uniformAllowLeader, setUniformAllowLeader] = useState(false);

  // 포지션별 설정 맵 (차등 모드 및 인원 배정용)
  const [roleSettings, setRoleSettings] = useState<Record<string, RoleSetting>>({
    '외국어 응대 · 영어·일본어·중국어': { headcount: 2, hourlyRate: 15000, allowForeign: true, allowLeader: false },
    '대기열 · 관람객 동선 관리': { headcount: 4, hourlyRate: 13000, allowForeign: false, allowLeader: false },
    '등록 데스크 · 명찰 배부': { headcount: 2, hourlyRate: 13000, allowForeign: false, allowLeader: false },
  });

  // Step 3: Dress Code
  const [selectedDressCodeId, setSelectedDressCodeId] = useState('DARK_SUIT');
  const [customDressCodeText, setCustomDressCodeText] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Dynamic Height Animation Refs
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);

  // 일자 배열 및 총 일수 계산
  const dates = useMemo(() => {
    return isMultiDay ? getDatesInRange(startDate, endDate) : [startDate];
  }, [isMultiDay, startDate, endDate]);

  const totalDays = Math.max(1, dates.length);

  // 유효한 역할 목록
  const activeRoleList = useMemo(() => {
    return selectedScopes.length > 0 ? selectedScopes : ['현장 일반 운영 지원'];
  }, [selectedScopes]);

  // 선택된 역할이 변경될 때 roleSettings 초기화 동기화
  useEffect(() => {
    setRoleSettings((prev) => {
      const updated = { ...prev };
      let hasChanges = false;
      activeRoleList.forEach((role) => {
        if (!updated[role]) {
          updated[role] = {
            headcount: 2,
            hourlyRate: 13000,
            allowForeign: role.includes('외국어'),
            allowLeader: false,
          };
          hasChanges = true;
        }
      });
      return hasChanges ? updated : prev;
    });
  }, [activeRoleList]);

  // 순 근무 시간 계산
  const { hours, rawDurationMins } = useMemo(() => {
    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);
    const startTotalMins = (startParts[0] || 0) * 60 + (startParts[1] || 0);
    const endTotalMins = (endParts[0] || 0) * 60 + (endParts[1] || 0);
    const rawMins = Math.max(0, endTotalMins - startTotalMins);
    const netMins = Math.max(60, rawMins - breakMinutes);
    return {
      rawDurationMins: rawMins,
      hours: Number((netMins / 60).toFixed(1)),
    };
  }, [startTime, endTime, breakMinutes]);

  // 실시간 견적 및 보수 계산
  const {
    uniformEffectiveRate,
    totalHeadcount,
    dailyStaffWage,
    totalStaffWage,
    averageDailyWage,
    platformFeeWon,
    supplyPriceWon,
    vatWon,
    grandTotalWon,
  } = useMemo(() => {
    // 일괄 모드 실효 시급
    const uRate =
      uniformHourlyRate +
      (uniformAllowForeign ? 2500 : 0) +
      (uniformAllowLeader ? 2000 : 0);

    let countSum = 0;
    let dailyWageSum = 0;

    activeRoleList.forEach((role) => {
      const setting = roleSettings[role] || {
        headcount: 2,
        hourlyRate: 13000,
        allowForeign: false,
        allowLeader: false,
      };

      const count = setting.headcount || 1;
      countSum += count;

      if (wageMode === 'UNIFORM') {
        const roleDailyWage = Math.floor(hours * uRate);
        dailyWageSum += count * roleDailyWage;
      } else {
        const effectiveRoleRate =
          setting.hourlyRate +
          (setting.allowForeign ? 2500 : 0) +
          (setting.allowLeader ? 2000 : 0);
        const roleDailyWage = Math.floor(hours * effectiveRoleRate);
        dailyWageSum += count * roleDailyWage;
      }
    });

    const totalStaff = dailyWageSum * totalDays;
    const avgDailyWage = countSum > 0 ? Math.floor(dailyWageSum / countSum) : 0;
    const fee = Math.floor(totalStaff * 0.15); // 플랫폼 운영료 15%
    const supply = totalStaff + fee;
    const vat = Math.floor(supply * 0.1); // 부가세 10%
    const grandTotal = supply + vat;

    return {
      uniformEffectiveRate: uRate,
      totalHeadcount: Math.max(1, countSum),
      dailyStaffWage: dailyWageSum,
      totalStaffWage: totalStaff,
      averageDailyWage: avgDailyWage,
      platformFeeWon: fee,
      supplyPriceWon: supply,
      vatWon: vat,
      grandTotalWon: grandTotal,
    };
  }, [
    activeRoleList,
    roleSettings,
    wageMode,
    uniformHourlyRate,
    uniformAllowForeign,
    uniformAllowLeader,
    hours,
    totalDays,
  ]);

  // 컨테이너 높이 리사이즈 관찰
  useEffect(() => {
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
    isMultiDay,
    startDate,
    endDate,
    totalDays,
    startTime,
    endTime,
    breakMinutes,
    venueName,
    roadAddress,
    detailAddress,
    latitude,
    longitude,
    selectedScopes,
    wageMode,
    uniformHourlyRate,
    uniformAllowForeign,
    uniformAllowLeader,
    roleSettings,
    selectedDressCodeId,
    customDressCodeText,
  ]);

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const updateRoleSetting = (role: string, updater: Partial<RoleSetting>) => {
    setRoleSettings((prev) => ({
      ...prev,
      [role]: {
        ...(prev[role] || {
          headcount: 2,
          hourlyRate: 13000,
          allowForeign: false,
          allowLeader: false,
        }),
        ...updater,
      },
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
  };

  const effectiveDressCode = useMemo(() => {
    if (selectedDressCodeId === 'CUSTOM') {
      return customDressCodeText.trim() || '기타 맞춤 복장 (현장 별도 안내)';
    }
    return (
      DRESS_CODE_PRESETS.find((p) => p.id === selectedDressCodeId)?.title ||
      '어두운 계열 정장 (블랙/네이비 수트)'
    );
  }, [selectedDressCodeId, customDressCodeText]);

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const isExplicitlyLoggedOut =
        typeof window !== 'undefined' && localStorage.getItem('crewlink_logged_out') === 'true';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(process.env.NODE_ENV !== 'production' && !isExplicitlyLoggedOut
          ? { 'x-actor-person-id': '33333333-3333-3333-3333-333333333333' }
          : {}),
      };

      const res = await fetch('/api/client/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title,
          category: '전시·컨벤션',
          venueName,
          venueAddress: roadAddress,
          venueDetail: detailAddress,
          roadAddress,
          detailAddress,
          latitude,
          longitude,
          isMultiDay,
          startDate,
          endDate: isMultiDay ? endDate : startDate,
          eventDate: startDate,
          startTime,
          endTime,
          breakMinutes,
          headcount: totalHeadcount,
          dailyWage: averageDailyWage,
          hourlyRateWon:
            wageMode === 'UNIFORM'
              ? uniformEffectiveRate
              : Math.floor(averageDailyWage / (hours || 1)),
          totalStaffWage,
          totalAmountWon: grandTotalWon,
          totalDays,
          dates,
          dressCode: effectiveDressCode,
          notes: '',
          selectedScopes: activeRoleList,
          positionSpecs: activeRoleList.map((role) => {
            const cfg = roleSettings[role] || {
              headcount: 2,
              hourlyRate: 13000,
              allowForeign: false,
              allowLeader: false,
            };
            const roleEffRate =
              wageMode === 'UNIFORM'
                ? uniformEffectiveRate
                : cfg.hourlyRate +
                  (cfg.allowForeign ? 2500 : 0) +
                  (cfg.allowLeader ? 2000 : 0);
            return {
              role,
              count: cfg.headcount,
              hourlyRate: roleEffRate,
              allowances: [
                (wageMode === 'UNIFORM' ? uniformAllowForeign : cfg.allowForeign) ? '외국어' : null,
                (wageMode === 'UNIFORM' ? uniformAllowLeader : cfg.allowLeader) ? '리더' : null,
              ].filter(Boolean),
              dailyWage: Math.floor(hours * roleEffRate),
            };
          }),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message || '요청을 보내지 못했어요. 입력한 내용을 확인하고 다시 시도해 주세요.'
        );
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
          <span className="text-xs font-bold text-brand bg-brand-soft px-2.5 py-1 rounded-full uppercase tracking-wider border border-brand-border/60">
            새 행사 요청
          </span>
          <h1 className="text-2xl font-bold text-ink mt-2">어떤 행사를 준비하세요?</h1>
          <p className="text-xs text-muted mt-1">
            필요한 역할과 인원을 알려주세요. 예상 비용까지 한눈에 확인해요.
          </p>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="relative pt-1">
          <div className="grid grid-cols-4 text-center mb-2.5">
            {[
              { step: 1, label: '행사 정보' },
              { step: 2, label: '필요한 역할' },
              { step: 3, label: '인원·시급' },
              { step: 4, label: '예상 견적' },
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
                  <span className="text-xs truncate block mt-0.5">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-350 ease-out"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Slide Presentation Container */}
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
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-6 shadow-xs">
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
                    className="w-full min-h-12 px-4 border border-border rounded-xl text-sm font-medium text-ink bg-white focus:ring-2 focus:ring-brand focus:outline-none shadow-2xs"
                  />
                </div>

                {/* 날짜 선택 블록과 근무 시간 블록 (space-y-6으로 충분한 간격 분리) */}
                <div className="space-y-6 pt-1">
                  {/* A. 날짜 선택 블록 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-muted flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-brand" />
                        행사 진행 일정
                      </label>
                      {isMultiDay && (
                        <span className="bg-brand-soft text-brand-strong font-bold text-xs px-2.5 py-0.5 rounded-full border border-brand-border/60">
                          총 {totalDays}일간 진행
                        </span>
                      )}
                    </div>

                    {/* 슬라이딩 인디케이터 (하루 vs 여러 날) */}
                    <SlidingSegmentedTab
                      options={[
                        { value: 'single', label: '하루만 진행' },
                        { value: 'multi', label: '여러 날 진행' },
                      ]}
                      value={isMultiDay ? 'multi' : 'single'}
                      onChange={(val) => {
                        setIsMultiDay(val === 'multi');
                        if (val === 'single') setEndDate(startDate);
                      }}
                      className="max-w-xs"
                    />

                    {!isMultiDay ? (
                      <div>
                        <label className="text-xs font-semibold text-muted block mb-1">행사 날짜</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            setEndDate(e.target.value);
                          }}
                          className="w-full min-h-12 px-4 border border-border rounded-xl text-sm font-medium text-ink bg-white focus:ring-2 focus:ring-brand focus:outline-none shadow-2xs"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-muted block mb-1">시작일</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                              setStartDate(e.target.value);
                              if (endDate && e.target.value > endDate) setEndDate(e.target.value);
                            }}
                            className="w-full min-h-12 px-4 border border-border rounded-xl text-sm font-medium text-ink bg-white focus:ring-2 focus:ring-brand focus:outline-none shadow-2xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted block mb-1">종료일</label>
                          <input
                            type="date"
                            min={startDate}
                            value={endDate}
                            onChange={(e) => {
                              if (e.target.value < startDate) {
                                alert('종료일은 시작일보다 이전일 수 없습니다.');
                                return;
                              }
                              setEndDate(e.target.value);
                            }}
                            className="w-full min-h-12 px-4 border border-border rounded-xl text-sm font-medium text-ink bg-white focus:ring-2 focus:ring-brand focus:outline-none shadow-2xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* B. 근무 시간 블록 (독립된 카드 형태로 정돈) */}
                  <div className="space-y-3 pt-4 border-t border-border/60">
                    <label className="text-xs font-bold text-muted flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand" />
                      근무 시간 설정
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 시작 시간 독립 카드 */}
                      <div className="p-3.5 rounded-xl border border-border bg-white shadow-2xs space-y-1.5">
                        <label className="text-xs font-bold text-ink block">시작 시간</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full h-11 px-3 border border-border rounded-lg text-sm font-bold text-ink bg-surface focus:ring-2 focus:ring-brand focus:outline-none"
                        />
                        <p className="text-[11px] text-muted">현장 크루 집합 및 브리핑 시작</p>
                      </div>

                      {/* 종료 시간 독립 카드 */}
                      <div className="p-3.5 rounded-xl border border-border bg-white shadow-2xs space-y-1.5">
                        <label className="text-xs font-bold text-ink block">종료 시간</label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full h-11 px-3 border border-border rounded-lg text-sm font-bold text-ink bg-surface focus:ring-2 focus:ring-brand focus:outline-none"
                        />
                        <p className="text-[11px] text-muted">현장 정리 및 최종 퇴근 체크</p>
                      </div>
                    </div>

                    {/* 쉬는 시간 설정 카드 */}
                    <div className="p-3.5 rounded-xl border border-border bg-surface-muted/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-ink">쉬는 시간 (식사·휴게)</label>
                        <span className="text-xs font-extrabold text-brand">
                          일일 순 근무 {hours}시간
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min={0}
                          step={30}
                          value={breakMinutes}
                          onChange={(e) => setBreakMinutes(Math.max(0, Number(e.target.value)))}
                          className="w-28 h-10 px-3 border border-border rounded-lg text-sm font-bold text-ink bg-white focus:ring-2 focus:ring-brand focus:outline-none tabular-nums"
                        />
                        <span className="text-xs text-muted">분 (전체 {rawDurationMins}분 중 차감)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 카카오맵 장소 검색 및 도로명 주소 통일 컴포넌트 */}
                <KakaoPlaceSearchInput
                  venueName={venueName}
                  venueAddress={roadAddress}
                  venueDetail={detailAddress}
                  latitude={latitude}
                  longitude={longitude}
                  onSelectPlace={(place) => {
                    setVenueName(place.venueName);
                    setRoadAddress(place.venueAddress);
                    setLatitude(place.latitude);
                    setLongitude(place.longitude);
                  }}
                  onChangeDetail={(detail) => setDetailAddress(detail)}
                />
              </div>
            </div>

            {/* STEP 2: SCOPE OF WORK (필요한 역할) */}
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
                  크루가 맡을 역할을 골라주세요. 여러 개를 선택할 수 있어요.
                </p>

                {/* 역할 선택 칩: 배경색을 채우지 않고 테두리/텍스트 강조 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {SCOPE_PRESETS.map((scope) => {
                    const isSelected = selectedScopes.includes(scope);
                    return (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => toggleScope(scope)}
                        className={cn(
                          'p-3.5 min-h-[52px] rounded-xl text-left text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer',
                          isSelected
                            ? 'bg-white border-2 border-brand-strong text-brand-strong font-bold shadow-xs'
                            : 'bg-white border border-border text-muted font-medium hover:border-brand-border'
                        )}
                      >
                        <span>{scope}</span>
                        {isSelected ? (
                          <Check className="w-4 h-4 text-brand-strong shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-border/80 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* STEP 3: HEADCOUNT, HOURLY RATE BUILDER & UNIFORM */}
            <div
              ref={step3Ref}
              className="w-full shrink-0"
              inert={currentStep !== 3 ? true : undefined}
              aria-hidden={currentStep !== 3}
            >
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-6 shadow-xs">
                <div>
                  <h2 className="text-base font-bold text-ink flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand" />
                    인원과 시급을 설정해 주세요
                  </h2>
                  <p className="text-xs text-muted mt-1">
                    역할별 인원과 시급을 설정하고 실시간 총액을 바로 확인하세요.
                  </p>
                </div>

                {/* 1. 시급 설정 모드 세그먼트 (슬라이딩 인디케이터) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted block">시급 설정 방식</label>
                  <SlidingSegmentedTab
                    options={[
                      { value: 'UNIFORM', label: '모든 역할 동일 시급' },
                      { value: 'DIFFERENTIAL', label: '역할별 따로 설정하기' },
                    ]}
                    value={wageMode}
                    onChange={(val) => setWageMode(val as 'UNIFORM' | 'DIFFERENTIAL')}
                    className="max-w-md"
                  />
                </div>

                {/* A. 일괄 시급 모드 */}
                {wageMode === 'UNIFORM' && (
                  <div className="p-4 bg-white border border-border rounded-2xl space-y-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-ink block">기본 추천 시급</span>
                        <span className="text-[11px] text-muted">2026 최저시급(10,030원) 이상 적용</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setUniformHourlyRate((prev) => Math.max(10030, prev - 1000))}
                          className="w-10 h-10 flex items-center justify-center rounded-lg border border-border bg-surface text-ink hover:bg-canvas transition-colors cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="relative w-28">
                          <input
                            type="number"
                            step={1000}
                            min={10030}
                            value={uniformHourlyRate}
                            onChange={(e) => setUniformHourlyRate(Math.max(10030, Number(e.target.value)))}
                            className="w-full h-10 pl-2 pr-6 text-center text-sm font-bold text-ink border border-border rounded-lg tabular-nums"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted">원</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUniformHourlyRate((prev) => prev + 1000)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg border border-border bg-surface text-ink hover:bg-canvas transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 우대 수당 토글 */}
                    <div className="pt-2 border-t border-border/60 space-y-2">
                      <span className="text-xs font-semibold text-muted block">우대 수당 추가</span>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setUniformAllowForeign((prev) => !prev)}
                          className={cn(
                            'px-3 py-2 rounded-xl border font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                            uniformAllowForeign
                              ? 'bg-white border-2 border-brand-strong text-brand-strong shadow-xs'
                              : 'bg-white border border-border text-muted hover:border-brand-border'
                          )}
                        >
                          <Check className={cn('w-3.5 h-3.5', uniformAllowForeign ? 'opacity-100' : 'opacity-30')} />
                          <span>외국어 응대 가능 (+2,500원)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUniformAllowLeader((prev) => !prev)}
                          className={cn(
                            'px-3 py-2 rounded-xl border font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                            uniformAllowLeader
                              ? 'bg-white border-2 border-brand-strong text-brand-strong shadow-xs'
                              : 'bg-white border border-border text-muted hover:border-brand-border'
                          )}
                        >
                          <Check className={cn('w-3.5 h-3.5', uniformAllowLeader ? 'opacity-100' : 'opacity-30')} />
                          <span>현장 리더/총괄 (+2,000원)</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-muted">
                        적용 실효 시급: <strong className="text-brand font-bold">{uniformEffectiveRate.toLocaleString()}원/시간</strong>
                      </p>
                    </div>

                    {/* 역할별 투입 인원 설정 */}
                    <div className="pt-3 border-t border-border/60 space-y-2.5">
                      <span className="text-xs font-bold text-ink block">역할별 투입 인원</span>
                      {activeRoleList.map((role) => (
                        <div
                          key={role}
                          className="p-3 bg-surface-muted/40 border border-border rounded-xl flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-ink block truncate">{role}</span>
                            <span className="text-[11px] text-muted">
                              1인 일당 {Math.floor(hours * uniformEffectiveRate).toLocaleString()}원
                            </span>
                          </div>
                          <HeadcountInput
                            id={`count-${role}`}
                            value={roleSettings[role]?.headcount || 2}
                            onChange={(val) => updateRoleSetting(role, { headcount: val })}
                            min={1}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* B. 역할별 따로 설정하기 (차등 모드) */}
                {wageMode === 'DIFFERENTIAL' && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-muted block">선택된 역할별 인원 및 시급 설정</span>
                    {activeRoleList.map((role) => {
                      const cfg = roleSettings[role] || {
                        headcount: 2,
                        hourlyRate: 13000,
                        allowForeign: false,
                        allowLeader: false,
                      };
                      const effRoleRate =
                        cfg.hourlyRate +
                        (cfg.allowForeign ? 2500 : 0) +
                        (cfg.allowLeader ? 2000 : 0);
                      const roleDailyWage = Math.floor(hours * effRoleRate);

                      return (
                        <div
                          key={role}
                          className="p-4 bg-white border border-border rounded-2xl space-y-3.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                            <h4 className="text-xs sm:text-sm font-bold text-ink truncate">{role}</h4>
                            <span className="text-[11px] font-bold text-brand bg-brand-soft px-2 py-0.5 rounded-full shrink-0">
                              실효 {effRoleRate.toLocaleString()}원/h
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-muted block">투입 인원</span>
                              <HeadcountInput
                                id={`diff-count-${role}`}
                                value={cfg.headcount}
                                onChange={(val) => updateRoleSetting(role, { headcount: val })}
                                min={1}
                              />
                            </div>

                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-muted block">역할 시급</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateRoleSetting(role, {
                                      hourlyRate: Math.max(10030, cfg.hourlyRate - 1000),
                                    })
                                  }
                                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-surface text-ink hover:bg-canvas transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <div className="relative w-24">
                                  <input
                                    type="number"
                                    step={1000}
                                    min={10030}
                                    value={cfg.hourlyRate}
                                    onChange={(e) =>
                                      updateRoleSetting(role, {
                                        hourlyRate: Math.max(10030, Number(e.target.value)),
                                      })
                                    }
                                    className="w-full h-9 pl-1 pr-5 text-center text-xs font-bold text-ink border border-border rounded-lg tabular-nums"
                                  />
                                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted">원</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateRoleSetting(role, {
                                      hourlyRate: cfg.hourlyRate + 1000,
                                    })
                                  }
                                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-surface text-ink hover:bg-canvas transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 역할별 개별 우대 수당 토글 */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => updateRoleSetting(role, { allowForeign: !cfg.allowForeign })}
                              className={cn(
                                'px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1',
                                cfg.allowForeign
                                  ? 'bg-white border-2 border-brand-strong text-brand-strong shadow-xs'
                                  : 'bg-white border border-border text-muted hover:border-brand-border'
                              )}
                            >
                              <Check className={cn('w-3 h-3', cfg.allowForeign ? 'opacity-100' : 'opacity-30')} />
                              <span>외국어 응대 (+2,500원)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateRoleSetting(role, { allowLeader: !cfg.allowLeader })}
                              className={cn(
                                'px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1',
                                cfg.allowLeader
                                  ? 'bg-white border-2 border-brand-strong text-brand-strong shadow-xs'
                                  : 'bg-white border border-border text-muted hover:border-brand-border'
                              )}
                            >
                              <Check className={cn('w-3 h-3', cfg.allowLeader ? 'opacity-100' : 'opacity-30')} />
                              <span>현장 리더 (+2,000원)</span>
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40 text-muted">
                            <span>1인 일당 {roleDailyWage.toLocaleString()}원</span>
                            <span className="font-bold text-ink">
                              {cfg.headcount}명 합계 {(roleDailyWage * cfg.headcount).toLocaleString()}원/일
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. 실시간 일당 및 총 견적 브리핑 카드 */}
                <div className="bg-brand-soft/40 border border-brand-border/60 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-strong flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand" />
                      실시간 견적 브리핑
                    </span>
                    <span className="text-xs font-semibold text-muted">
                      {isMultiDay ? `총 ${totalDays}일간 진행` : '하루 1일 진행'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted">
                      <span>총 크루 인원</span>
                      <span className="font-bold text-ink">
                        {isMultiDay
                          ? `하루 ${totalHeadcount}명 (연인원 ${totalHeadcount * totalDays}명)`
                          : `${totalHeadcount}명`}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>일일 순 근무 시간</span>
                      <span className="font-medium text-ink">{hours}시간</span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>일일 크루 보수 합계</span>
                      <span className="font-bold text-ink">{dailyStaffWage.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between text-muted pt-1 border-t border-brand-border/40">
                      <span>전체 크루 보수 (합계)</span>
                      <span className="font-bold text-ink">{totalStaffWage.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>플랫폼 운영료 (15%)</span>
                      <span>+{platformFeeWon.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>부가가치세 (10%)</span>
                      <span>+{vatWon.toLocaleString()}원</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t-2 border-brand/20 flex items-center justify-between text-sm sm:text-base font-black text-brand-strong">
                    <span>예상 결제 총액</span>
                    <span className="tabular-nums text-lg sm:text-xl text-brand">{grandTotalWon.toLocaleString()}원</span>
                  </div>
                </div>

                {/* 3. 복장 안내 5가지 다변화 옵션 */}
                <div className="pt-4 border-t border-border/60 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-muted block">복장 안내</label>
                    <p className="text-[11px] text-muted mt-0.5">행사 분위기에 적합한 복장 가이드를 선택해 주세요.</p>
                  </div>

                  <div className="space-y-2">
                    {DRESS_CODE_PRESETS.map((preset) => {
                      const isSelected = selectedDressCodeId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSelectedDressCodeId(preset.id)}
                          className={cn(
                            'w-full p-3.5 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between gap-3',
                            isSelected
                              ? 'bg-white border-2 border-brand-strong text-brand-strong font-bold shadow-xs'
                              : 'bg-white border border-border text-muted font-medium hover:border-brand-border'
                          )}
                        >
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-ink">{preset.title}</div>
                            <div className="text-[11px] text-muted mt-0.5">{preset.desc}</div>
                          </div>
                          {isSelected ? (
                            <Check className="w-4 h-4 text-brand-strong shrink-0" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-border/80 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedDressCodeId === 'CUSTOM' && (
                    <div className="pt-2">
                      <label className="text-xs font-semibold text-muted block mb-1">복장 상세 가이드 직접 입력</label>
                      <input
                        type="text"
                        value={customDressCodeText}
                        onChange={(e) => setCustomDressCodeText(e.target.value)}
                        placeholder="예: 흰색 상의 셔츠 + 베이지 슬랙스, 명찰 패용 필수"
                        className="w-full min-h-12 px-4 border border-border rounded-xl text-sm font-medium text-ink bg-white focus:ring-2 focus:ring-brand focus:outline-none shadow-2xs"
                      />
                    </div>
                  )}
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
                  최종 견적을 확인해 주세요
                </h2>

                {/* 행사 개요 카드 */}
                <div className="p-4 bg-canvas rounded-xl space-y-2 text-xs text-muted">
                  <div className="flex justify-between">
                    <span className="text-muted">행사명</span>
                    <span className="font-bold text-ink">{title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">장소</span>
                    <span className="font-semibold text-ink text-right">
                      {venueName || roadAddress} {detailAddress && `(${detailAddress})`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">행사 일정</span>
                    <span className="font-semibold text-ink">
                      {isMultiDay
                        ? `${startDate} ~ ${endDate} (총 ${totalDays}일)`
                        : `${startDate} (1일)`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">근무 시간</span>
                    <span className="font-medium text-ink">
                      {startTime} ~ {endTime} (일일 순 근무 {hours}시간)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">총 투입 인원</span>
                    <span className="font-bold text-brand">
                      {isMultiDay
                        ? `총 ${totalDays}일간 하루 ${totalHeadcount}명 (연인원 ${totalHeadcount * totalDays}명)`
                        : `${totalHeadcount}명`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">복장 안내</span>
                    <span className="font-medium text-ink truncate max-w-[200px]">{effectiveDressCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">시급 방식</span>
                    <span className="font-semibold text-ink">
                      {wageMode === 'UNIFORM' ? '전체 역할 동일 시급' : '역할별 차등 시급'}
                    </span>
                  </div>
                </div>

                {/* 역할별 상세 배정 브리핑 */}
                <div className="space-y-1.5 text-xs pt-1">
                  <span className="text-xs font-bold text-ink block">역할별 배정 내역</span>
                  {activeRoleList.map((role) => {
                    const cfg = roleSettings[role] || {
                      headcount: 2,
                      hourlyRate: 13000,
                      allowForeign: false,
                      allowLeader: false,
                    };
                    const roleEffRate =
                      wageMode === 'UNIFORM'
                        ? uniformEffectiveRate
                        : cfg.hourlyRate +
                          (cfg.allowForeign ? 2500 : 0) +
                          (cfg.allowLeader ? 2000 : 0);
                    return (
                      <div
                        key={role}
                        className="flex items-center justify-between p-2.5 bg-white border border-border rounded-xl"
                      >
                        <span className="text-ink font-semibold">{role}</span>
                        <span className="text-muted">
                          {cfg.headcount}명 · 시급 {roleEffRate.toLocaleString()}원 (일당 {Math.floor(hours * roleEffRate).toLocaleString()}원)
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 금액 견적 명세표 */}
                <div className="space-y-2.5 text-xs text-muted pt-2 border-t border-border/60">
                  <div className="flex justify-between items-center">
                    <span>전체 크루 보수 ({totalDays}일간 합계)</span>
                    <span className="font-semibold text-ink tabular-nums">
                      {totalStaffWage.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted">
                    <span>운영료 (15%)</span>
                    <span className="tabular-nums">+{platformFeeWon.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-ink pt-2 border-t border-border/40">
                    <span>공급가액</span>
                    <span className="tabular-nums">{supplyPriceWon.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center text-muted">
                    <span>부가가치세 (10%)</span>
                    <span className="tabular-nums">+{vatWon.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center text-base sm:text-lg font-black text-brand pt-3 border-t-2 border-border">
                    <span>최종 결제 예상 총액</span>
                    <span className="tabular-nums">{grandTotalWon.toLocaleString()}원</span>
                  </div>
                </div>

                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
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
              className="flex-1 min-h-13 border border-border bg-white text-muted font-bold text-sm rounded-xl hover:bg-canvas transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>이전</span>
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 min-h-13 bg-brand hover:bg-brand-hover text-inverse font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>다음</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="flex-1 min-h-13 bg-brand hover:bg-brand-hover text-inverse font-bold text-sm sm:text-base rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{isSubmitting ? '등록하고 크루 매칭 중…' : '행사 등록하고 크루 매칭받기'}</span>
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
