'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  Search,
  Check,
  ChevronRight,
  ShieldCheck,
  ArrowUpDown,
  RotateCcw,
  X,
  CalendarRange,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PublicHeader } from '@/components/common/PublicHeader';
import { MobileBottomNav } from '@/components/common/MobileBottomNav';


// 기준 시각: 2026년 10월 12일 (월요일)
const CURRENT_DATE_STR = '2026-10-12';

export type EventCategory = 'popup' | 'expo' | 'brand' | 'festival';
export type RecruitmentStatus = 'OPEN' | 'CLOSING_SOON' | 'CLOSED';
export type DatePreset = 'all' | 'today_tomorrow' | 'this_weekend' | 'next_week' | 'custom';

export interface EventListItem {
  id: string;
  title: string;
  displayTitle: string;
  hostName: string;
  category: EventCategory;
  categoryLabel: string;
  regionId: string;
  regionLabel: string;
  stationInfo?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  dateRangeLabel: string;
  workHoursLabel: string;
  dailyWageWon: number;
  requiredCount: number;
  confirmedCount: number;
  deadlineDate: string;
  recruitmentStatus: RecruitmentStatus;
  primaryRoles: string[];
  createdAt: string;
}

const EVENT_FEED_DATA: EventListItem[] = [
  {
    id: 'evt-2026-001',
    title: '2026 성수 럭셔리 뷰티 브랜드 팝업스토어 현장 운영 크루',
    displayTitle: '성수 뷰티 팝업 운영 크루',
    hostName: '(주)글로우랩스 코리아',
    category: 'popup',
    categoryLabel: '팝업스토어',
    regionId: 'seongsu',
    regionLabel: '서울 성동구',
    stationInfo: '성수역 도보 5분',
    startDate: '2026-10-16',
    endDate: '2026-10-18', // 이번 주말 포함
    dateRangeLabel: '10.16–10.18 · 3일간',
    workHoursLabel: '11:00–20:00',
    dailyWageWon: 120000,
    requiredCount: 6,
    confirmedCount: 2,
    deadlineDate: '2026-10-14',
    recruitmentStatus: 'CLOSING_SOON',
    primaryRoles: ['고객 안내', 'POS 결제', '사은품 배부'],
    createdAt: '2026-10-11T09:00:00Z',
  },
  {
    id: 'evt-2026-002',
    title: '2026 서울 모빌리티 엑스포 VIP 리셉션 및 등록 안내 스태프',
    displayTitle: '모빌리티 엑스포 VIP 리셉션',
    hostName: '모빌리티혁신협회',
    category: 'expo',
    categoryLabel: '전시·박람회',
    regionId: 'gangnam',
    regionLabel: '서울 강남구',
    stationInfo: '삼성역 코엑스',
    startDate: '2026-10-22',
    endDate: '2026-10-25', // 다음 주
    dateRangeLabel: '10.22–10.25 · 4일간',
    workHoursLabel: '09:00–18:00',
    dailyWageWon: 135000,
    requiredCount: 8,
    confirmedCount: 3,
    deadlineDate: '2026-10-18',
    recruitmentStatus: 'OPEN',
    primaryRoles: ['VIP 라운지', '외국어 응대', '등록 데스크'],
    createdAt: '2026-10-12T03:00:00Z',
  },
  {
    id: 'evt-2026-003',
    title: '영캐주얼 스트릿 브랜드 런칭 기념 팝업 이벤트 진행 보조',
    displayTitle: '여의도 영캐주얼 런칭 팝업',
    hostName: '스튜디오 바이브',
    category: 'popup',
    categoryLabel: '팝업스토어',
    regionId: 'yeouido',
    regionLabel: '서울 영등포구',
    stationInfo: '여의도 더현대',
    startDate: '2026-10-19',
    endDate: '2026-10-25', // 다음 주
    dateRangeLabel: '10.19–10.25 · 7일간',
    workHoursLabel: '10:00–20:00',
    dailyWageWon: 130000,
    requiredCount: 4,
    confirmedCount: 1,
    deadlineDate: '2026-10-15',
    recruitmentStatus: 'OPEN',
    primaryRoles: ['대기열 안내', '이벤트 진행', 'SNS 인증 확인'],
    createdAt: '2026-10-10T12:00:00Z',
  },
  {
    id: 'evt-2026-004',
    title: '2026 대한민국 스마트 안전산업 박람회 종합 안내소 운영',
    displayTitle: '킨텍스 안전산업 박람회 안내',
    hostName: '(주)세이프티엔지니어링',
    category: 'expo',
    categoryLabel: '전시·박람회',
    regionId: 'kintex',
    regionLabel: '경기 고양시',
    stationInfo: '킨텍스 제1전시장',
    startDate: '2026-10-28',
    endDate: '2026-10-30',
    dateRangeLabel: '10.28–10.30 · 3일간',
    workHoursLabel: '09:30–17:30',
    dailyWageWon: 105000,
    requiredCount: 3,
    confirmedCount: 0,
    deadlineDate: '2026-10-24',
    recruitmentStatus: 'OPEN',
    primaryRoles: ['명찰 배부', '동선 안내'],
    createdAt: '2026-10-09T15:00:00Z',
  },
];

