'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  Clock,
  Receipt,
  ArrowRight,
  Sparkles,
  Building2,
  Calculator,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PublicHeader } from '@/components/common/PublicHeader';

export default function BizLandingPage() {
  // Interactive Live Quote Estimator state
  const [headcount, setHeadcount] = useState<number>(6);
  const [days, setDays] = useState<number>(3);
  const [hoursPerDay, setHoursPerDay] = useState<number>(8);
  const hourlyRateWon = 15000;

  // Real formula from task_v2.6.md:
  // 세전 보수: 크루 계약상 약정 보수
  // 운영료: 세전 보수 총액 × 15% (10원 미만 절사)
  // VAT: (세전 보수 총액 + 운영료) × 10% (10원 미만 절사)
  const staffRemunerationWon = headcount * days * hoursPerDay * hourlyRateWon;
  const platformFeeWon = Math.floor((staffRemunerationWon * 0.15) / 10) * 10;
  const subtotalWon = staffRemunerationWon + platformFeeWon;
  const vatWon = Math.floor((subtotalWon * 0.1) / 10) * 10;
  const totalAmountWon = subtotalWon + vatWon;

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Header */}
      <PublicHeader />

      <main className="flex-1">
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-subtle via-canvas to-canvas py-16 sm:py-24 px-4 sm:px-6 border-b border-border-subtle">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-soft border border-brand-border text-brand-strong text-xs font-bold tracking-wide animate-in fade-in">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span>팝업스토어 · 박람회 · 브랜드 행사 전용 B2B 도급 솔루션</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-ink tracking-tight leading-tight break-keep">
              행사 크루 채용부터 출근 관제,<br className="hidden sm:inline" />
              <span className="text-brand">15% 단일 운영료</span>로 완벽하게.
            </h1>

            <p className="text-sm sm:text-lg text-muted max-w-2xl mx-auto break-keep leading-relaxed">
              복잡한 일용직 노무 관리와 노쇼 불안은 이제 그만.<br />
              검증된 크루 비주얼 컨펌, D-Day 실시간 출근 관제, 전자세금계산서 일원화까지 한곳에서 이어가세요.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/client/request"
                className="w-full sm:w-auto min-h-[52px] px-8 rounded-2xl bg-brand hover:bg-brand-hover text-inverse text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-brand/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>행사 견적 산출하고 크루 요청하기</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#calculator"
                className="w-full sm:w-auto min-h-[52px] px-6 rounded-2xl border border-border bg-surface hover:bg-canvas text-ink text-sm sm:text-base font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Calculator className="w-4 h-4 text-brand" />
                <span>예상 견적 계산해보기</span>
              </a>
            </div>

            {/* Trust Metrics Pill */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
              <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs">
                <p className="text-2xl font-black text-brand tabular-nums">15%</p>
                <p className="text-xs text-muted font-medium mt-0.5">투명 고정 운영 대행료</p>
              </div>
              <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs">
                <p className="text-2xl font-black text-ink tabular-nums">99.4%</p>
                <p className="text-xs text-muted font-medium mt-0.5">D-Day 출근 달성률</p>
              </div>
              <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs">
                <p className="text-2xl font-black text-ink tabular-nums">T-30</p>
                <p className="text-xs text-muted font-medium mt-0.5">결원 시 긴급 대체 배정</p>
              </div>
              <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xs">
                <p className="text-2xl font-black text-ink tabular-nums">100%</p>
                <p className="text-xs text-muted font-medium mt-0.5">전자세금계산서 증빙</p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. 4 Core Value Pillars */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-brand uppercase tracking-wider">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink mt-1.5 tracking-tight">
              주최사가 안심하고 맡길 수 있는 4가지 약속
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pillar 1 */}
            <div className="p-7 rounded-3xl bg-surface border border-border hover:border-brand-border transition-all duration-200 shadow-2xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand-strong flex items-center justify-center font-black">
                <Receipt className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">15% 투명 고정 운영료</h3>
                <p className="text-xs sm:text-sm text-muted mt-1.5 leading-relaxed break-keep">
                  임의의 가변 수수료(12~15%)나 숨은 부대비용이 없습니다. 크루 약정 세전 보수의 15% 단일 요율로 견적을 사전 확정하며, 계약별 승인 요율만 청구합니다.
                </p>
              </div>
              <ul className="text-xs text-ink/80 space-y-1.5 pt-2 border-t border-border-subtle font-medium">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>세전 보수 · 실비 변상 · 운영료 항목 명확 분리</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>소득세 원천징수와 무관한 투명한 기준 금액 산정</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="p-7 rounded-3xl bg-surface border border-border hover:border-brand-border transition-all duration-200 shadow-2xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand-strong flex items-center justify-center font-black">
                <Users className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">크루 비주얼 & 프로필 사전 컨펌</h3>
                <p className="text-xs sm:text-sm text-muted mt-1.5 leading-relaxed break-keep">
                  단순 인원 머릿수 배정이 아닙니다. 유니폼 핏, 프로필 사진, 이전 팝업스토어 및 박람회 누적 평가 평점을 주최사가 직접 확인하고 선발합니다.
                </p>
              </div>
              <ul className="text-xs text-ink/80 space-y-1.5 pt-2 border-t border-border-subtle font-medium">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>역할별(VIP 리셉션, 동선 안내, POS 결제) 맞춤 매칭</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>브랜드 톤앤매너에 맞춘 유니폼 사이즈 사전 취합</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="p-7 rounded-3xl bg-surface border border-border hover:border-brand-border transition-all duration-200 shadow-2xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand-strong flex items-center justify-center font-black">
                <Clock className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">D-Day 실시간 출근 관제 & T-30 대체</h3>
                <p className="text-xs sm:text-sm text-muted mt-1.5 leading-relaxed break-keep">
                  현장 시작 2시간 전 출발 알림, 다이내믹 QR 기반 위치 인증으로 출근 상태를 실시간 관제합니다. 지각 및 무단 결근 감지 시 30분 내 예비 크루를 투입합니다.
                </p>
              </div>
              <ul className="text-xs text-ink/80 space-y-1.5 pt-2 border-t border-border-subtle font-medium">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>출발 ➔ 현장 도착 ➔ 근무 완료 단계별 라이브 보드</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>스마트폰 미인식 시 현장 담당자 대면 승인 절차 지원</span>
                </li>
              </ul>
            </div>

            {/* Pillar 4 */}
            <div className="p-7 rounded-3xl bg-surface border border-border hover:border-brand-border transition-all duration-200 shadow-2xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand-strong flex items-center justify-center font-black">
                <FileCheck className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">전자세금계산서 일원화 라이프사이클</h3>
                <p className="text-xs sm:text-sm text-muted mt-1.5 leading-relaxed break-keep">
                  크루 개개인 원천세 신고와 이체 번거로움 없이, 크루링크와 단일 도급 용역 계약을 체결하고 합법적인 전자세금계산서 1장으로 세무 처리를 종결합니다.
                </p>
              </div>
              <ul className="text-xs text-ink/80 space-y-1.5 pt-2 border-t border-border-subtle font-medium">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>발급 · 국세청 전송 · 계약 변경 수정세금계산서 일원화</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>근로기준법 준수 표준 SOW 계약서 전자 서명 연동</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Interactive Quote Estimator Section */}
        <section id="calculator" className="py-16 sm:py-20 px-4 sm:px-6 bg-surface border-y border-border">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-brand uppercase tracking-wider">
                Instant Quotation
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                실시간 행사 견적 계산기
              </h2>
              <p className="text-xs sm:text-sm text-muted break-keep">
                필요 인원과 일정에 맞춰 예상 공급가액과 15% 운영 대행료를 즉시 확인하세요.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-canvas p-6 sm:p-8 rounded-3xl border border-border shadow-xs">
              {/* Inputs Column */}
              <div className="md:col-span-7 space-y-5">
                {/* 1. Headcount */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-ink">
                    <span>필요 크루 인원</span>
                    <span className="text-brand font-black text-sm">{headcount}명</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={headcount}
                    onChange={(e) => setHeadcount(Number(e.target.value))}
                    className="w-full accent-brand cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-muted mt-1">
                    <span>1명</span>
                    <span>15명</span>
                    <span>30명</span>
                  </div>
                </div>

                {/* 2. Days */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-ink">
                    <span>행사 진행 일수</span>
                    <span className="text-brand font-black text-sm">{days}일</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="14"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="w-full accent-brand cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-muted mt-1">
                    <span>1일 (원데이)</span>
                    <span>7일 (일주일)</span>
                    <span>14일 (2주간)</span>
                  </div>
                </div>

                {/* 3. Hours per day */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-ink">
                    <span>일일 실 근무 시간</span>
                    <span className="text-brand font-black text-sm">{hoursPerDay}시간</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="12"
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(Number(e.target.value))}
                    className="w-full accent-brand cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-muted mt-1">
                    <span>4시간 (파트타임)</span>
                    <span>8시간 (풀타임)</span>
                    <span>12시간</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface border border-border text-xs text-muted flex items-center justify-between">
                  <span>적용 기준 시급</span>
                  <span className="font-bold text-ink tabular-nums">15,000원 / 시간</span>
                </div>
              </div>

              {/* Summary Card Column */}
              <div className="md:col-span-5 bg-surface p-6 rounded-3xl border border-brand-border shadow-md space-y-4">
                <h3 className="text-xs font-extrabold text-muted uppercase tracking-wider">
                  산출 견적 내역 (VAT 별도)
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">크루 세전 보수 총액</span>
                    <span className="font-bold text-ink tabular-nums">
                      {staffRemunerationWon.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">플랫폼 운영료 (15%)</span>
                    <span className="font-bold text-brand tabular-nums">
                      {platformFeeWon.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">부가세 (VAT 10%)</span>
                    <span className="font-bold text-ink tabular-nums">
                      {vatWon.toLocaleString()}원
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex flex-col gap-1">
                  <span className="text-xs font-bold text-muted">최종 예상 청구액</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-brand-strong tabular-nums">
                      {totalAmountWon.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-ink">원</span>
                  </div>
                </div>

                <Link
                  href="/client/request"
                  className="w-full min-h-[48px] rounded-xl bg-brand hover:bg-brand-hover text-inverse text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>이 견적으로 요청서 작성</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Bottom CTA Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-t from-brand-subtle/50 to-canvas text-center">
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight break-keep">
              성공적인 팝업과 박람회,<br />지금 크루링크와 함께 준비하세요.
            </h2>
            <p className="text-xs sm:text-sm text-muted break-keep">
              행사 등록부터 견적 검토까지 5분이면 충분합니다. 전담 오퍼레이터가 신속하게 안내해 드립니다.
            </p>
            <div className="pt-2">
              <Link
                href="/client/request"
                className="inline-flex min-h-[52px] px-8 rounded-2xl bg-brand hover:bg-brand-hover text-inverse text-sm font-extrabold items-center gap-2 shadow-lg shadow-brand/20 transition-all cursor-pointer"
              >
                <span>행사 견적 산출하고 크루 요청하기</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-4 sm:px-6 py-8 text-xs text-muted">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 CrewLink. All rights reserved. 팝업 & 박람회 현장 운영 파트너</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-ink transition-colors">
              현장 찾기 (크루)
            </Link>
            <Link href="/guide" className="hover:text-ink transition-colors">
              이용 안내
            </Link>
            <Link href="/biz" className="font-semibold text-brand hover:underline">
              주최사 센터
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
