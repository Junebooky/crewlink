'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/common/AppShell';
import { StatusBadge, CrewLinkStatus } from '@/components/common/StatusBadge';
import {
  Users,
  CheckCircle2,
  Navigation,
  Clock,
  MapPin,
  Calendar,
  Building,
  PlusCircle,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CrewDeploymentItem {
  id: string;
  maskedName: string;
  positionCode: string;
  positionLabel: string;
  uniformSize: string;
  status: CrewLinkStatus;
  updatedAt: string;
}

export default function ClientLiveBoardPage() {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Deployment crew members with masked private info
  const deployments: CrewDeploymentItem[] = [
    {
      id: 'dep-1',
      maskedName: '김*수',
      positionCode: 'POS-01',
      positionLabel: '동선 관리 · 1구역 (D홀 입구)',
      uniformSize: 'L (100)',
      status: 'ARRIVED_CONFIRMED',
      updatedAt: '12:28',
    },
    {
      id: 'dep-2',
      maskedName: '이*민',
      positionCode: 'POS-02',
      positionLabel: '동선 관리 · 2구역 (중앙 로비)',
      uniformSize: 'M (95)',
      status: 'ARRIVED_CONFIRMED',
      updatedAt: '12:25',
    },
    {
      id: 'dep-3',
      maskedName: '박*호',
      positionCode: 'POS-03',
      positionLabel: 'VIP 라운지 · 리셉션',
      uniformSize: 'XL (105)',
      status: 'ARRIVED_CONFIRMED',
      updatedAt: '12:15',
    },
    {
      id: 'dep-4',
      maskedName: '정*아',
      positionCode: 'POS-04',
      positionLabel: 'VIP 라운지 · 케이터링',
      uniformSize: 'S (90)',
      status: 'ARRIVED_CONFIRMED',
      updatedAt: '12:20',
    },
    {
      id: 'dep-5',
      maskedName: '최*우',
      positionCode: 'POS-05',
      positionLabel: '등록 데스크 · 현장 발권',
      uniformSize: 'L (100)',
      status: 'ARRIVED_CONFIRMED',
      updatedAt: '12:29',
    },
    {
      id: 'dep-6',
      maskedName: '강*현',
      positionCode: 'POS-06',
      positionLabel: '등록 데스크 · 사전 등록',
      uniformSize: 'M (95)',
      status: 'ARRIVED_CONFIRMED',
      updatedAt: '12:22',
    },
    {
      id: 'dep-7',
      maskedName: '윤*영',
      positionCode: 'POS-07',
      positionLabel: '체험 부스 · 인솔',
      uniformSize: 'M (95)',
      status: 'DEPARTED',
      updatedAt: '12:10 출발',
    },
    {
      id: 'dep-8',
      maskedName: '한*진',
      positionCode: 'POS-08',
      positionLabel: '무대 · 대기열 관리',
      uniformSize: 'XL (105)',
      status: 'NEED_CONFIRMATION',
      updatedAt: '확인 대기',
    },
  ];

  const totalCount = deployments.length;
  const arrivedCount = deployments.filter((d) => d.status === 'ARRIVED_CONFIRMED').length;
  const departedCount = deployments.filter((d) => d.status === 'DEPARTED').length;
  const attentionCount = deployments.filter((d) => d.status === 'NEED_CONFIRMATION').length;

  const filteredDeployments = deployments.filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.status === filterStatus;
  });

  return (
    <AppShell initialRole="client">
      <div className="max-w-5xl mx-auto px-4 py-6 w-full space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand bg-brand-subtle px-2 py-0.5 rounded-full">
                현장 현황
              </span>
              <span className="text-xs text-brand-strong font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-brand animate-ping inline-block" />
                샘플 화면
              </span>
            </div>
            <h1 className="text-2xl font-bold text-ink mt-1">서울 모빌리티 엑스포</h1>
            <p className="text-xs text-muted mt-0.5">
              코엑스 3층 D홀 · 집합 12:30 · 시작 13:00 · 배정 {totalCount}명
            </p>
          </div>

          <Link
            href="/client/request"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-inverse text-sm font-bold rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>새 행사 요청</span>
          </Link>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-surface border border-border rounded-xl shadow-xs">
            <div className="text-xs text-muted font-medium">함께할 크루</div>
            <div className="text-2xl font-black text-ink mt-1 tabular-nums">{totalCount}명</div>
            <div className="text-[11px] text-muted mt-1">배정 현황</div>
          </div>

          <div className="p-4 bg-surface border border-brand-border rounded-xl shadow-xs">
            <div className="text-xs text-brand-strong font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              도착 확인
            </div>
            <div className="text-2xl font-black text-brand-strong mt-1 tabular-nums">{arrivedCount}명</div>
            <div className="text-[11px] text-brand-strong mt-1">출근 확인을 마쳤어요</div>
          </div>

          <div className="p-4 bg-surface border border-brand-border rounded-xl shadow-xs">
            <div className="text-xs text-brand-strong font-medium flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              이동 중
            </div>
            <div className="text-2xl font-black text-brand-strong mt-1 tabular-nums">{departedCount}명</div>
            <div className="text-[11px] text-brand-strong mt-1">출발을 알려왔어요</div>
          </div>

          <div className="p-4 bg-surface border border-neutral-border rounded-xl shadow-xs">
            <div className="text-xs text-muted font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              확인 필요
            </div>
            <div className="text-2xl font-black text-muted mt-1 tabular-nums">{attentionCount}명</div>
            <div className="text-[11px] text-muted mt-1">출발 여부를 확인해 주세요</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { key: 'ALL', label: `전체 ${totalCount}` },
            { key: 'ARRIVED_CONFIRMED', label: `도착 ${arrivedCount}` },
            { key: 'DEPARTED', label: `이동 중 ${departedCount}` },
            { key: 'NEED_CONFIRMATION', label: `확인 필요 ${attentionCount}` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterStatus(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium shrink-0 transition-colors',
                filterStatus === tab.key
                  ? 'bg-brand-soft text-brand-strong font-bold'
                  : 'bg-surface border border-border text-muted hover:bg-canvas'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Crew Deployment Cards (Masked Private Info) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredDeployments.map((crew) => (
            <div
              key={crew.id}
              className="p-4 bg-surface border border-border rounded-xl hover:border-border transition-colors shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-muted bg-surface-muted px-2 py-0.5 rounded">
                    {crew.positionCode}
                  </span>
                  <StatusBadge status={crew.status} size="sm" />
                </div>

                <div className="flex items-baseline gap-2">
                  <h3 className="font-bold text-ink text-base">{crew.maskedName}</h3>
                  <span className="text-xs text-muted">유니폼 {crew.uniformSize}</span>
                </div>

                <p className="text-xs text-muted font-medium mt-1.5">{crew.positionLabel}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] text-muted">
                <span>최근 업데이트: {crew.updatedAt}</span>
                <span className="font-medium text-brand-strong">계약 확인</span>
              </div>
            </div>
          ))}
        </div>

        {/* Privacy Note */}
        <div className="p-4 bg-canvas border border-border rounded-xl flex items-start gap-2.5 text-xs text-muted">
          <ShieldCheck className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <span>
            <strong>공유되는 정보:</strong> 현장 운영에 필요한 배치 구역, 유니폼 사이즈, 출결 상태만 보여드려요. 크루 이름은 일부 가리고, 연락처와 계좌 정보는 공개하지 않아요.
          </span>
        </div>
      </div>
    </AppShell>
  );
}
