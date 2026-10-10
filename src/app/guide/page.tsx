'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  FileCheck,
  QrCode,
  DollarSign,
  Briefcase,
  Users,
  ShieldCheck,
  Receipt,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { PublicHeader } from '@/components/common/PublicHeader';
import { MobileBottomNav } from '@/components/common/MobileBottomNav';
import { cn } from '@/lib/utils';

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<'crew' | 'client'>('crew');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) => (prev === idx ? null : idx));
  };

  const crewSteps = [
    {
      step: '01',
      title: '나에게 맞는 현장 탐색',
      desc: '성수, 코엑스, 여의도 등 핫한 팝업스토어와 대형 전시회 공고를 날짜·장소·일당별로 한눈에 확인해요.',
      icon: Compass,
    },
    {
      step: '02',
      title: '간편 지원 및 배정 확정',
      desc: '원하는 일정과 역할을 선택해 지원하면, 주최사의 프로필 검토 후 카카오 알림톡으로 최종 배정 소식을 알려드려요.',
      icon: Users,
    },
    {
      step: '03',
      title: '표준 전자 도급계약 체결',
      desc: '근로기준법 제20조에 따라 위약금 예정이 일체 금지된 표준 SOW 전자 계약서를 모바일로 간편하게 서명해요.',
      icon: FileCheck,
    },
    {
      step: '04',
      title: 'D-Day 다이내믹 QR 출근 인증',
      desc: '시작 2시간 전 출발 알림을 확인하고, 현장에 도착해 1회용 동적 QR 코드를 스캔하면 출근 확인이 즉시 완료돼요.',
      icon: QrCode,
    },
    {
      step: '05',
      title: '투명한 3.3% 원천세 정산',
      desc: '행사 종료 후 거주자 사업소득세(3.3%)가 정확히 원천징수된 실지급액이 본인 명의 계좌로 입금돼요.',
      icon: DollarSign,
    },
  ];

  const clientSteps = [
    {
      step: '01',
      title: '5분 맞춤 행사 요청서 작성',
      desc: '행사 장소, 일정, 필요 크루 인원, 유니폼 복장, 담당 업무(VIP 안내, POS 결제 등)를 입력하고 견적을 산출해요.',
      icon: Briefcase,
    },
    {
      step: '02',
      title: '15% 고정 운영료 견적 확인',
      desc: '가변 수수료 없이 세전 크루 보수 총액의 15% 단일 요율로 산출된 투명한 견적서를 즉시 확인하고 발주해요.',
      icon: Receipt,
    },
    {
      step: '03',
      title: '크루 프로필 & 비주얼 컨펌',
      desc: '선발된 크루들의 유니폼 핏, 이전 팝업스토어 평점, 근태 이력을 사전에 확인하고 최종 배정을 확정해요.',
      icon: Users,
    },
    {
      step: '04',
      title: 'D-Day 실시간 라이브 관제',
      desc: '크루들의 출발·도착 현황을 실시간 관제판에서 확인하며, 노쇼나 결원 발생 시 T-30 긴급 대체 크루가 즉시 투입돼요.',
      icon: Clock,
    },
    {
      step: '05',
      title: '전자세금계산서 일원화 종결',
      desc: '크루 개별 원천세 신고 번거로움 없이, 크루링크의 합법적 전자세금계산서 1장으로 세무와 증빙을 종결해요.',
      icon: ShieldCheck,
    },
  ];

  const crewFaqs = [
    {
      q: '정산은 언제, 어떻게 입금되나요?',
      a: '과업이 정상 완료된 후 주최사 출결 승인을 거쳐 익영업일 기준 본인 명의 계좌로 입금됩니다. 사업소득세(소득세 3% + 지방소득세 0.3%)를 원천징수한 실지급액이 입금되며, 크루 정산 메뉴에서 원천징수영수증과 세부 내역을 실시간으로 열람할 수 있습니다.',
    },
    {
      q: '지각이나 피치 못할 사정이 생기면 어떻게 하나요?',
      a: '행사 시작 최소 2시간 전 크루링크 고객센터 또는 운영팀에 즉시 알려주셔야 대체 크루를 파견할 수 있습니다. 크루링크는 근로기준법 제20조에 따라 사전에 정한 위약금이나 벌금을 보수에서 일체 공제하지 않지만, 무단 노쇼의 경우 추후 플랫폼 배정이 제한될 수 있습니다.',
    },
    {
      q: '현장에서 QR 코드가 잘 안 찍히면 어떻게 하나요?',
      a: '조명 반사나 카메라 문제로 QR 스캔이 어려운 경우, 앱 내 [대면 확인 요청] 버튼을 누르면 현장 총괄 매니저가 직접 얼굴과 명찰을 대조하여 출결을 승인해 드립니다.',
    },
  ];

  const clientFaqs = [
    {
      q: '15% 운영 수수료에는 어떤 서비스가 포함되나요?',
      a: '크루 모집 및 프로필 선별, 사전 업무 교육 안내, 노무 도급계약 체결, 행사 당일 실시간 GPS 출근 관제, 무단 결원 발생 시 T-30 긴급 대체 인력 지원, 전자세금계산서 통합 발행이 모두 포함되어 있습니다.',
    },
    {
      q: '갑자기 일정이 취소되거나 크루 인원을 변경해야 하면 어떻게 되나요?',
      a: '행사 시작 48시간 전까지는 위약금 없이 일정 및 인원 변경이 가능합니다. 계약 변경 발생 시 공급가액 조정에 맞춰 합법적인 수정세금계산서가 발행됩니다.',
    },
    {
      q: '전자세금계산서는 언제 발행되나요?',
      a: '행사 요청 승인 및 결제 완료 시 청구/영수 전자세금계산서가 지정하신 이메일과 국세청으로 즉시 자동 전송됩니다.',
    },
  ];

  const activeSteps = activeTab === 'crew' ? crewSteps : clientSteps;
  const activeFaqs = activeTab === 'crew' ? crewFaqs : clientFaqs;

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col pb-20 md:pb-12">
      {/* 1. Header */}
      <PublicHeader />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <section className="bg-surface border-b border-border py-12 sm:py-16 px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold text-brand uppercase tracking-wider bg-brand-soft px-3 py-1 rounded-full border border-brand-border inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span>크루링크 서비스 가이드</span>
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight break-keep">
              지원부터 정산까지, 투명하고 안전하게
            </h1>
            <p className="text-xs sm:text-sm text-muted max-w-xl mx-auto break-keep">
              크루와 주최사 모두가 신뢰할 수 있는 표준 계약과 실시간 출결 시스템의 동작 방식을 안내해 드려요.
            </p>

            {/* Tab Switcher */}
            <div className="pt-4 flex justify-center">
              <div className="bg-canvas border border-border p-1 rounded-2xl flex max-w-xs w-full shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('crew')}
                  className={cn(
                    'flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer',
                    activeTab === 'crew'
                      ? 'bg-brand text-inverse shadow-xs'
                      : 'text-muted hover:text-ink'
                  )}
                >
                  크루 (스태프)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('client')}
                  className={cn(
                    'flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer',
                    activeTab === 'client'
                      ? 'bg-brand text-inverse shadow-xs'
                      : 'text-muted hover:text-ink'
                  )}
                >
                  주최사 (기업)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Steps Workflow Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-ink">
              {activeTab === 'crew' ? '크루 활동 5단계 흐름' : '주최사 발주 5단계 흐름'}
            </h2>
            <p className="text-xs text-muted">
              {activeTab === 'crew'
                ? '공고 확인부터 계좌 입금까지 정해진 절차대로 투명하게 진행돼요.'
                : '행사 요청부터 사후 세무 증빙까지 크루링크가 원스톱으로 책임져요.'}
            </p>
          </div>

          <div className="space-y-4">
            {activeSteps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-5 sm:p-6 rounded-3xl bg-surface border border-border flex items-start gap-4 shadow-2xs hover:border-brand-border transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand-strong flex items-center justify-center font-black shrink-0">
                    <Icon className="w-6 h-6 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-brand tracking-wider">
                        STEP {item.step}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-ink">{item.title}</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-muted leading-relaxed break-keep">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action CTA Box */}
          <div className="p-6 sm:p-8 rounded-3xl bg-brand-subtle border border-brand-border text-center space-y-4 shadow-xs">
            <h3 className="text-base sm:text-lg font-bold text-ink">
              {activeTab === 'crew' ? '지금 바로 나와 맞는 현장을 찾아보세요!' : '지금 바로 필요한 크루를 요청해 보세요!'}
            </h3>
            <p className="text-xs text-muted max-w-md mx-auto break-keep">
              {activeTab === 'crew'
                ? '합리적인 일당과 투명한 계약으로 보호받으며 일할 수 있는 현장들이 기다리고 있어요.'
                : '15% 고정 운영료로 검증된 크루와 출근 관제 시스템을 즉시 경험하세요.'}
            </p>
            <div className="pt-2">
              {activeTab === 'crew' ? (
                <Link
                  href="/"
                  className="inline-flex min-h-[48px] px-6 rounded-2xl bg-brand hover:bg-brand-hover text-inverse text-xs sm:text-sm font-bold items-center gap-2 transition-colors shadow-xs"
                >
                  <span>지금 모집 중인 현장 찾기</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href="/client/request"
                  className="inline-flex min-h-[48px] px-6 rounded-2xl bg-brand hover:bg-brand-hover text-inverse text-xs sm:text-sm font-bold items-center gap-2 transition-colors shadow-xs"
                >
                  <span>행사 견적 산출하고 크루 요청하기</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* 4. Frequently Asked Questions (FAQ) */}
        <section className="bg-surface border-t border-border py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-1.5">
              <span className="text-xs font-bold text-brand uppercase tracking-wider">
                FAQ
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-ink">
                자주 묻는 질문
              </h2>
            </div>

            <div className="divide-y divide-border-subtle border-y border-border-subtle">
              {activeFaqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="py-4">
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between gap-4 text-left font-bold text-xs sm:text-sm text-ink hover:text-brand transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-brand shrink-0" />
                        <span>{faq.q}</span>
                      </span>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-muted transition-transform duration-200 shrink-0',
                          isOpen && 'rotate-180 text-brand'
                        )}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed pl-6 break-keep animate-in fade-in duration-150">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-4 sm:px-6 py-6 text-xs text-muted">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 CrewLink. 현장 행사와 크루를 잇다.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/" className="hover:text-ink transition-colors">
              현장 찾기 (크루)
            </Link>
            <span className="text-border">|</span>
            <Link
              href="/biz"
              className="text-muted hover:text-brand font-medium transition-colors"
            >
              주최사 센터
            </Link>
          </div>
        </div>
      </footer>

      {/* Mobile Nav */}
      <MobileBottomNav />
    </div>
  );
}
