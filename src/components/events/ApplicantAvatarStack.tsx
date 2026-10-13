'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ApplicantAvatar {
  avatarUrl?: string | null;
  isDemo?: boolean;
}

export interface ApplicantAvatarStackProps {
  applicantCount?: number;
  newApplicantCount24h?: number;
  avatars?: ApplicantAvatar[];
  overflowCount?: number;
  isDemo?: boolean;
  className?: string;
  showDemoBadge?: boolean;
}

export function ApplicantAvatarStack({
  applicantCount = 0,
  newApplicantCount24h = 0,
  avatars = [],
  overflowCount = 0,
  isDemo = false,
  className,
  showDemoBadge = true,
}: ApplicantAvatarStackProps) {
  const [failedIndices, setFailedIndices] = useState<Record<number, boolean>>({});

  const count = Number(applicantCount) || 0;
  const recentCount = Number(newApplicantCount24h) || 0;
  const displayAvatars = avatars.slice(0, 3);
  const effectiveOverflow = overflowCount > 0 ? overflowCount : Math.max(0, count - displayAvatars.length);

  // If 0 applicants
  if (count <= 0) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-slate-400 py-0.5 min-h-[28px]', className)}>
        <span className="text-slate-400 font-medium tracking-tight">첫 지원을 기다려요</span>
        {isDemo && showDemoBadge && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md shrink-0">
            테스트 공고
          </span>
        )}
      </div>
    );
  }

  // Microcopy determination
  const labelText =
    recentCount > 0
      ? `최근 하루 ${recentCount}명 지원`
      : `지원 크루 ${count}명`;

  return (
    <div
      role="status"
      className={cn(
        'flex items-center justify-between gap-2 py-0.5 min-h-[28px] transition-opacity duration-200',
        className
      )}
    >
      <span className="sr-only">{labelText}</span>
      <div className="flex items-center gap-2 min-w-0" aria-hidden="true">
        {/* Avatars Row (aria-hidden for screen readers) */}
        {displayAvatars.length > 0 && (
          <div className="flex items-center shrink-0">
            {displayAvatars.map((av, idx) => {
              const hasFailed = !!failedIndices[idx];
              const validUrl = av.avatarUrl && !hasFailed;

              return (
                <div
                  key={`avatar-${idx}`}
                  className={cn(
                    'relative w-6 h-6 sm:w-7 sm:h-7 rounded-full ring-2 ring-white bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center',
                    idx > 0 && '-ml-1.5 sm:-ml-2'
                  )}
                >
                  {validUrl ? (
                    <Image
                      src={av.avatarUrl!}
                      alt=""
                      fill
                      unoptimized
                      sizes="28px"
                      className="object-cover"
                      onError={() => {
                        setFailedIndices((prev) => ({ ...prev, [idx]: true }));
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-brand-soft text-brand-strong flex items-center justify-center">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Overflow Pill */}
            {effectiveOverflow > 0 && (
              <div
                className={cn(
                  'w-6 h-6 sm:w-7 sm:h-7 rounded-full ring-2 ring-white bg-slate-100 text-[10px] sm:text-[11px] font-bold text-slate-600 flex items-center justify-center -ml-1.5 sm:-ml-2 shrink-0 tabular-nums'
                )}
              >
                +{effectiveOverflow}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Activity Microcopy */}
        <span
          className={cn(
            'text-xs font-semibold tabular-nums truncate',
            recentCount > 0 ? 'text-brand font-bold' : 'text-slate-600'
          )}
        >
          {labelText}
        </span>
      </div>

      {/* Quiet Demo Badge */}
      {isDemo && showDemoBadge && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md shrink-0">
          테스트 공고
        </span>
      )}
    </div>
  );
}
