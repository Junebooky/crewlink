'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Check,
  Share2,
} from 'lucide-react';

interface EventDetailProps {
  event?: {
    id: string;
    displayTitle: string;
    hostName: string;
    categoryLabel: string;
    regionLabel: string;
    venueAddress: string;
    venueDetail: string;
    deadlineDateLabel: string;
    workHoursLabel: string;
    breakMinutesLabel: string;
    dailyWageWon: number;
    dates: { id: string; date: string; dayOfWeek: string }[];
    roles: { title: string; desc: string }[];
    dressCode: {
      type: 'FORMAL' | 'CASUAL' | 'UNIFORM';
      title: string;
      desc: string;
    };
    qualifications: string[];
  };
}

// 3D 클레이 지갑 + 코인 스택 + 반짝이 별 에셋 (참조 이미지 스타일)
function ClayWallet3DAsset() {
  return (
    <div className="relative w-28 h-20 shrink-0 flex items-center justify-center select-none">
      <svg
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm overflow-visible"
      >
        <defs>
          <filter id="clayShadow" x="-20%" y="-20%" width="140%" height="160%">
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
          filter="url(#clayShadow)"
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

export default function EventDetailClient({ event: initialEvent }: EventDetailProps) {
  const event = initialEvent || {
    id: 'evt-2026-001',
    displayTitle: '2026 성수 럭셔리 뷰티 브랜드 팝업스토어 현장 운영 크루',
    hostName: '(주)글로우랩스 코리아',
    categoryLabel: '팝업스토어',
    regionLabel: '서울 성동구',
    venueAddress: '서울 성동구 연무장길 45',
    venueDetail: '성수역 3번 출구 도보 5분 메인 팝업존',
    deadlineDateLabel: '10.18까지 모집',
    workHoursLabel: '11:00 ~ 20:00',
    breakMinutesLabel: '60분 휴게',
    dailyWageWon: 120000,
    dates: [
      { id: 'd1', date: '2026-10-16', dayOfWeek: '금' },
      { id: 'd2', date: '2026-10-17', dayOfWeek: '토' },
      { id: 'd3', date: '2026-10-18', dayOfWeek: '일' },
    ],
    roles: [
      {
        title: '동선 및 관람객 입장 통제',
        desc: '사전 예약자 대기열 라인 정돈 및 현장 대기 인원 동선 분리 안내',
      },
      {
        title: '체험 부스 및 이벤트 지원',
        desc: '포토존 인솔, 럭키드로우 룰렛 진행 및 인스타그램 인증 확인',
      },
      {
        title: '사은품 배부 및 체크리스트 관리',
        desc: '방문 완료 키트 패키징 불출 및 수량 체크',
      },
    ],
    dressCode: {
      type: 'FORMAL' as const,
      title: '단정 올블랙 정장 및 단화 착용',
      desc: '상/하의 단정한 블랙 슬랙스 및 셔츠, 찢어진 바지/운동화/슬리퍼 불가',
    },
    qualifications: [
      '고객 응대에 밝고 적극적인 태도를 가지신 분',
      '시간 엄수 및 근태가 성실하신 분 (지각/무단이탈 절대 불가)',
      '단정한 용모와 복장 규정 준수가 가능하신 분',
    ],
  };

  const [selectedDateIds, setSelectedDateIds] = useState<string[]>(
    event.dates.map((d) => d.id)
  );

  const toggleDate = (id: string) => {
    setSelectedDateIds((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((item) => item !== id)
          : prev
        : [...prev, id]
    );
  };

  const totalEstimatedWage = event.dailyWageWon * selectedDateIds.length;

  return (
    <div className="min-h-screen bg-canvas text-ink pb-28">
      {/* 1. 상단 내비게이션 바 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border/80 h-14 flex items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-muted hover:text-ink transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>공고 목록</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(window.location.href);
              alert('공고 링크가 복사되었습니다.');
            }
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors"
          aria-label="공고 공유하기"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* 2. 헤더 메타 (인증 주최사 파란 원형 속 흰색 V 체크 & 마감일 텍스트) */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-4 h-4 rounded-full bg-brand flex items-center justify-center shrink-0 shadow-2xs">
                <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
              </span>
              <span className="font-semibold text-ink">{event.hostName}</span>
              <span className="text-border">·</span>
              <span className="text-muted">{event.categoryLabel}</span>
            </div>

            <span className="text-xs font-semibold text-muted tracking-tight">
              {event.deadlineDateLabel}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-ink leading-tight tracking-tight break-keep">
            {event.displayTitle}
          </h1>
        </div>

        {/* 3. [2번 요구사항 반영] 날짜 선택 + 예상 보수를 하나로 합친 단일 통합 카드 */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-border shadow-2xs space-y-5">
          {/* 상단: 근무 일정 선택 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                근무 일정 선택
              </span>
              <span className="text-xs text-muted">원하는 날짜를 선택해 주세요</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {event.dates.map((d) => {
                const isSelected = selectedDateIds.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDate(d.id)}
                    className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer ${isSelected
                      ? 'border-brand bg-white text-ink font-bold shadow-xs ring-1 ring-brand'
                      : 'border-border/80 bg-canvas text-muted hover:border-brand/40'
                      }`}
                  >
                    <p className="text-xs text-muted mb-0.5">{d.dayOfWeek}요일</p>
                    <p className="text-sm font-semibold">{d.date.slice(5)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 내부 구분선 */}
          <div className="h-px bg-border-subtle" />

          {/* 하단: 선택 근무일 비례 예상 보수 + 3D 클레이 지갑 에셋 */}
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <span>선택 근무일 비례 예상 보수</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                <span className="text-ink font-bold">{selectedDateIds.length}일 선택</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-ink tracking-tight tabular-nums">
                  {totalEstimatedWage.toLocaleString()}
                </span>
                <span className="text-base sm:text-lg font-bold text-ink">원</span>
                <span className="text-xs text-muted ml-1">(세전)</span>
              </div>
              <p className="text-xs text-muted">
                하루 {event.dailyWageWon.toLocaleString()}원 × {selectedDateIds.length}일
              </p>
            </div>

            {/* 3D 클레이 지갑 & 코인 스택 */}
            <ClayWallet3DAsset />
          </div>
        </section>

        {/* 4. [3번 요구사항 반영] 근무 핵심 요약 (원래대로 완벽 복원) */}
        <section className="bg-white rounded-3xl p-5 border border-border shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-ink">근무 핵심 요약</h2>
          <div className="space-y-3.5 text-sm">
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-ink">근무 시간</p>
                <p className="text-xs text-muted mt-0.5">
                  {event.workHoursLabel} ({event.breakMinutesLabel})
                </p>
              </div>
            </div>
            <div className="h-px bg-border-subtle" />
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-ink">근무 장소</p>
                <p className="text-xs text-muted mt-0.5">{event.venueAddress}</p>
                <p className="text-xs text-muted/80">{event.venueDetail}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. 담당할 주요 업무 (순백색 카드) */}
        <section className="bg-white rounded-3xl p-5 border border-border shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-ink">담당할 주요 업무</h2>
          <div className="space-y-2.5">
            {event.roles.map((role, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-2xl border border-border/80 shadow-2xs flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-canvas text-brand-strong flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold border border-border/50">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">{role.title}</p>
                  <p className="text-xs text-muted mt-0.5 break-keep leading-relaxed">
                    {role.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. [1번 요구사항 반영] 복장 규정 (배경화면 제거 및 border에 브랜드 색상 적용) */}
        <section className="bg-white rounded-3xl p-5 border border-border shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-ink">복장 규정</h2>
          <div className="p-4 rounded-2xl border border-brand/60">
            <p className="text-sm font-bold text-ink">{event.dressCode.title}</p>
            <p className="text-xs text-muted mt-1 break-keep leading-relaxed">
              {event.dressCode.desc}
            </p>
          </div>
        </section>

        {/* 7. [1번 요구사항 반영] 지원 자격 안내 (원래의 깔끔한 체크리스트 유지) */}
        <section className="bg-white rounded-3xl p-5 border border-border shadow-2xs space-y-3">
          <h2 className="text-base font-bold text-ink">지원 자격 및 안내</h2>
          <ul className="space-y-2.5 text-xs text-muted">
            {event.qualifications.map((q, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 mt-1.5" />
                <span className="break-keep leading-relaxed">{q}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* 8. 하단 고정 지원 액션 바 (52px CTA) */}
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-border px-4 py-3 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted">선택 {selectedDateIds.length}일 총 예상 보수</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-extrabold text-ink tabular-nums">
                {totalEstimatedWage.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-ink">원</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              alert(`${selectedDateIds.length}일 일정으로 지원을 시작합니다.`);
            }}
            className="min-h-[52px] px-8 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-sm transition-colors active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>현장 지원하기</span>
          </button>
        </div>
      </footer>
    </div>
  );
}