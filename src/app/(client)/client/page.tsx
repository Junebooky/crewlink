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
      positionLabel: '동선 통제 1구역 (D홀 입구)',
      uniformSize: 'L (100)',
      status: 'ARRIVED_CONFIRMED',
      updatedAt: '12:28',
    },
    {
      id: 'dep-2',
      maskedName: '이*민',
      positionCode: 'POS-02',
      positionLabel: '동선 통제 2구역 (중앙 로비)',
      uniformSize: 'M (95)',
      status: 'ARRIVED_CONFIRMED',
      updatedAt: '12:25',
    },
    {
      id: 'dep-3',
      maskedName: '박*호',
      positionCode: 'POS-03',
      positionLabel: 'VIP 라운지 리셉션',
      uniformSize: 'XL (105)',
      status: 'ARRIVED_CONFIRMED',
      updatedAt: '12:15',
    },
    {
      id: 'dep-4',
      maskedName: '정*아',
      positionCode: 'POS-04',
      positionLabel: 'VIP 라운지 케이터링',
      uniformSize: 'S (90)',
      status: 'ARRIVED_CONFIRMED',
      updatedAt: '12:20',
    },
    {
      id: 'dep-5',
      maskedName: '최*우',
      positionCode: 'POS-05',
      positionLabel: '등록 데스크 1 (현장 발권)',
      uniformSize: 'L (100)',
      status: 'ARRIVED_CONFIRMED',
      updatedAt: '12:29',
    },
    {
      id: 'dep-6',
      maskedName: '강*현',
      positionCode: 'POS-06',
      positionLabel: '등록 데스크 2 (사전 등록자)',
      uniformSize: 'M (95)',
      status: 'ARRIVED_CONFIRMED',
      updatedAt: '12:22',
    },
    {
      id: 'dep-7',
      maskedName: '윤*영',
      positionCode: 'POS-07',
      positionLabel: '체험 부스 인솔 가이드',
      uniformSize: 'M (95)',
      status: 'DEPARTED',
      updatedAt: '12:10 (출발 완료)',
    },
    {
      id: 'dep-8',
      maskedName: '한*진',
      positionCode: 'POS-08',
      positionLabel: '무대 대기열 통제',
      uniformSize: 'XL (105)',
      status: 'NEED_CONFIRMATION',
      updatedAt: '확인 대기 중',
    },
  ];

  const totalCount = deployments.length;
  const arrivedCount = deployments.filter((d) => d.status === 'ARRIVED_CONFIRMED').length;
  const departedCount = deployments.filter((d) => d.status === 'DEPARTED').length;
  const attentionCount = deployments.filter((d) => d.status === 'NEED_CONFIRMATION').length;

  const filteredDeployments = deployments.filter((d) => {
    if (filterStatus === 'ALL') return true;
    return d.status === filterStatus;
  });

  return (
    <AppShell initialRole="client">
      <div className="max-w-5xl mx-auto px-4 py-6 w-full space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1E60F3] bg-blue-50 px-2 py-0.5 rounded-full">
                B01 실시간 관제
              </span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                라이브 동기화 가동 중
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">2026 서울 모빌리티 엑스포 현장 관제</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              코엑스 3층 D홀 • 집합 12:30 • 시작 13:00 (총 {totalCount}명 배정)
            </p>
          </div>

          <Link
            href="/client/request"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E60F3] hover:bg-[#164BC4] text-white text-sm font-bold rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>새 운영 요청 등록</span>
          </Link>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="text-xs text-slate-400 font-medium">총 배정 인원</div>
            <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{totalCount}명</div>
            <div className="text-[11px] text-slate-500 mt-1">도급 정원 100% 충원</div>
          </div>

          <div className="p-4 bg-white border border-emerald-200 rounded-xl shadow-xs">
            <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              도착 확인 완료
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">{arrivedCount}명</div>
            <div className="text-[11px] text-emerald-600 mt-1">현장 QR 인증 완료</div>
          </div>

          <div className="p-4 bg-white border border-blue-200 rounded-xl shadow-xs">
            <div className="text-xs text-blue-700 font-medium flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              출발 이동 중
            </div>
            <div className="text-2xl font-black text-blue-700 mt-1 tabular-nums">{departedCount}명</div>
            <div className="text-[11px] text-blue-600 mt-1">현장 이동 확인</div>
          </div>

          <div className="p-4 bg-white border border-amber-200 rounded-xl shadow-xs">
            <div className="text-xs text-amber-700 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              출발 확인 필요
            </div>
            <div className="text-2xl font-black text-amber-700 mt-1 tabular-nums">{attentionCount}명</div>
            <div className="text-[11px] text-amber-600 mt-1">T-30 자동 결원 모니터링</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { key: 'ALL', label: `전체 (${totalCount})` },
            { key: 'ARRIVED_CONFIRMED', label: `도착 확인 완료 (${arrivedCount})` },
            { key: 'DEPARTED', label: `출발했어요 (${departedCount})` },
            { key: 'NEED_CONFIRMATION', label: `확인 필요 (${attentionCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterStatus(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium shrink-0 transition-colors',
                filterStatus === tab.key
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
              className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {crew.positionCode}
                  </span>
                  <StatusBadge status={crew.status} size="sm" />
                </div>

                <div className="flex items-baseline gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{crew.maskedName}</h3>
                  <span className="text-xs text-slate-400">유니폼: {crew.uniformSize}</span>
                </div>

                <p className="text-xs text-slate-600 font-medium mt-1.5">{crew.positionLabel}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>상태 갱신: {crew.updatedAt}</span>
                <span className="font-medium text-emerald-600">SOW 계약 체결됨</span>
              </div>
            </div>
          ))}
        </div>

        {/* Privacy Note */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-[#1E60F3] shrink-0 mt-0.5" />
          <span>
            <strong>개인정보 보호 가이드라인:</strong> 고객사에는 현장 배치 관리에 필수적인 정보(마스킹 성명,
            배치 구역, 유니폼 사이즈, 출결 상태)만 실시간 제공되며, 크루의 사적 연락처 및 계좌번호는 엄격히 격리 보호됩니다.
          </span>
        </div>
      </div>
    </AppShell>
  );
}
