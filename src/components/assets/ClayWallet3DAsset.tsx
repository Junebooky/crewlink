import React from 'react';
import { cn } from '@/lib/utils';

export interface ClayWallet3DAssetProps {
  className?: string;
}

/**
 * 3D 소프트 클레이 로열 블루 지갑 + 골드 코인 스택 + 4각 반짝이 별 에셋 (ClayWallet3DAsset)
 */
export function ClayWallet3DAsset({ className = 'w-28 h-20' }: ClayWallet3DAssetProps) {
  return (
    <div className={cn('relative shrink-0 flex items-center justify-center select-none', className)}>
      <svg
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <filter id="clayWalletShadow" x="-20%" y="-20%" width="140%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
            <feOffset dx="0" dy="6" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.15" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="walletBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4B8DFF" />
            <stop offset="35%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          <linearGradient id="walletBack" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>

          <linearGradient id="strapGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>

          <radialGradient id="silverSnap" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </radialGradient>

          <linearGradient id="coinBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="30%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>

          <linearGradient id="coinTop" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FEF9C3" />
            <stop offset="100%" stopColor="#FDE047" />
          </linearGradient>
        </defs>

        {/* 바닥 그림자 */}
        <ellipse cx="80" cy="106" rx="65" ry="8" fill="#1E3A8A" opacity="0.12" filter="blur(3px)" />

        {/* 지갑 뒤쪽 플랩 */}
        <path
          d="M58 36 C58 28, 64 24, 74 24 L114 24 C124 24, 130 28, 130 36 L130 52 L58 52 Z"
          fill="url(#walletBack)"
        />

        {/* 지갑 메인 본체 */}
        <rect
          x="50"
          y="34"
          width="86"
          height="58"
          rx="18"
          fill="url(#walletBlue)"
          filter="url(#clayWalletShadow)"
        />

        {/* 상단 3D 엠보싱 하이라이트 */}
        <path
          d="M66 38 Q93 35 120 38"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* 잠금 스트랩 */}
        <path
          d="M102 54 L138 54 C143 54, 147 58, 147 64 C147 70, 143 74, 138 74 L102 74 C97 74, 94 70, 94 64 C94 58, 97 54, 102 54 Z"
          fill="url(#strapGrad)"
          filter="drop-shadow(0 2px 3px rgba(15,23,42,0.2))"
        />
        <circle cx="109" cy="64" r="5.5" fill="url(#silverSnap)" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.25))" />

        {/* 코인 스택 1 (왼쪽) */}
        <g transform="translate(28, 80)">
          <rect x="0" y="3" width="28" height="11" rx="5.5" fill="url(#coinBody)" />
          <ellipse cx="14" cy="4" rx="14" ry="4" fill="url(#coinTop)" />
        </g>
        <g transform="translate(28, 69)">
          <rect x="0" y="3" width="28" height="11" rx="5.5" fill="url(#coinBody)" />
          <ellipse cx="14" cy="4" rx="14" ry="4" fill="url(#coinTop)" />
        </g>
        <g transform="translate(28, 58)">
          <rect x="0" y="3" width="28" height="11" rx="5.5" fill="url(#coinBody)" />
          <ellipse cx="14" cy="4" rx="14" ry="4" fill="url(#coinTop)" />
        </g>
        <g transform="translate(28, 47)">
          <rect x="0" y="3" width="28" height="11" rx="5.5" fill="url(#coinBody)" />
          <ellipse cx="14" cy="4" rx="14" ry="4" fill="url(#coinTop)" />
          <path d="M4 3.5 Q14 2 24 3.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* 코인 스택 2 (오른쪽) */}
        <g transform="translate(54, 82)">
          <rect x="0" y="3" width="26" height="11" rx="5.5" fill="url(#coinBody)" />
          <ellipse cx="13" cy="4" rx="13" ry="4" fill="url(#coinTop)" />
        </g>
        <g transform="translate(54, 71)">
          <rect x="0" y="3" width="26" height="11" rx="5.5" fill="url(#coinBody)" />
          <ellipse cx="13" cy="4" rx="13" ry="4" fill="url(#coinTop)" />
          <path d="M4 3.5 Q13 2 22 3.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* 3D 반짝이 별 */}
        <path
          d="M116 14 Q116 23 124 23 Q116 23 116 32 Q116 23 108 23 Q116 23 116 14 Z"
          fill="#3B82F6"
          filter="drop-shadow(0 2px 4px rgba(59,130,246,0.3))"
        />
        <path
          d="M12 68 Q12 73 17 73 Q12 73 12 78 Q12 73 7 73 Q12 73 12 68 Z"
          fill="#60A5FA"
        />
      </svg>
    </div>
  );
}

export default ClayWallet3DAsset;
