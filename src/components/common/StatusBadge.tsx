'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, Navigation, CheckCircle2, AlertCircle, FileCheck, Ban } from 'lucide-react';

export type CrewLinkStatus =
  | 'NEED_CONFIRMATION'   // 참여 확인 필요
  | 'DEPARTED'            // 출발했어요
  | 'ARRIVED_CONFIRMED'   // 도착 확인 완료
  | 'OPS_REVIEW'          // 운영자 확인 중
  | 'CONTRACT_PENDING'    // 전자서약 필요
  | 'ASSIGNMENT_CANCELLED'// 배정 취소됨
  | 'SETTLED';            // 정산 완료

export interface StatusBadgeProps {
  status: CrewLinkStatus;
  customLabel?: string;
  className?: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<
  CrewLinkStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    styleClasses: string;
  }
> = {
  NEED_CONFIRMATION: {
    label: '참여 확인 필요',
    icon: Clock,
    styleClasses: 'bg-[#FFF3D9] text-[#895400] border-[#FDE19E]',
  },
  DEPARTED: {
    label: '출발했어요',
    icon: Navigation,
    styleClasses: 'bg-[#EDF3FF] text-[#194DA8] border-[#C7DCFE]',
  },
  ARRIVED_CONFIRMED: {
    label: '도착 확인 완료',
    icon: CheckCircle2,
    styleClasses: 'bg-[#E7F5EE] text-[#08734E] border-[#B6E6CE]',
  },
  OPS_REVIEW: {
    label: '운영자 확인 중',
    icon: AlertCircle,
    styleClasses: 'bg-[#FFF3D9] text-[#895400] border-[#FDE19E]',
  },
  CONTRACT_PENDING: {
    label: '전자서약 필요',
    icon: FileCheck,
    styleClasses: 'bg-[#EDF1F6] text-[#526174] border-[#D5DCE5]',
  },
  ASSIGNMENT_CANCELLED: {
    label: '배정 취소됨',
    icon: Ban,
    styleClasses: 'bg-[#FFF0F3] text-[#BB2449] border-[#FDC4D0]',
  },
  SETTLED: {
    label: '정산 완료',
    icon: CheckCircle2,
    styleClasses: 'bg-[#E7F5EE] text-[#08734E] border-[#B6E6CE]',
  },
};

export function StatusBadge({
  status,
  customLabel,
  className,
  size = 'md',
}: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.NEED_CONFIRMATION;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-full transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        config.styleClasses,
        className
      )}
      role="status"
      aria-label={`상태: ${customLabel || config.label}`}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5 shrink-0' : 'w-4 h-4 shrink-0'} aria-hidden="true" />
      <span>{customLabel || config.label}</span>
    </span>
  );
}
