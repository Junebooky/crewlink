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
  'POS 결제 및 영수증 발행',
  '외국어 회화 (영어/일어/중국어)',
  '대기열 및 관람객 동선 통제',
  'VIP 라운지 의전 및 케이터링',
  '등록 데스크 명찰 배부',
  '체험 부스 진행 및 시연',
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
    '외국어 회화 (영어/일어/중국어)',
    '대기열 및 관람객 동선 통제',
    '등록 데스크 명찰 배부',
  ]);

  // Step 3: Specs & Headcount
  const [headcountGuide, setHeadcountGuide] = useState(4);
  const [headcountVIP, setHeadcountVIP] = useState(2);
  const [headcountDesk, setHeadcountDesk] = useState(2);
  const [uniformSpec, setUniformSpec] = useState<'PROVIDED_BY_CLIENT' | 'ALL_BLACK_FORMAL'>('ALL_BLACK_FORMAL');

  // API Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
        headers: { 'Content-Type': 'application/json' },
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
            { role: '동선 통제 & 일반 안내', count: headcountGuide },
            { role: 'VIP 라운지 리셉션', count: headcountVIP },
            { role: '등록 데스크 운영', count: headcountDesk },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '발주 등록에 실패했습니다.');
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
          <span className="text-xs font-bold text-[#1E60F3] bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            B02 SOW 도급 발주 위저드
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">새 행사 운영 요청서 작성</h1>
          <p className="text-xs text-slate-500 mt-1">
            체계적인 과업지시서(SOW)를 기반으로 검증된 전문 크루 인력을 발주합니다.
          </p>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { step: 1, label: '행사 개요' },
            { step: 2, label: '과업 범위' },
            { step: 3, label: '인원/스펙' },
            { step: 4, label: '견적 확인' },
          ].map((item) => (
            <div
              key={item.step}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-xs transition-colors',
                currentStep === item.step
                  ? 'border-[#1E60F3] text-[#1E60F3] font-bold'
                  : currentStep > item.step
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-slate-200 text-slate-400'
              )}
            >
              <div className="text-[10px] uppercase">Step {item.step}</div>
              <div>{item.label}</div>
            </div>
          ))}
        </div>

        {/* STEP 1: EVENT OVERVIEW */}
        {currentStep === 1 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#1E60F3]" />
              Step 1: 행사 기본 개요
            </h2>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">행사명</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1E60F3] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">행사 일자</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1E60F3] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">시작 시각</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1E60F3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">종료 시각</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1E60F3] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">휴게 시간 (분)</label>
              <input
                type="number"
                min={0}
                step={30}
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value))}
                className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1E60F3] focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                * 실근무 시간: {hours}시간 (총 {rawDurationMins}분 중 {breakMinutes}분 휴게 제외)
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">도로명 주소</label>
              <input
                type="text"
                value={roadAddress}
                onChange={(e) => setRoadAddress(e.target.value)}
                className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1E60F3] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">상세 위치</label>
              <input
                type="text"
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#1E60F3] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2: SCOPE OF WORK */}
        {currentStep === 2 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#1E60F3]" />
              Step 2: 과업 범위 지정 (SOW 프리셋)
            </h2>
            <p className="text-xs text-slate-500">
              크루에게 명확히 지시될 과업 범위를 선택해 주세요. 현장 지휘의 기준이 됩니다.
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
                      'p-3.5 min-h-[52px] rounded-xl border text-left text-xs font-medium flex items-center justify-between transition-all',
                      isSelected
                        ? 'border-[#1E60F3] bg-blue-50/70 text-[#1E60F3] font-bold shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                    )}
                  >
                    <span>{scope}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#1E60F3] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: HEADCOUNT & SPECS */}
        {currentStep === 3 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1E60F3]" />
              Step 3: 포지션별 필요 인원 및 복장 규격
            </h2>

            {/* Stepper Inputs without slider */}
            <div className="space-y-4 divide-y divide-slate-100">
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-800">동선 통제 & 일반 안내</div>
                  <div className="text-xs text-slate-500">시급 15,000원 기준</div>
                </div>
                <HeadcountInput value={headcountGuide} onChange={setHeadcountGuide} min={1} />
              </div>

              <div className="pt-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-800">VIP 라운지 리셉션</div>
                  <div className="text-xs text-slate-500">외국어 소통 가능자 우선 매칭</div>
                </div>
                <HeadcountInput value={headcountVIP} onChange={setHeadcountVIP} min={0} />
              </div>

              <div className="pt-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-800">등록 데스크 운영</div>
                  <div className="text-xs text-slate-500">POS/명찰 배부 담당</div>
                </div>
                <HeadcountInput value={headcountDesk} onChange={setHeadcountDesk} min={0} />
              </div>
            </div>

            {/* Uniform */}
            <div className="pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block mb-2">유니폼 및 복장 규격</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setUniformSpec('ALL_BLACK_FORMAL')}
                  className={cn(
                    'p-3.5 min-h-[52px] border rounded-xl text-left font-medium transition-colors',
                    uniformSpec === 'ALL_BLACK_FORMAL'
                      ? 'border-[#1E60F3] bg-blue-50 text-[#1E60F3] font-bold'
                      : 'border-slate-200 text-slate-600'
                  )}
                >
                  <div>단정 올블랙 정장/슬랙스</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">크루 자체 지참</div>
                </button>
                <button
                  type="button"
                  onClick={() => setUniformSpec('PROVIDED_BY_CLIENT')}
                  className={cn(
                    'p-3.5 min-h-[52px] border rounded-xl text-left font-medium transition-colors',
                    uniformSpec === 'PROVIDED_BY_CLIENT'
                      ? 'border-[#1E60F3] bg-blue-50 text-[#1E60F3] font-bold'
                      : 'border-slate-200 text-slate-600'
                  )}
                >
                  <div>주최측 유니폼 현장 지급</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">사이즈 사전 집계</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SUMMARY & FORMAL QUOTE */}
        {currentStep === 4 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#1E60F3]" />
              Step 4: 발주 내역 및 공식 견적 확인
            </h2>

            {/* Overview Summary */}
            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">행사명</span>
                <span className="font-bold text-slate-900">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">일시 및 시간</span>
                <span>{eventDate} (실근무 {hours}시간)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">총 발주 인원</span>
                <span className="font-bold text-[#1E60F3]">{totalHeadcount}명</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">지정 과업</span>
                <span>{selectedScopes.length}개 분야 선택됨</span>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2.5 text-xs text-slate-700 pt-2">
              <div className="flex justify-between items-center">
                <span>크루 도급 보수 합계 ({totalHeadcount}명 × {hours}h × 15,000원)</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {staffRemunerationWon.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>플랫폼 운영 수수료 (15%)</span>
                <span className="tabular-nums">+{platformFeeWon.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between items-center font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>공급가액</span>
                <span className="tabular-nums">{supplyPriceWon.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>부가가치세 (VAT 10%)</span>
                <span className="tabular-nums">+{vatWon.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between items-center text-base font-black text-[#1E60F3] pt-3 border-t-2 border-slate-200">
                <span>최종 결제 예상 총액</span>
                <span className="tabular-nums">{totalOrderAmountWon.toLocaleString()}원</span>
              </div>
            </div>

            {submitError && (
              <div className="p-3 bg-[#FFF0F3] border border-[#FDC4D0] rounded-xl text-[#BB2449] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 min-h-[52px] border border-slate-300 bg-white text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>이전 단계</span>
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 min-h-[52px] bg-[#1E60F3] hover:bg-[#164BC4] text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>다음 단계</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="flex-1 min-h-[52px] bg-[#08734E] hover:bg-[#065F40] text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{isSubmitting ? '발주 등록 중...' : 'SOW 운영 발주 승인 및 등록'}</span>
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