const CATEGORY_OPTIONS: { id: 'all' | EventCategory; label: string }[] = [
  { id: 'all', label: '전체 행사' },
  { id: 'popup', label: '팝업스토어' },
  { id: 'expo', label: '전시·박람회' },
  { id: 'brand', label: '브랜드 행사' },
  { id: 'festival', label: '페스티벌' },
];

const REGION_OPTIONS: { id: string; label: string }[] = [
  { id: 'all', label: '전체 지역' },
  { id: 'seongsu', label: '성수' },
  { id: 'gangnam', label: '강남·코엑스' },
  { id: 'yeouido', label: '여의도' },
  { id: 'kintex', label: '일산·킨텍스' },
];

type SortOrder = 'latest' | 'deadline' | 'wage_desc';

const SORT_OPTIONS: { id: SortOrder; label: string }[] = [
  { id: 'latest', label: '최신순' },
  { id: 'deadline', label: '마감 임박순' },
  { id: 'wage_desc', label: '보수 높은순' },
];

// 행사 일정과 필터 일정의 중첩(Overlap) 여부 판별 함수
function checkDateOverlap(eventStart: string, eventEnd: string, targetStart: string, targetEnd: string): boolean {
  return !(eventEnd < targetStart || eventStart > targetEnd);
}

// 지원 마감 정보 (1행: 마감 일자 고정 표기, 2행: D-Day 표기)
interface DeadlineInfo {
  dateLabel: string;
  dDayLabel: string;
}

