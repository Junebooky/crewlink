import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface FloatingClayCoin3DProps {
  className?: string;
}

/**
 * 3D 소프트 클레이 코인 에셋 (FloatingClayCoin3D)
 * - /assets/clay/coin.png 기반 고품질 3D 점토 코인 렌더링
 */
export function FloatingClayCoin3D({ className = 'w-6 h-6' }: FloatingClayCoin3DProps) {
  return (
    <div
      className={cn(
        'relative shrink-0 inline-flex items-center justify-center select-none',
        className
      )}
      aria-hidden="true"
    >
      <Image
        src="/assets/clay/coin.png"
        alt="코인"
        width={24}
        height={24}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
}

export default FloatingClayCoin3D;
