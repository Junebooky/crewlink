'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Check,
  Building2,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 현재 기준 시각: 2026-10-09 KST
const CURRENT_DATE_STR = '2026-10-09';

export type EventCategory = 'popup' | 'expo' | 'brand' | 'festival';
export type RecruitmentStatus = 'OPEN' | 'CLOSING_SOON' | 'CLOSED';

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
  startDate: string;
  endDate: string;
  dateRangeLabel: string;
  workHoursLabel: string;
  isMultiDayRequired: boolean;
  dailyWageWon: number;
  requiredCount: number;
  confirmedCount: number;
  deadlineDate: string;
  recruitmentStatus: RecruitmentStatus;
  primaryRoles: string[];
  createdAt: string;
}

// 검증된 샘플 피드 데이터 (실제 서비스에서는 백엔드 Public DTO와 연동)
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
    endDate: '2026-10-18',
    dateRangeLabel: '10.16–10.18 · 3일간',
    workHoursLabel: '11:00–20:00',
    isMultiDayRequired: true,
    dailyWageWon: 120000,
    requiredCount: 6,
    confirmedCount: 2,
    deadlineDate: '2026-10-14',
    recruitmentStatus: 'CLOSING_SOON',
    primaryRoles: ['관람객 안내', 'POS 결제', '사은품 배부'],
    createdAt: '2026-10-08T09:00:00Z',
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
    endDate: '2026-10-25',
    dateRangeLabel: '10.22–10.25 · 4일간',
    workHoursLabel: '09:00–18:00',
    isMultiDayRequired: true,
    dailyWageWon: 135000,
    requiredCount: 8,
    confirmedCount: 3,
    deadlineDate: '2026-10-18',
    recruitmentStatus: 'OPEN',
    primaryRoles: ['VIP 라운지', '외국어 응대', '등록 데스크'],
    createdAt: '2026-10-09T03:00:00Z',
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
    endDate: '2026-10-25',
    dateRangeLabel: '10.19–10.25 · 7일간',
    workHoursLabel: '10:00–20:00',
    isMultiDayRequired: false,
    dailyWageWon: 130000,
    requiredCount: 4,
    confirmedCount: 1,
    deadlineDate: '2026-10-15',
    recruitmentStatus: 'OPEN',
    primaryRoles: ['대기열 안내', '이벤트 진행', 'SNS 인증 확인'],
    createdAt: '2026-10-07T12:00:00Z',
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
    isMultiDayRequired: true,
    dailyWageWon: 105000,
    requiredCount: 3,
    confirmedCount: 0,
    deadlineDate: '2026-10-24',
    recruitmentStatus: 'OPEN',
    primaryRoles: ['명찰 배부', '동선 안내'],
    createdAt: '2026-10-06T15:00:00Z',
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

