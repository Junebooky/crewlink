import React from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Building2,
  ShieldCheck,
  QrCode,
  FileCheck2,
  Receipt,
  Users,
  Layers,
  Inbox,
  AlertTriangle,
  ArrowRight,
  Database,
  Calculator,
  Lock,
  CheckCircle2
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900">
      {/* Top Navigation */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1E60F3] text-white flex items-center justify-center font-black text-xl shadow-xs">
            C
          </div>
          <div>
            <div className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">
              CrewLink <span className="text-xs text-[#1E60F3] font-bold">v2.0</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">B2B 디지털 행사 도급 플랫폼</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            PostgreSQL 16 & Next.js 15
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-12 pb-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-[#1E60F3] rounded-full text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          노무 실질 준수 • 3.3% 정밀 원천세 엔진 • 동시성 배제 제약
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          행사 현장 인력 도급의 <br className="hidden sm:inline" />
          새로운 표준, <span className="text-[#1E60F3]">크루링크(CrewLink)</span>
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
          과업지시서(SOW) 기반의 공정 도급 체계, 10원 미만 절사 세무 산출,
          60초 가변 QR 출결 챌린지 및 실시간 라이브 관제를 경험해 보세요.
        </p>
      </section>

      {/* 3 Core Roles Gateway Cards */}
      <section className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Crew Portal (C01~C06) */}
          <div className="bg-white border border-slate-200 hover:border-[#1E60F3] rounded-2xl p-6 flex flex-col justify-between shadow-xs transition-all hover:shadow-md group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E60F3] flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#1E60F3] uppercase tracking-wider">
                  Role: 현장 스태프
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">크루 모바일 PWA</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  모바일 최적화 화면에서 배정 확인, 출발 상태 전송, 현장 QR 출근 인증 및 전자서약을 수행합니다.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <QrCode className="w-3.5 h-3.5 text-slate-400" />
                  <span>C04 60초 가변 QR 인증 & 대면 확인 대기 뷰</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>C03 벡터 스트로크 보존 전자서약서</span>
                </div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-slate-400" />
                  <span>C06 3.3% 원천세 공제 정산 명세서 영수증</span>
                </div>
              </div>
            </div>

            <Link
              href="/crew"
              className="mt-6 w-full h-11 bg-[#1E60F3] group-hover:bg-[#164BC4] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>크루 PWA 체험하기</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 2. Client Web Portal (B01~B04) */}
          <div className="bg-white border border-slate-200 hover:border-[#1E60F3] rounded-2xl p-6 flex flex-col justify-between shadow-xs transition-all hover:shadow-md group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  Role: 발주 고객사
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">광고주(고객) 웹 포털</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  4단계 위저드로 과업을 발주하고, 크루 개인정보가 마스킹된 현장 관제 보드로 도착 현황을 확인합니다.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>B02 4-Step SOW 운영 요청 위저드</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>인원 Stepper(min=1) & 15% 투명 견적서</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>B01 마스킹 프로필 실시간 배치 보드</span>
                </div>
              </div>
            </div>

            <Link
              href="/client"
              className="mt-6 w-full h-11 bg-slate-900 group-hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>고객 포털 체험하기</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 3. Ops Dashboard (O01~O03) */}
          <div className="bg-white border border-slate-200 hover:border-[#1E60F3] rounded-2xl p-6 flex flex-col justify-between shadow-xs transition-all hover:shadow-md group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Inbox className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                  Role: 플랫폼 총괄 운영자
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">슈퍼 어드민 관제함</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  미확인 출근, T-30 결원 경보를 실시간 큐에서 처리하고, 동시성 락 기반 예외 승인 및 긴급 대타를 파견합니다.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Inbox className="w-3.5 h-3.5 text-slate-400" />
                  <span>O01 수동 대면 확인 & T-30 결원 작업함 큐</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>O02 버전 선점 락 & 사유 필수 예외 Sheet</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                  <span>O03 인근 크루 1인 선착순 원자적 대타 배정</span>
                </div>
              </div>
            </div>

            <Link
              href="/ops"
              className="mt-6 w-full h-11 bg-rose-600 group-hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>운영 관제 대시보드</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Engineering Non-Negotiables Grid */}
      <section className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-slate-900 text-white rounded-2xl p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">
              Core Engineering Architecture
            </span>
            <h3 className="text-xl sm:text-2xl font-bold">5대 엔지니어링 절대 원칙 구현</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>1. 노무 실질 준수</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                일률 3.3% 프리랜서 간주 배제. SOW 과업지시서 기반 도급 및 근로기준법 제20조 위약금/벌금 차감 금지.
              </p>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-blue-400" />
                <span>2. 세무 계산 정밀성</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                2024년 7월 1일 이후 소액부징수 면제 배제. 국고금관리법/지방회계법 10원 미만 절사 BigInt 40개 테스트 통과.
              </p>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>3. 개인정보 완전 격리</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                주민등록번호 원문 미보관. 세무 테크 식별자(`tax_provider_user_key`) 및 토큰화 계좌 분리 보관.
              </p>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Database className="w-4 h-4 text-purple-400" />
                <span>4. 동시성 배제 제약</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                PostgreSQL `work_reservations`에 `EXCLUDE USING gist` 제약 및 행 잠금(`FOR UPDATE`) 적용.
              </p>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>5. 허위 낙관적 UI 금지</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                출근/서명/결제는 서버의 성공 응답 확정 후에만 UI 전이. 카운트업/카드점멸/쉐이크 배제.
              </p>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-rose-400" />
                <span>6. WCAG 2.2 AA 접근성</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                모든 상태 배지 및 본문 명도 대비 4.5:1 이상 검증. 텍스트 병기 및 가상 뷰포트 키보드 회피.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-8 text-center text-xs text-slate-400 border-t border-slate-200 mt-8">
        © 2026 CrewLink Inc. All rights reserved. • B2B Event Workforce Management Platform
      </footer>
    </div>
  );
}
