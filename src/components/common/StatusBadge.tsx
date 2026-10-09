'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, Navigation, CheckCircle2, AlertCircle, FileCheck, Ban } from 'lucide-react';

export type CrewLinkStatus =
  | 'NEED_CONFIRMATION'   // 참여 확인 필요
  | 'DEPARTED'            // 출발했어요
  | 'ARRIVED_CONFIRMED'   // 도착 확인
  | 'OPS_REVIEW'          // 확인 대기
  | 'CONTRACT_PENDING'    // 서명 필요
  | 'ASSIGNMENT_CANCELLED'// 배정 취소
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
    styleClasses: 'bg-surface-muted text-muted border-neutral-border',
  },
  DEPARTED: {
    label: '출발했어요',
    icon: Navigation,
    styleClasses: 'bg-brand-subtle text-brand-strong border-brand-border',
  },
  ARRIVED_CONFIRMED: {
    label: '도착 확인',
    icon: CheckCircle2,
    styleClasses: 'bg-brand-soft text-brand-strong border-brand-border',
  },
  OPS_REVIEW: {
    label: '확인 대기',
    icon: AlertCircle,
    styleClasses: 'bg-surface-muted text-muted border-neutral-border',
  },
  CONTRACT_PENDING: {
    label: '서명 필요',
    icon: FileCheck,
    styleClasses: 'bg-surface-muted text-muted border-neutral-border',
  },
  ASSIGNMENT_CANCELLED: {
    label: '배정 취소',
    icon: Ban,
    styleClasses: 'bg-surface-muted text-muted border-neutral-border',
  },
  SETTLED: {
    label: '정산 완료',
    icon: CheckCircle2,
    styleClasses: 'bg-brand-soft text-brand-strong border-brand-border',
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