// 마감일까지 남은 일수 계산 함수 (기준일: 2026-10-09)
function calculateDeadlineDDay(deadlineStr: string): string {
  const current = new Date(`${CURRENT_DATE_STR}T00:00:00Z`);
  const deadline = new Date(`${deadlineStr}T00:00:00Z`);
  const diffDays = Math.ceil((deadline.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return '오늘 마감';
  if (diffDays <= 3) return `마감 D-${diffDays}`;
  return `지원 마감 ${deadlineStr.slice(5).replace('-', '.')}`;
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | EventCategory>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close custom dropdown on outside click or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSortDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isSortDropdownOpen) {
        setIsSortDropdownOpen(false);
      }
    }
    if (isSortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSortDropdownOpen]);

  const filteredAndSortedEvents = useMemo(() => {
    return EVENT_FEED_DATA.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchReg = selectedRegion === 'all' || item.regionId === selectedRegion;

      const trimmedQuery = searchKeyword.trim().toLowerCase();
      const matchSearch =
        !trimmedQuery ||
        item.title.toLowerCase().includes(trimmedQuery) ||
        item.displayTitle.toLowerCase().includes(trimmedQuery) ||
        item.hostName.toLowerCase().includes(trimmedQuery) ||
        item.regionLabel.toLowerCase().includes(trimmedQuery) ||
        (item.stationInfo && item.stationInfo.toLowerCase().includes(trimmedQuery)) ||
        item.primaryRoles.some((role) => role.toLowerCase().includes(trimmedQuery));

      return matchCat && matchReg && matchSearch;
    }).sort((a, b) => {
      if (sortOrder === 'deadline') {
        return a.deadlineDate.localeCompare(b.deadlineDate);
      }
      if (sortOrder === 'wage_desc') {
        return b.dailyWageWon - a.dailyWageWon;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [selectedCategory, selectedRegion, sortOrder, searchKeyword]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedRegion('all');
    setSortOrder('latest');
    setSearchKeyword('');
    setIsSortDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink pb-20">
      {/* 1. 브랜드 헤더 및 행사 요청 안내 영역 */}
      <section className="bg-surface border-b border-border-subtle pt-6 pb-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-bold text-muted tracking-wider uppercase mb-1">
                행사와 크루를 잇다
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                지금, 함께할 현장
              </h1>
              <p className="text-sm text-muted mt-1.5 break-keep">
                날짜와 장소, 보수를 확인하고 나에게 맞는 현장을 찾아보세요.
              </p>
            </div>

            {/* 행사 담당자 안내 박스 (단일화된 명확한 진입로) */}
            <div className="sm:self-end p-3.5 sm:p-4 rounded-2xl bg-brand-subtle border border-brand-border flex items-center justify-between sm:justify-start gap-3">
              <div>
                <p className="text-xs text-muted">함께할 크루가 필요하세요?</p>
                <p className="text-xs font-bold text-ink">표준 계약과 운영 대행</p>
              </div>
              <Link
                href="/client/request"
                className="min-h-[44px] sm:min-h-[48px] px-4 rounded-xl bg-brand hover:bg-brand-hover text-inverse text-xs sm:text-sm font-bold flex items-center gap-1 transition-colors shrink-0 shadow-xs"
              >
                <span>행사 요청하기</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 2. 검색 인풋 (접근성 라벨 & 52px 높이) */}
          <div className="relative mb-3">
            <label htmlFor="event-search-input" className="sr-only">
              행사, 지역, 업무 검색
            </label>
            <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="event-search-input"
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="행사, 지역, 업무로 검색 (예: 성수, 코엑스, POS)"
              className="w-full h-[52px] pl-11 pr-4 rounded-2xl border border-border bg-surface text-ink text-base focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-xs transition-colors"
            />
          </div>

          {/* 3. 행사 종류 탭 필터 (선택 칩 UI) */}
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
                    'min-h-[40px] px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold shrink-0 transition-colors cursor-pointer border flex items-center gap-1',
                    isSelected
                      ? 'bg-brand-soft text-brand-strong border-brand-border'
                      : 'bg-surface text-muted border-border hover:border-brand-border'
                  )}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* 4. 지역 선택 칩 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 scrollbar-none">
            {REGION_OPTIONS.map((reg) => {
              const isSelected = selectedRegion === reg.id;
              return (
                <button
                  key={reg.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedRegion(reg.id)}
                  className={cn(
                    'min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer border',
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
      </section>

      {/* 5. 공고 피드 메인 목록 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {/* 결과 수 및 정렬 컨트롤 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-ink">
            조건에 맞는 현장 <span className="text-brand tabular-nums">{filteredAndSortedEvents.length}</span>개
          </p>

          {/* 브랜드 커스텀 드롭다운 */}
          <div ref={sortDropdownRef} className="relative inline-block text-left">
            <button
              type="button"
              id="sort-order-button"
              aria-haspopup="listbox"
              aria-expanded={isSortDropdownOpen}
              onClick={() => setIsSortDropdownOpen((prev) => !prev)}
              className={cn(
                'h-10 px-3 sm:px-3.5 bg-surface border rounded-xl text-xs sm:text-sm font-bold text-ink inline-flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-2xs hover:bg-canvas',
                isSortDropdownOpen
                  ? 'border-brand ring-2 ring-brand/10 text-brand shadow-xs'
                  : 'border-border hover:border-brand-border'
              )}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-brand shrink-0" />
              <span>{SORT_OPTIONS.find((opt) => opt.id === sortOrder)?.label}</span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 text-muted transition-transform duration-200 ease-out',
                  isSortDropdownOpen && 'rotate-180 text-brand'
                )}
              />
            </button>

            {/* 펼쳐지는 스무스 드롭다운 메뉴 */}
            <div
              role="listbox"
              aria-labelledby="sort-order-button"
              className={cn(
                'absolute right-0 top-full mt-2 w-44 sm:w-48 bg-surface/98 backdrop-blur-md border border-border rounded-2xl p-1.5 shadow-lg shadow-black/8 z-30 origin-top-right transition-all duration-200 ease-out',
                isSortDropdownOpen
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              )}
            >
              <div className="px-2.5 py-1 text-[11px] font-bold text-muted border-b border-border-subtle mb-1">
                정렬 방식
              </div>
              {SORT_OPTIONS.map((opt) => {
                const isSelected = sortOrder === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setSortOrder(opt.id);
                      setIsSortDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 text-left cursor-pointer',
                      isSelected
                        ? 'bg-brand-soft text-brand-strong font-bold'
                        : 'text-ink hover:bg-surface-muted hover:text-ink'
                    )}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-brand-strong shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 빈 검색 결과 안내 */}
        {filteredAndSortedEvents.length === 0 ? (
          <div className="py-20 text-center bg-surface rounded-3xl border border-border-subtle p-6 max-w-lg mx-auto">
            <p className="text-base font-bold text-ink mb-1">찾는 현장이 아직 없어요</p>
            <p className="text-xs text-muted mb-5">검색어나 필터를 바꿔보세요.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-border bg-surface text-ink text-xs font-bold hover:bg-canvas transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>필터 초기화</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAndSortedEvents.map((item) => {
              const deadlineLabel = calculateDeadlineDDay(item.deadlineDate);

              return (
                <Link
                  key={item.id}
                  href={`/events/${item.id}`}
                  className="group bg-surface rounded-3xl border border-border hover:border-brand-border transition-all duration-180 p-5 flex flex-col justify-between cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <div>
                    {/* 카드 상단: 카테고리/지역 & 마감 기한 */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted font-medium truncate">
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

                      <span className="px-2 py-0.5 rounded-md bg-brand-soft text-brand-strong text-xs font-bold border border-brand-border shrink-0">
                        {deadlineLabel}
                      </span>
                    </div>

                    {/* 공고 제목 */}
                    <h2 className="text-base sm:text-lg font-bold text-ink leading-snug group-hover:text-brand-strong transition-colors line-clamp-2 break-keep mb-3">
                      {item.displayTitle}
                    </h2>

                    {/* 일시 및 시간 */}
                    <div className="space-y-1.5 text-xs text-muted mb-3.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
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
                          className="px-2 py-0.5 rounded-md bg-surface-muted text-muted text-xs font-medium border border-border-subtle"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 카드 하단: 하루 보수 & 주최사 정보 */}
                  <div className="pt-3 border-t border-border-subtle flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted">하루 보수 · 세전</p>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-lg sm:text-xl font-extrabold text-ink tabular-nums">
                          {item.dailyWageWon.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-ink">원</span>
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

        {/* 6. 지원 및 정산 절차 안내 배너 */}
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
      </main>
    </div>
  );
}