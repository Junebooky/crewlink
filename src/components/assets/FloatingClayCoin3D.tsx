import React from 'react';
import { cn } from '@/lib/utils';

export interface FloatingClayCoin3DProps {
  className?: string;
}

/**
 * 오픈형 3D 소프트 클레이 코인 에셋 (FloatingClayCoin3D)
 * - 박스/테두리 없이 투명 배경 위에서 입체적으로 부유하는 단일 코인
 * - 통통한 볼륨감의 골드/옐로우 그라디언트 + 상단 림 스페큘러 하이라이트 + 엠보싱 원화(₩) 기호
 */
export function FloatingClayCoin3D({ className = 'w-6 h-6' }: FloatingClayCoin3DProps) {
  return (
    <div
      className={cn(
        'relative shrink-0 inline-flex items-center justify-center select-none overflow-visible',
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs overflow-visible"
      >
        <defs>
          <filter id="clayCoinDropShadow" x="-30%" y="-30%" width="160%" height="170%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.8" />
            <feOffset dx="0" dy="2.2" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.18" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 코인 윗면: 통통하고 부드러운 클레이 질감의 옐로우/골드 라디얼 그라디언트 */}
          <radialGradient id="floatingCoinFace" cx="32%" cy="28%" r="68%">
            <stop offset="0%" stopColor="#FEF9C3" />
            <stop offset="35%" stopColor="#FEF08A" />
            <stop offset="70%" stopColor="#FACC15" />
            <stop offset="92%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </radialGradient>

          {/* 코인 측면 3D 두께 그라디언트 */}
          <linearGradient id="floatingCoinEdge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#A16207" />
          </linearGradient>

          {/* 엠보싱 원화 기호 그라디언트 */}
          <linearGradient id="floatingWonGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CA8A04" />
            <stop offset="60%" stopColor="#A16207" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>

        {/* 1. 바닥 소프트 부유 그림자 */}
        <ellipse
          cx="20"
          cy="36.5"
          rx="12.5"
          ry="2.8"
          fill="#78350F"
          opacity="0.18"
          filter="blur(1.6px)"
        />

        {/* 2. 코인 측면 베벨 및 두께 (3D 볼륨) */}
        <circle cx="20" cy="19.6" r="14.4" fill="url(#floatingCoinEdge)" />

        {/* 3. 코인 전면 메인 페이스 */}
        <circle
          cx="20"
          cy="18.2"
          r="13.6"
          fill="url(#floatingCoinFace)"
          filter="url(#clayCoinDropShadow)"
        />

        {/* 4. 내부 음각 테두리 라인 */}
        <circle
          cx="20"
          cy="18.2"
          r="11"
          stroke="rgba(202, 138, 4, 0.35)"
          strokeWidth="0.8"
        />

        {/* 5. 상단 림 매끄러운 화이트 하이라이트 (스페큘러 광택) */}
        <path
          d="M10.5 13.5 Q20 8.5 29.5 13.5"
          stroke="rgba(255, 255, 255, 0.9)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M13.5 15.2 Q20 11.2 26.5 15.2"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="0.8"
          strokeLinecap="round"
        />

        {/* 6. 중앙 엠보싱 원화(₩) 기호 */}
        {/* 원화 심볼 그림자 (깊이감) */}
        <path
          d="M14.2 14 L17.4 23 L20 17.2 L22.6 23 L25.8 14 M13 17.8 H27 M13 20.8 H27"
          stroke="#593006"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.32"
          transform="translate(0, 0.7)"
        />
        {/* 원화 심볼 본체 */}
        <path
          d="M14.2 14 L17.4 23 L20 17.2 L22.6 23 L25.8 14 M13 17.8 H27 M13 20.8 H27"
          stroke="url(#floatingWonGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 원화 심볼 상단 스펙터 하이라이트 */}
        <path
          d="M14.2 14 L17.4 23 M20 17.2 L22.6 23 M13.5 17.8 H26.5"
          stroke="rgba(255, 255, 255, 0.65)"
          strokeWidth="0.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 7. 우상단 4각 반짝이 별 */}
        <path
          d="M32.5 5.5 Q32.5 8 34.5 8 Q32.5 8 32.5 10.5 Q32.5 8 30.5 8 Q32.5 8 32.5 5.5 Z"
          fill="#FEF08A"
          filter="drop-shadow(0 1px 2px rgba(234, 179, 8, 0.6))"
        />
      </svg>
    </div>
  );
}

export default FloatingClayCoin3D;
