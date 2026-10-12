'use client';

import React from 'react';
import Image from 'next/image';
import { User, Loader2, Sparkles } from 'lucide-react';

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
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-border shadow-sm relative overflow-hidden mb-4">
      {/* 우측 상단 오로라 데코 */}
      <div
        className="absolute -top-10 -right-10 w-44 h-44 bg-brand-soft/40 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* 상단 프로필 헤더 (좌우 2단) */}
      <div className="flex items-center gap-4 sm:gap-6 relative z-10">
        {/* 좌측 프로필 사진: 원형(동그라미) 고정 규격 */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-border-subtle bg-white shadow-inner relative shrink-0 flex items-center justify-center">
          {crew.profileImageUrl ? (
            <Image
              src={crew.profileImageUrl}
              alt={crew.fullName}
              fill
              className="object-cover w-full h-full"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-white flex flex-col items-center justify-center text-muted select-none p-1 text-center">
              <User className="w-9 h-9 sm:w-10 sm:h-10 text-muted/40 mb-0.5" />
              <span className="text-[10px] sm:text-[11px] text-muted font-medium">
                프로필 미등록
              </span>
            </div>
          )}
        </div>

        {/* 우측 정보 영역: 완벽한 좌측 정렬 & 박스 없는 '선발 완료' */}
        <div className="flex-1 flex flex-col items-start text-left justify-center space-y-1 min-w-0">
          {/* 상단 상태: 박스 없는 심플 표기 */}
          {isApproved ? (
            <div className="flex items-center gap-1.5">
              <Image
                src="/assets/clay/check.png"
                alt="완료"
                width={15}
                height={15}
                className="w-3.5 h-3.5 object-contain"
              />
              <span className="text-xs font-bold text-brand-strong tracking-tight">선발 완료</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-muted tracking-tight">심사 대기</span>
            </div>
          )}

          {/* 중앙 실명 헤드라인 */}
          <h3 className="text-2xl font-black text-ink tracking-tight truncate">
            {crew.fullName}
          </h3>

          {/* 하단 연락처 */}
          <div className="flex items-center gap-1.5 text-sm font-semibold text-muted">
            <Image
              src="/assets/clay/phone.png"
              alt="전화"
              width={24}
              height={24}
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0"
            />
            <span className="truncate">{crew.phone}</span>
          </div>
        </div>
      </div>

      {/* 신체 스펙 블록 (3열 그리드 카드 - 퓨어 화이트 & 줄바꿈 방지) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mt-4 relative z-10">
        {/* 1열: 키 */}
        <div className="bg-white rounded-2xl border border-border/80 shadow-2xs p-3 sm:p-3.5 flex flex-col justify-between min-h-[82px]">
          <div className="flex items-center gap-1.5">
            <Image
              src="/assets/clay/height.png"
              alt="키"
              width={20}
              height={20}
              className="w-5 h-5 object-contain shrink-0"
            />
            <span className="whitespace-nowrap shrink-0 text-xs font-medium text-muted">키</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-ink mt-1 truncate">
            {crew.heightCm ? `${crew.heightCm}cm` : '176cm'}
          </div>
        </div>

        {/* 2열: 상/하의 */}
        <div className="bg-white rounded-2xl border border-border/80 shadow-2xs p-3 sm:p-3.5 flex flex-col justify-between min-h-[82px]">
          <div className="flex items-center gap-1.5">
            <Image
              src="/assets/clay/shirt.png"
              alt="상/하의"
              width={20}
              height={20}
              className="w-5 h-5 object-contain shrink-0"
            />
            <span className="whitespace-nowrap shrink-0 text-xs font-medium text-muted">상/하의</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-ink mt-1 truncate">
            {crew.topSize || 'M'} / {crew.bottomSize || '32'}
          </div>
        </div>

        {/* 3열: 신발 */}
        <div className="bg-white rounded-2xl border border-border/80 shadow-2xs p-3 sm:p-3.5 flex flex-col justify-between min-h-[82px]">
          <div className="flex items-center gap-1.5">
            <Image
              src="/assets/clay/shoe.png"
              alt="신발"
              width={20}
              height={20}
              className="w-5 h-5 object-contain shrink-0"
            />
            <span className="whitespace-nowrap shrink-0 text-xs font-medium text-muted">신발</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-ink mt-1 truncate">
            {crew.shoeSizeMm ? `${crew.shoeSizeMm}mm` : '270mm'}
          </div>
        </div>
      </div>

      {/* 경력 & 평점 블록 (2열 그리드 카드 - 퓨어 화이트 & 올-블랙 텍스트) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mt-2.5 relative z-10">
        {/* 1열: 경력 */}
        <div className="bg-white rounded-2xl border border-border/80 shadow-2xs p-3.5 flex items-center gap-3">
          <Image
            src="/assets/clay/briefcase.png"
            alt="경력"
            width={24}
            height={24}
            className="w-6 h-6 object-contain shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-xs text-muted font-medium block">경력</span>
            <span className="text-ink font-bold text-sm sm:text-base truncate block">
              {crew.experienceYears || 3}년 ({crew.totalShiftsCompleted || 24}회)
            </span>
          </div>
        </div>

        {/* 2열: 평점 */}
        <div className="bg-white rounded-2xl border border-border/80 shadow-2xs p-3.5 flex items-center gap-3">
          <Image
            src="/assets/clay/star.png"
            alt="평점"
            width={24}
            height={24}
            className="w-6 h-6 object-contain shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-xs text-muted font-medium block">평점</span>
            <span className="text-ink font-bold text-sm sm:text-base truncate block">
              {crew.ratingAvg ? crew.ratingAvg.toFixed(2) : '4.96'}
            </span>
          </div>
        </div>
      </div>

      {/* 전문 분야 / 인용구 블록 (퓨어 화이트 2단 flex 구조 정렬) */}
      <div className="mt-2.5 bg-white rounded-2xl border border-border/80 shadow-2xs p-4 flex items-start gap-3.5 relative z-10">
        <Image
          src="/assets/clay/quote.png"
          alt="전문 분야"
          width={32}
          height={32}
          className="w-8 h-8 object-contain shrink-0 mt-0.5"
        />
        <div className="flex-1 flex flex-col justify-center space-y-1 text-left min-w-0">
          <span className="text-xs font-bold text-muted">전문 분야</span>
          <p className="text-sm font-bold text-ink leading-snug break-keep">
            “{crew.bio || '외국어 회화 및 관람객 동선 통제 전문'}”
          </p>
        </div>
      </div>

      {/* 하단 선발 / 배정 되돌리기 액션 */}
      <div className="mt-4 relative z-10">
        {isApproved ? (
          <button
            type="button"
            onClick={() => onCancel(application.id)}
            disabled={isProcessing}
            className="w-full h-12 rounded-2xl bg-white border border-border text-ink hover:text-error hover:border-error/30 hover:bg-error-soft/30 text-xs sm:text-sm font-bold transition-all shadow-2xs flex items-center justify-center active:scale-[0.99] cursor-pointer disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-muted mr-1.5" />
                <span>처리 중...</span>
              </>
            ) : (
              <span>선발 되돌리기</span>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onApprove(application.id)}
            disabled={isProcessing}
            className="w-full h-12 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
