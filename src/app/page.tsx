'use client';

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
  const [year, setYear] = React.useState(2026);

  React.useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Top Navigation */}
      <header className="h-16 bg-surface border-b border-border px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand text-inverse flex items-center justify-center font-black text-xl shadow-xs">
            C
          </div>
          <div>
            <div className="font-extrabold text-lg text-ink tracking-tight leading-none">
              CrewLink
            </div>
            <div className="text-[10px] text-muted font-medium">행사와 크루를 잇다</div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-12 pb-8 text-center space-y-4">
        <h1 className="text-3xl sm:text-5xl font-black text-ink tracking-tight leading-tight">
          행사는 가볍게, <br className="hidden sm:inline" />
          운영은 <span className="text-brand">크루링크</span>
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-muted leading-relaxed">
          함께할 크루를 찾고, 현장 소식과 정산을 한곳에서 확인해요.
        </p>
      </section>

      {/* 3 Core Roles Gateway Cards */}
      <section className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Crew Portal */}
          <div className="bg-surface border border-border hover:border-brand rounded-2xl p-6 flex flex-col justify-between shadow-xs transition-all hover:shadow-md group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-subtle text-brand flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-brand uppercase tracking-wider">
                  크루
                </span>
                <h2 className="text-xl font-bold text-ink mt-1">오늘 함께할 현장</h2>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  시간과 장소를 확인하고, 출발과 도착을 알려주세요.
                </p>
              </div>

              <div className="pt-2 border-t border-border-subtle space-y-2 text-xs text-muted">
                <div className="flex items-center gap-2">
                  <QrCode className="w-3.5 h-3.5 text-muted" />
                  <span>QR로 도착 확인</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-3.5 h-3.5 text-muted" />
                  <span>모바일로 계약 확인</span>
                </div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-muted" />
                  <span>한눈에 보는 정산 내역</span>
                </div>
              </div>
            </div>

            <Link
              href="/crew"
              className="mt-6 w-full h-11 bg-brand group-hover:bg-brand-hover text-inverse font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>크루 화면 보기</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 2. Client Web Portal */}
          <div className="bg-surface border border-border hover:border-brand rounded-2xl p-6 flex flex-col justify-between shadow-xs transition-all hover:shadow-md group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-subtle text-brand-strong flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-brand-strong uppercase tracking-wider">
                  행사 담당자
                </span>
                <h2 className="text-xl font-bold text-ink mt-1">행사 준비를 한곳에서</h2>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  필요한 역할과 인원을 정하고, 현장 준비와 비용을 확인해요.
                </p>
              </div>

              <div className="pt-2 border-t border-border-subtle space-y-2 text-xs text-muted">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-muted" />
                  <span>역할·인원으로 운영 요청</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-muted" />
                  <span>항목별 예상 비용</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-muted" />
                  <span>크루 배치와 현장 현황</span>
                </div>
              </div>
            </div>

            <Link
              href="/client"
              className="mt-6 w-full h-11 bg-brand group-hover:bg-brand-hover text-inverse font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>행사 화면 보기</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 3. Ops Dashboard */}
          <div className="bg-surface border border-border hover:border-brand rounded-2xl p-6 flex flex-col justify-between shadow-xs transition-all hover:shadow-md group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-subtle text-brand-strong flex items-center justify-center">
                <Inbox className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-brand-strong uppercase tracking-wider">
                  운영팀
                </span>
                <h2 className="text-xl font-bold text-ink mt-1">지금 필요한 확인부터</h2>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  도착 확인 요청과 인원 변동을 살펴보고, 필요한 조치를 이어가세요.
                </p>
              </div>

              <div className="pt-2 border-t border-border-subtle space-y-2 text-xs text-muted">
                <div className="flex items-center gap-2">
                  <Inbox className="w-3.5 h-3.5 text-muted" />
                  <span>확인이 필요한 요청 모아보기</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-muted" />
                  <span>처리 이유와 변경 이력</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-muted" />
                  <span>대타 후보에게 제안 보내기</span>
                </div>
              </div>
            </div>

            <Link
              href="/ops"
              className="mt-6 w-full h-11 bg-brand group-hover:bg-brand-hover text-inverse font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>작업함 보기</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Engineering Non-Negotiables Grid */}
      <section className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-ink text-inverse rounded-2xl p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-brand-inverse tracking-wider uppercase">
              함께하는 방식
            </span>
            <h3 className="text-xl sm:text-2xl font-bold">행사 운영에 필요한 여섯 가지</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-inverse-muted">
            <div className="p-4 bg-ink/80 rounded-xl border border-border-strong space-y-1.5">
              <div className="font-bold text-inverse flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-inverse" />
                <span>명확한 업무 안내</span>
              </div>
              <p className="text-inverse-muted leading-relaxed">
                맡을 일과 보수, 준비 사항을 계약에서 확인해요.
              </p>
            </div>

            <div className="p-4 bg-ink/80 rounded-xl border border-border-strong space-y-1.5">
              <div className="font-bold text-inverse flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-brand-inverse" />
                <span>한눈에 보는 정산</span>
              </div>
              <p className="text-inverse-muted leading-relaxed">
                보수와 비용, 공제 금액을 나눠 확인해요.
              </p>
            </div>

            <div className="p-4 bg-ink/80 rounded-xl border border-border-strong space-y-1.5">
              <div className="font-bold text-inverse flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-brand-inverse" />
                <span>필요한 정보만 공유</span>
              </div>
              <p className="text-inverse-muted leading-relaxed">
                현장 운영에 필요한 정보는 보여주고, 개인 정보는 접근 범위를 구분해요.
              </p>
            </div>

            <div className="p-4 bg-ink/80 rounded-xl border border-border-strong space-y-1.5">
              <div className="font-bold text-inverse flex items-center gap-1.5">
                <Database className="w-4 h-4 text-brand-inverse" />
                <span>배정 일정 확인</span>
              </div>
              <p className="text-inverse-muted leading-relaxed">
                함께할 현장과 시간, 인원 변동을 확인해요.
              </p>
            </div>

            <div className="p-4 bg-ink/80 rounded-xl border border-border-strong space-y-1.5">
              <div className="font-bold text-inverse flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-inverse" />
                <span>처리 결과를 분명하게</span>
              </div>
              <p className="text-inverse-muted leading-relaxed">
                출발·도착·서명 요청의 처리 상태를 확인해요.
              </p>
            </div>

            <div className="p-4 bg-ink/80 rounded-xl border border-border-strong space-y-1.5">
              <div className="font-bold text-inverse flex items-center gap-1.5">
                <Users className="w-4 h-4 text-brand-inverse" />
                <span>현장에서 편하게</span>
              </div>
              <p className="text-inverse-muted leading-relaxed">
                모바일에 맞는 화면과 알아보기 쉬운 상태 안내를 준비해요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-8 text-center text-xs text-muted border-t border-border mt-8">
        © {year} CrewLink. 행사와 크루를 잇다.
      </footer>
    </div>
  );
}
