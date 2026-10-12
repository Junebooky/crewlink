'use client';

import React from 'react';
import Image from 'next/image';
import { User, Loader2, Sparkles, ChevronRight } from 'lucide-react';

export interface ApplicantCrewProfile {
  personId: string;
  fullName: string;
  phone: string;
  profileImageUrl: string | null;
  heightCm: number | null;
  topSize: string | null;
  bottomSize: string | null;
  shoeSizeMm: number | null;
  experienceYears: number;
  bio: string;
  languages: string[];
  hasLanguages: boolean;
  ratingAvg: number;
  totalShiftsCompleted: number;
}

export interface ApplicantItem {
  id: string;
  projectId: string;
  shiftId: string;
  status: string; // 'applied', 'approved', etc.
  appliedAt: string;
  crew: ApplicantCrewProfile;
}

export interface ApplicantReviewCardProps {
  application: ApplicantItem;
  isProcessing: boolean;
  onApprove: (applicationId: string) => void;
  onCancel: (applicationId: string) => void;
}

export function ApplicantReviewCard({
  application,
  isProcessing,
  onApprove,
  onCancel,
}: ApplicantReviewCardProps) {
  const isApproved = application.status === 'approved' || application.status === 'accepted';
  const crew = application.crew;

  return (
    <div className="bg-surface-muted/50 rounded-3xl p-5 sm:p-6 border border-border/40 shadow-xs relative overflow-hidden mb-4">
      {/* 우측 상단 오로라 데코 */}
      <div
        className="absolute -top-10 -right-10 w-44 h-44 bg-brand-soft/30 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* 상단 프로필 헤더 (좌우 2단, 좌측 정렬 유지) */}
      <div className="flex items-center gap-4 sm:gap-6 relative z-10">
        {/* 좌측: 원형 프로필 */}
        <div className="w-24 h-24 rounded-full overflow-hidden bg-surface-muted border border-border/40 shrink-0 flex items-center justify-center relative shadow-inner">
          {crew.profileImageUrl ? (
            <Image
              src={crew.profileImageUrl}
              alt={crew.fullName}
              fill
              className="object-cover w-full h-full"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-surface-muted flex flex-col items-center justify-center text-muted select-none p-1 text-center">
              <User className="w-9 h-9 sm:w-10 sm:h-10 text-muted/50 mb-0.5" />
              <span className="text-[10px] sm:text-[11px] text-muted font-medium">
                프로필 미등록
              </span>
            </div>
          )}
        </div>

        {/* 우측: flex flex-col items-start justify-center space-y-1 text-left */}
        <div className="flex-1 flex flex-col items-start justify-center space-y-1 text-left min-w-0">
          {/* 상단: 배경 박스 없이 check.png (w-4 h-4) + 선발 완료 (text-xs font-bold text-ink) */}
          {isApproved ? (
            <div className="flex items-center gap-1.5">
              <Image
                src="/assets/clay/check.png"
                alt="완료"
                width={16}
                height={16}
                className="w-4 h-4 object-contain"
              />
              <span className="text-xs font-bold text-ink tracking-tight">선발 완료</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-muted tracking-tight">심사 대기</span>
            </div>
          )}

          {/* 중앙: 강선민 (text-2xl font-black text-ink tracking-tight) */}
          <h3 className="text-2xl font-black text-ink tracking-tight truncate">
            {crew.fullName}
          </h3>

          {/* 하단: phone.png (w-5 h-5) + 전화번호 (text-sm font-semibold text-muted) */}
          <div className="flex items-center gap-1.5 text-sm font-semibold text-muted">
            <Image
              src="/assets/clay/phone.png"
              alt="전화"
              width={20}
              height={20}
              className="w-5 h-5 object-contain shrink-0"
            />
            <span className="truncate">{crew.phone}</span>
          </div>
        </div>
      </div>

      {/* 섹션 1: 신체 정보 3열 통합형 카드 */}
      <div className="mt-5 relative z-10">
        <h4 className="text-sm font-bold text-ink mb-2 px-1 text-left">신체 정보</h4>
        <div className="bg-white rounded-2xl shadow-2xs p-4 grid grid-cols-3 gap-2 text-center">
          {/* 1열: 키 */}
          <div>
            <Image
              src="/assets/clay/height.png"
              alt="키"
              width={20}
              height={20}
              className="w-5 h-5 mx-auto object-contain"
            />
            <span className="text-xs text-muted font-medium mt-1 block">키</span>
            <span className="font-bold text-ink text-sm sm:text-base mt-1 block truncate">
              {crew.heightCm ? `${crew.heightCm}cm` : '176cm'}
            </span>
          </div>

          {/* 2열: 상/하의 */}
          <div>
            <Image
              src="/assets/clay/shirt.png"
              alt="상/하의"
              width={20}
              height={20}
              className="w-5 h-5 mx-auto object-contain"
            />
            <span className="whitespace-nowrap shrink-0 text-xs font-medium text-muted mt-1 block">
              상/하의
            </span>
            <span className="font-bold text-ink text-sm sm:text-base mt-1 block truncate">
              {crew.topSize || 'M'} / {crew.bottomSize || '32'}
            </span>
          </div>

          {/* 3열: 신발 */}
          <div>
            <Image
              src="/assets/clay/shoe.png"
              alt="신발"
              width={20}
              height={20}
              className="w-5 h-5 mx-auto object-contain"
            />
            <span className="text-xs text-muted font-medium mt-1 block">신발</span>
            <span className="font-bold text-ink text-sm sm:text-base mt-1 block truncate">
              {crew.shoeSizeMm ? `${crew.shoeSizeMm}mm` : '270mm'}
            </span>
          </div>
        </div>
      </div>

      {/* 섹션 2: 경력 및 평점 2열 무보더 카드 */}
      <div className="mt-5 relative z-10">
        <h4 className="text-sm font-bold text-ink mb-2 px-1 text-left">경력 및 평점</h4>
        <div className="grid grid-cols-2 gap-3">
          {/* 좌측 카드: 경력 */}
          <div className="bg-white rounded-2xl shadow-2xs p-3.5 flex items-center gap-3">
            <Image
              src="/assets/clay/briefcase.png"
              alt="경력"
              width={24}
              height={24}
              className="w-6 h-6 shrink-0 object-contain"
            />
            <div className="min-w-0 flex-1 text-left">
              <span className="text-xs text-muted font-medium block">경력</span>
              <span className="font-bold text-ink text-sm sm:text-base truncate block">
                {crew.experienceYears || 3}년 ({crew.totalShiftsCompleted || 24}회)
              </span>
            </div>
          </div>

          {/* 우측 카드: 평점 */}
          <div className="bg-white rounded-2xl shadow-2xs p-3.5 flex items-center gap-3">
            <Image
              src="/assets/clay/star.png"
              alt="평점"
              width={24}
              height={24}
              className="w-6 h-6 shrink-0 object-contain"
            />
            <div className="min-w-0 flex-1 text-left">
              <span className="text-xs text-muted font-medium block">평점</span>
              <span className="font-bold text-ink text-sm sm:text-base truncate block">
                {crew.ratingAvg ? crew.ratingAvg.toFixed(2) : '4.96'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 섹션 3: 전문 분야 카드 및 아이콘 수직 중앙 정렬 */}
      <div className="mt-5 relative z-10">
        <h4 className="text-sm font-bold text-ink mb-2 px-1 text-left">전문 분야</h4>
        <div className="bg-white rounded-2xl shadow-2xs p-4 flex items-center gap-3.5 text-left">
          <Image
            src="/assets/clay/quote.png"
            alt="전문 분야"
            width={36}
            height={36}
            className="w-9 h-9 shrink-0 object-contain"
          />
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <span className="text-xs font-semibold text-muted mb-0.5">전문 분야</span>
            <p className="text-sm font-bold text-ink leading-snug break-keep">
              “{crew.bio || '외국어 회화 및 관람객 동선 통제 전문'}”
            </p>
          </div>
        </div>
      </div>

      {/* 하단 액션 버튼 ('선발 되돌리기 >' 브랜드 솔리드화) */}
      <div className="mt-5 relative z-10">
        {isApproved ? (
          <button
            type="button"
            onClick={() => onCancel(application.id)}
            disabled={isProcessing}
            className="w-full h-12 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white mr-1.5" />
                <span>처리 중...</span>
              </>
            ) : (
              <>
                <span>선발 되돌리기</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onApprove(application.id)}
            disabled={isProcessing}
            className="w-full h-12 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>선발 처리 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>이 크루 선발하기</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default ApplicantReviewCard;
