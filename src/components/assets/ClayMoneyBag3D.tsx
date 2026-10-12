import React from 'react';
import { cn } from '@/lib/utils';

export interface ClayMoneyBag3DProps {
  className?: string;
}

/**
 * 3D 소프트 클레이 돈 보따리 에셋 (ClayMoneyBag3D)
 * - 갈색 톤 보따리 (웜 브라운/카멜/탠 베이지)
 * - 입구/옆면 골드 및 버터 옐로우 금화 코인 디테일
 */
export function ClayMoneyBag3D({ className = 'w-10 h-10' }: ClayMoneyBag3DProps) {
  return (
    <div className={cn('relative shrink-0 flex items-center justify-center select-none', className)}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <filter id="clayPouchShadow" x="-20%" y="-20%" width="140%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" />
            <feOffset dx="0" dy="3.5" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.18" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 보따리 몸통: 따뜻하고 부드러운 클레이 질감의 웜 브라운/카멜/탠 베이지 라디얼 그라디언트 */}
          <radialGradient id="pouchBodyGrad" cx="34%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#CA8A04" />
            <stop offset="35%" stopColor="#A16207" />
            <stop offset="80%" stopColor="#854D0E" />
            <stop offset="100%" stopColor="#593006" />
          </radialGradient>

          {/* 보따리 입구/묶음 부분 그라디언트 */}
          <linearGradient id="pouchNeckGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CA8A04" />
            <stop offset="50%" stopColor="#A16207" />
            <stop offset="100%" stopColor="#713F12" />
          </linearGradient>

          {/* 매듭 끈 골드 로프 그라디언트 */}
          <linearGradient id="tieRopeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="40%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>

          {/* 금화 윗면 버터 옐로우/골드 그라디언트 */}
          <linearGradient id="goldCoinTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEF9C3" />
            <stop offset="50%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>

          {/* 금화 측면 두께 그라디언트 */}
          <linearGradient id="goldCoinSide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>
        </defs>

        {/* 바닥 소프트 섀도우 */}
        <ellipse cx="32" cy="57" rx="21" ry="4" fill="#3E2005" opacity="0.16" filter="blur(2px)" />

        {/* 1. 보따리 몸통 (따뜻하고 통통한 Burlap/Leather Pouch) */}
        <path
          d="M32 23 C22 23 13 28 12 39 C11 48 18 56 32 56 C46 56 53 48 52 39 C51 28 42 23 32 23 Z"
          fill="url(#pouchBodyGrad)"
          filter="url(#clayPouchShadow)"
        />

        {/* 좌상단 스페큘러 하이라이트 (매끄러운 3D 볼륨감) */}
        <path
          d="M20 28 C15 32 14.5 38 15.5 44"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* 2. 보따리 입구/묶음 주름 (Frill Neck) */}
        <path
          d="M23 23 C20 18 21.5 13.5 26 12 C29 14.5 31 15.5 32 15.5 C33 15.5 35 14.5 38 12 C42.5 13.5 44 18 41 23 Z"
          fill="url(#pouchNeckGrad)"
        />
        {/* 주름 하이라이트 */}
        <path
          d="M25 14.5 C28 16.5 30 17.5 32 17.5 C34 17.5 36 16.5 39 14.5"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* 3. 단정하게 조여진 매듭 끈과 둥근 볼륨감 */}
        <ellipse cx="32" cy="23.5" rx="9" ry="3.2" fill="#451A03" opacity="0.55" />
        <path
          d="M23 23.5 C26.5 25 37.5 25 41 23.5"
          stroke="url(#tieRopeGrad)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* 중앙 매듭 볼 & 늘어진 리본 끈 */}
        <circle cx="32" cy="25" r="2.8" fill="url(#tieRopeGrad)" />
        <path
          d="M31.5 26 C30 28.5 27.5 30.5 28.5 33"
          stroke="url(#tieRopeGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="28.5" cy="33.5" r="1.5" fill="#EAB308" />
        <path
          d="M32.5 26 C34 28.5 36.5 30 36 32.5"
          stroke="url(#tieRopeGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="36" cy="33" r="1.5" fill="#EAB308" />

        {/* 4. 입구 주변에 삐져나온 통통한 골드 코인(금화) 1개 */}
        <g transform="translate(35, 13) rotate(18)">
          <rect x="0" y="1.5" width="10" height="4" rx="2" fill="url(#goldCoinSide)" />
          <ellipse cx="5" cy="2" rx="5" ry="1.8" fill="url(#goldCoinTop)" />
          <ellipse cx="5" cy="2" rx="3.5" ry="1.1" stroke="rgba(202, 138, 4, 0.4)" strokeWidth="0.6" />
        </g>

        {/* 5. 보따리 옆면에 쌓여 있는 통통한 3D 골드 코인(금화) 2개 */}
        <g transform="translate(39, 44) rotate(-14)">
          <rect x="0" y="2" width="16" height="5.5" rx="2.8" fill="url(#goldCoinSide)" />
          <ellipse cx="8" cy="2.5" rx="8" ry="2.7" fill="url(#goldCoinTop)" />
          <ellipse cx="8" cy="2.5" rx="5.5" ry="1.7" stroke="rgba(202, 138, 4, 0.4)" strokeWidth="0.8" />
        </g>
        <g transform="translate(42, 37) rotate(14)">
          <rect x="0" y="2" width="15" height="5" rx="2.5" fill="url(#goldCoinSide)" />
          <ellipse cx="7.5" cy="2.3" rx="7.5" ry="2.4" fill="url(#goldCoinTop)" />
          <ellipse cx="7.5" cy="2.3" rx="5" ry="1.5" stroke="rgba(202, 138, 4, 0.4)" strokeWidth="0.8" />
          <path d="M4 2 Q7.5 1.3 11 2" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="0.9" strokeLinecap="round" />
        </g>

        {/* 6. 골드 스파클 반짝이 별 */}
        <path
          d="M51 27 Q51 30.5 53.5 30.5 Q51 30.5 51 34 Q51 30.5 48.5 30.5 Q51 30.5 51 27 Z"
          fill="#FACC15"
          filter="drop-shadow(0 1px 2px rgba(250, 204, 21, 0.5))"
        />
      </svg>
    </div>
  );
}

export default ClayMoneyBag3D;