function getDeadlineInfo(deadlineStr: string): DeadlineInfo {
  const parts = deadlineStr.split('-');
  const monthDay =
    parts.length === 3 ? `${parts[1]}.${parts[2]}` : deadlineStr.slice(5).replace('-', '.');
  const dateLabel = `지원 마감 ${monthDay}`;

  const current = new Date(`${CURRENT_DATE_STR}T00:00:00Z`);
  const deadline = new Date(`${deadlineStr}T00:00:00Z`);
  const diffDays = Math.ceil((deadline.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

  let dDayLabel = `D-${diffDays}`;
  if (diffDays < 0) {
    dDayLabel = '마감';
  } else if (diffDays === 0) {
    dDayLabel = '오늘 마감';
  }

  return { dateLabel, dDayLabel };
}

// 하루 보수 3D 소프트 클레이 돈 보따리 아이콘 (Burlap/Leather Pouch + Gold Coins)
function ClayMoneyBag3D({ className = 'w-10 h-10' }: { className?: string }) {
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


export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | EventCategory>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 날짜 필터링 범위 계산
  const activeDateRange = useMemo<{ start: string; end: string; label: string } | null>(() => {
    if (datePreset === 'all') return null;
    if (datePreset === 'today_tomorrow') {
      return { start: '2026-10-12', end: '2026-10-13', label: '오늘·내일 (10.12~13)' };
    }
    if (datePreset === 'this_weekend') {
      return { start: '2026-10-17', end: '2026-10-18', label: '이번 주말 (10.17~18)' };
    }
    if (datePreset === 'next_week') {
      return { start: '2026-10-19', end: '2026-10-25', label: '다음 주 (10.19~25)' };
    }
    if (datePreset === 'custom' && customStartDate && customEndDate) {
      return {
        start: customStartDate,
        end: customEndDate,
        label: `${customStartDate.slice(5)}~${customEndDate.slice(5)}`,
      };
    }
    return null;
  }, [datePreset, customStartDate, customEndDate]);

  // 필터링 & 정렬 연산
  const filteredAndSortedEvents = useMemo(() => {
    return EVENT_FEED_DATA.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchReg = selectedRegion === 'all' || item.regionId === selectedRegion;

      // 날짜 조건 일치 확인
      let matchDate = true;
      if (activeDateRange) {
        matchDate = checkDateOverlap(item.startDate, item.endDate, activeDateRange.start, activeDateRange.end);
      }

      const trimmedQuery = searchKeyword.trim().toLowerCase();
      const matchSearch =
        !trimmedQuery ||
        item.title.toLowerCase().includes(trimmedQuery) ||
        item.displayTitle.toLowerCase().includes(trimmedQuery) ||
        item.hostName.toLowerCase().includes(trimmedQuery) ||
        item.regionLabel.toLowerCase().includes(trimmedQuery) ||
        (item.stationInfo && item.stationInfo.toLowerCase().includes(trimmedQuery)) ||
        item.primaryRoles.some((role) => role.toLowerCase().includes(trimmedQuery));

      return matchCat && matchReg && matchDate && matchSearch;
    }).sort((a, b) => {
      if (sortOrder === 'deadline') {
        return a.deadlineDate.localeCompare(b.deadlineDate);
      }
      if (sortOrder === 'wage_desc') {
        return b.dailyWageWon - a.dailyWageWon;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [selectedCategory, selectedRegion, activeDateRange, sortOrder, searchKeyword]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedRegion('all');
    setDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortOrder('latest');
    setSearchKeyword('');
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col pb-20 md:pb-12">
      {/* 1. 크루 중심 퍼블릭 헤더 */}
      <PublicHeader />

      {/* 2. 상단 타이틀 & 검색 바 */}
      <section className="bg-surface border-b border-border-subtle pt-6 pb-5 px-4 sm:px-6">

        <div className="max-w-4xl mx-auto space-y-4">
          <div>
            <p className="text-xs font-bold text-muted tracking-wider uppercase mb-1">
              행사와 크루를 잇다
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              지금, 함께할 현장
            </h1>
            <p className="text-sm text-muted mt-1 break-keep">
              일정과 장소, 보수를 확인하고 나에게 맞는 현장을 찾아보세요.
            </p>
          </div>

          {/* 52px 높이 표준 검색 인풋 */}
          <div className="relative">
            <label htmlFor="event-search-input" className="sr-only">
              행사, 지역, 업무 검색
            </label>
            <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="event-search-input"
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="행사, 지역, 업무로 검색 (예: 성수, 코엑스, 안내)"
              className="w-full h-[52px] pl-11 pr-4 rounded-2xl border border-border bg-surface text-ink text-base focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-xs transition-colors"
            />
          </div>

          {/* 2. [신규 추가] 날짜 퀵 필터 바 (한 손 조작 최적화) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">


              {[
                { id: 'all', label: '전체 일정' },
                { id: 'today_tomorrow', label: '오늘·내일' },
                { id: 'this_weekend', label: '이번 주말' },
                { id: 'next_week', label: '다음 주' },
              ].map((preset) => {
                const isSelected = datePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setDatePreset(preset.id as DatePreset);
                      if (preset.id !== 'custom') setIsDatePickerOpen(false);
                    }}
                    className={cn(
                      'min-h-[38px] px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold shrink-0 transition-colors cursor-pointer border flex items-center gap-1',
                      isSelected
                        ? 'bg-brand text-inverse border-brand shadow-xs'
                        : 'bg-surface text-muted border-border hover:border-brand-border'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 shrink-0" />}
                    <span>{preset.label}</span>
                  </button>
                );
              })}

              {/* 직접 선택 트리거 버튼 */}
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className={cn(
                  'min-h-[38px] px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold shrink-0 transition-colors cursor-pointer border flex items-center gap-1.5',
                  datePreset === 'custom'
                    ? 'bg-brand text-inverse border-brand shadow-xs'
                    : 'bg-surface text-muted border-border hover:border-brand-border'
                )}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>날짜 직접 선택</span>
              </button>
            </div>

            {/* 날짜 직접 선택 인라인 패널 (아코디언 토글) */}
            {isDatePickerOpen && (
              <div className="p-4 rounded-2xl bg-surface border border-brand-border shadow-xs mt-2 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">근무 희망 기간 설정</span>
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(false)}
                    className="text-xs text-muted hover:text-ink"
                  >
                    닫기
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-muted mb-1 font-medium">시작일</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-canvas text-ink font-semibold focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-muted mb-1 font-medium">종료일</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-canvas text-ink font-semibold focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!customStartDate || !customEndDate || customStartDate > customEndDate}
                  onClick={() => {
                    setDatePreset('custom');
                    setIsDatePickerOpen(false);
                  }}
                  className="w-full h-10 rounded-xl bg-brand hover:bg-brand-hover disabled:bg-disabled text-inverse font-bold text-xs transition-colors cursor-pointer"
                >
                  이 기간으로 검색하기
                </button>
              </div>
            )}
          </div>

          {/* 3. 행사 종류 칩 & 지역 칩 */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'min-h-[36px] px-3.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer border flex items-center gap-1',
                      isSelected
                        ? 'bg-brand-soft text-brand-strong border-brand-border'
                        : 'bg-surface text-muted border-border hover:border-brand-border'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 shrink-0" />}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {REGION_OPTIONS.map((reg) => {
                const isSelected = selectedRegion === reg.id;
                return (
                  <button
                    key={reg.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedRegion(reg.id)}
                    className={cn(
                      'min-h-[32px] px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer border',
                      isSelected
                        ? 'bg-brand-soft text-brand-strong border-brand-border'
                        : 'bg-surface text-muted border-border hover:border-brand-border'
                    )}
                  >
                    <span>{reg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. 활성화된 필터 조건 해제 칩 바 */}
          {(datePreset !== 'all' || selectedCategory !== 'all' || selectedRegion !== 'all') && (
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
              <span className="text-muted font-medium">적용된 조건:</span>

              {activeDateRange && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-subtle text-brand-strong font-semibold border border-brand-border">
                  <span>{activeDateRange.label}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDatePreset('all');
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="hover:text-ink cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface text-ink font-semibold border border-border">
                  <span>{CATEGORY_OPTIONS.find((c) => c.id === selectedCategory)?.label}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="hover:text-ink cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedRegion !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface text-ink font-semibold border border-border">
                  <span>{REGION_OPTIONS.find((r) => r.id === selectedRegion)?.label}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedRegion('all')}
                    className="hover:text-ink cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-muted hover:text-ink underline ml-1 cursor-pointer"
              >
                전체 초기화
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 5. 공고 피드 메인 목록 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-ink">
            조건에 맞는 현장 <span className="text-brand tabular-nums">{filteredAndSortedEvents.length}</span>개
          </p>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-order-select" className="sr-only">
              정렬 기준
            </label>
            <div className="relative inline-flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted absolute left-2.5 pointer-events-none" />
              <select
                id="sort-order-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="h-9 pl-8 pr-6 text-xs font-semibold bg-surface border border-border rounded-lg text-ink focus:outline-none focus:border-brand cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 빈 검색 결과 안내 */}
        {filteredAndSortedEvents.length === 0 ? (
          <div className="py-20 text-center bg-surface rounded-3xl border border-border-subtle p-6 max-w-lg mx-auto">
            <p className="text-base font-bold text-ink mb-1">선택한 날짜나 조건에 맞는 현장이 아직 없어요</p>
            <p className="text-xs text-muted mb-5">날짜 범위를 넓히거나 필터를 초기화해 보세요.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-border bg-surface text-ink text-xs font-bold hover:bg-canvas transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>조건 전체 초기화</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAndSortedEvents.map((item) => {
              const deadlineInfo = getDeadlineInfo(item.deadlineDate);

              return (
                <Link
                  key={item.id}
                  href={`/events/${item.id}`}
                  className="group bg-surface rounded-3xl border border-border hover:border-brand-border transition-all duration-180 p-5 flex flex-col justify-between cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <div>
                    {/* 카드 상단: 카테고리/지역 & 2단 지원 마감 배지 */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted font-medium truncate pt-1">
                        <span>{item.categoryLabel}</span>
                        <span className="text-border-subtle">·</span>
                        <span className="text-ink font-semibold">{item.regionLabel}</span>
                        {item.stationInfo && (
                          <>
                            <span className="text-border-subtle">·</span>
                            <span className="truncate">{item.stationInfo}</span>
                          </>
                        )}
                      </div>

                      {/* 2단(상/하) 지원 마감 배지 컨테이너 */}
                      <div className="flex flex-col items-end shrink-0 text-right bg-brand-soft border border-brand-border rounded-xl px-2.5 py-1 shadow-2xs">
                        <span className="text-[11px] font-medium text-muted leading-tight">
                          {deadlineInfo.dateLabel}
                        </span>
                        <span className="text-xs font-bold text-brand-strong leading-tight mt-0.5">
                          {deadlineInfo.dDayLabel}
                        </span>
                      </div>
                    </div>

                    {/* 공고 제목 */}
                    <h2 className="text-base sm:text-lg font-bold text-ink leading-snug group-hover:text-brand-strong transition-colors line-clamp-2 break-keep mb-3">
                      {item.displayTitle}
                    </h2>

                    {/* 일시 및 시간 */}
                    <div className="space-y-1.5 text-xs text-muted mb-3.5">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="font-medium text-ink">{item.dateRangeLabel}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span>{item.workHoursLabel}</span>
                      </div>
                    </div>

                    {/* 주요 업무 태그 */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {item.primaryRoles.map((role) => (
                        <span
                          key={role}
                          className="px-2 py-0.5 rounded-md bg-brand text-white text-xs font-bold"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 카드 하단: 하루 보수 3D 클레이 돈 보따리 & 주최사 정보 */}
                  <div className="pt-3 border-t border-border-subtle flex items-end justify-between">
                    <div className="flex items-center gap-2.5">
                      <ClayMoneyBag3D className="w-10 h-10 sm:w-11 sm:h-11" />
                      <div>
                        <p className="text-xs text-muted">하루 보수 · 세전</p>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-lg sm:text-xl font-extrabold text-ink tabular-nums">
                            {item.dailyWageWon.toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-ink">원</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted truncate max-w-[120px] sm:max-w-[150px]">
                        {item.hostName}
                      </p>
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-brand group-hover:text-brand-strong mt-0.5">
                        <span>상세보기</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* 6. 이용 안내 배너 */}
        <section className="mt-10 p-5 rounded-3xl bg-surface border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-brand shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-ink">
                지원부터 정산까지, 흐름을 확인해요
              </p>
              <p className="text-xs text-muted mt-0.5 break-keep">
                업무와 보수는 계약에서, 공제 내역은 정산 화면에서 투명하게 확인해요.
              </p>
            </div>
          </div>
          <Link
            href="/guide"
            className="text-xs font-bold text-brand hover:text-brand-strong flex items-center gap-1 shrink-0"
          >
            <span>이용 방법 보기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </section>

        {/* 7. 전략 A 반영 푸터 (주최사 B2B 진입로 작게 배치) */}
        <footer className="mt-12 pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <p>© 2026 CrewLink. 행사와 크루를 잇다.</p>
          <Link
            href="/biz"
            className="text-muted hover:text-ink hover:underline transition-colors font-medium"
          >
            기업 주최사 센터 바로가기 &rarr;
          </Link>
        </footer>
      </main>

      {/* 8. 모바일 4탭 하단 내비게이션 바 */}
      <MobileBottomNav />
    </div>
  );
}