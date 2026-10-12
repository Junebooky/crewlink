import React from 'react';
import { cn } from '@/lib/utils';

export interface ClayCoinStack3DProps {
  className?: string;
}

/**
 * 하루 보수 3D 소프트 클레이 코인 뭉치 에셋 (ClayCoinStack3D)
 */
export function ClayCoinStack3D({ className = 'w-5 h-5' }: ClayCoinStack3DProps) {
  return (
    <div className={cn('relative shrink-0 inline-flex items-center justify-center select-none', className)}>
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xs overflow-visible"
        aria-hidden="true"
      >
        <defs>
          {/* 부드러운 코인 윗면 그라디언트 */}
          <linearGradient id="coinFaceGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF9C3" />
            <stop offset="50%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>

          {/* 코인 옆면 두께 그라디언트 */}
          <linearGradient id="coinSideGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="40%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>

          {/* 앞쪽에 살짝 얹힌 코인 그라디언트 */}
          <linearGradient id="coinFrontGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="55%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* 바닥 소프트 그림자 */}
        <ellipse cx="18" cy="32" rx="13" ry="2.8" fill="#78350F" opacity="0.16" filter="blur(1.2px)" />

        {/* 1. 하단 코인 */}
        <g transform="translate(5, 20.5)">
          <rect x="0" y="2.2" width="24" height="6.5" rx="3.2" fill="url(#coinSideGrad)" />
          <ellipse cx="12" cy="2.8" rx="12" ry="3.4" fill="url(#coinFaceGrad)" />
          <ellipse cx="12" cy="2.8" rx="9" ry="2.3" stroke="rgba(202, 138, 4, 0.35)" strokeWidth="0.7" />
        </g>

        {/* 2. 중간 코인 */}
        <g transform="translate(6, 14.5)">
          <rect x="0" y="2.2" width="23" height="6" rx="3" fill="url(#coinSideGrad)" />
          <ellipse cx="11.5" cy="2.6" rx="11.5" ry="3.2" fill="url(#coinFaceGrad)" />
          <ellipse cx="11.5" cy="2.6" rx="8.5" ry="2.1" stroke="rgba(202, 138, 4, 0.35)" strokeWidth="0.7" />
        </g>

        {/* 3. 상단 코인 */}
        <g transform="translate(6.5, 8.5)">
          <rect x="0" y="2.2" width="22" height="5.8" rx="2.9" fill="url(#coinSideGrad)" />
          <ellipse cx="11" cy="2.5" rx="11" ry="3" fill="url(#coinFaceGrad)" />
          <ellipse cx="11" cy="2.5" rx="8" ry="2" stroke="rgba(202, 138, 4, 0.4)" strokeWidth="0.7" />
          {/* 상단 스페큘러 광택 라인 */}
          <path d="M5.5 2.2 Q11 1.2 16.5 2.2" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="0.9" strokeLinecap="round" />
        </g>

        {/* 4. 앞쪽에 비스듬히 겹쳐진 코인 */}
        <g transform="translate(17, 16) rotate(20)">
          <rect x="0" y="1.5" width="13" height="4.5" rx="2.2" fill="url(#coinSideGrad)" />
          <ellipse cx="6.5" cy="1.9" rx="6.5" ry="2" fill="url(#coinFrontGrad)" />
          <ellipse cx="6.5" cy="1.9" rx="4.5" ry="1.3" stroke="rgba(202, 138, 4, 0.4)" strokeWidth="0.6" />
          <path d="M3 1.6 Q6.5 0.9 10 1.6" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="0.7" strokeLinecap="round" />
        </g>

        {/* 5. 3D 반짝이 별 */}
        <path
          d="M28 5 Q28 7.5 29.8 7.5 Q28 7.5 28 10 Q28 7.5 26.2 7.5 Q28 7.5 28 5 Z"
          fill="#FACC15"
          filter="drop-shadow(0 1px 2px rgba(250, 204, 21, 0.6))"
        />
      </svg>
    </div>
  );
}

export default ClayCoinStack3D;
