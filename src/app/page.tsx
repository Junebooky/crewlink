'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar as CalendarIcon,
  Clock,
  Search,
  Check,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  ArrowUpDown,
  RotateCcw,
  X,
  CalendarRange,
  Heart,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PublicHeader } from '@/components/common/PublicHeader';
import { MobileBottomNav } from '@/components/common/MobileBottomNav';
import { EventMapExplorer } from '@/components/explore/EventMapExplorer';
import {
  getPublicEvents,
  type EventCategory,
  type RecruitmentStatus,
  type EventItem,
} from '@/lib/data/events';
import {
  getKSTDateString,
  getTodayTomorrowRange,
  getThisWeekendRange,
  getNextWeekRange,
  checkDateOverlap,
  getDeadlineInfo,
} from '@/lib/utils/date';

import {
  DatePreset,
  ROLLING_PLACEHOLDERS,
  ROLLING_INTERVAL_MS,
  ROLLING_DURATION_MS,
} from '@/lib/search/rollingPlaceholder';
import { getCategoryFallbackImage } from '@/lib/utils/eventImages';

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

export default function HomePage() {
  const [events, setEvents] = useState<EventItem[]>(() => getPublicEvents());

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          if (data.events && Array.isArray(data.events)) {
            setEvents(data.events);
          }
        }
      } catch (err) {
        console.error('Failed to load events from DB:', err);
      }
    }
    loadEvents();
  }, []);

  // KST dynamic date state
  const [currentKST, setCurrentKST] = useState<string>('2026-10-12');

  useEffect(() => {
    setCurrentKST(getKSTDateString());
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<'all' | EventCategory>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  // 토스 스타일 부드러운 슬라이드 다운 롤링 플레이스홀더 (3.6초 주기 순환, 450ms 감속 이징)
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [prevPlaceholderIndex, setPrevPlaceholderIndex] = useState<number | null>(null);

  useEffect(() => {
    if (searchKeyword.length > 0) {
      setPrevPlaceholderIndex(null);
      return;
    }

    const interval = setInterval(() => {
      setPlaceholderIndex((current) => {
        setPrevPlaceholderIndex(current);
        return (current + 1) % ROLLING_PLACEHOLDERS.length;
      });
    }, ROLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [searchKeyword]);

  // 이전 문구 퇴장 애니메이션 완료 후(450ms) 정리
  useEffect(() => {
    if (prevPlaceholderIndex === null) return;

    const timer = setTimeout(() => {
      setPrevPlaceholderIndex(null);
    }, ROLLING_DURATION_MS);

    return () => clearTimeout(timer);
  }, [prevPlaceholderIndex]);

  // 정렬 드롭다운 바깥 영역 클릭 및 ESC 키 입력 시 닫힘 처리
  useEffect(() => {
    if (!isSortDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSortDropdownOpen]);

  // KST 동적 날짜 필터링 범위 계산
  const activeDateRange = useMemo<{ start: string; end: string; label: string } | null>(() => {
    if (datePreset === 'all') return null;
    if (datePreset === 'today_tomorrow') {
      return getTodayTomorrowRange(currentKST);
    }
    if (datePreset === 'this_weekend') {
      return getThisWeekendRange(currentKST);
    }
    if (datePreset === 'next_week') {
      return getNextWeekRange(currentKST);
    }
    if (datePreset === 'custom' && customStartDate && customEndDate) {
      return {
        start: customStartDate,
        end: customEndDate,
        label: `${customStartDate.slice(5).replace('-', '.')}~${customEndDate.slice(5).replace('-', '.')}`,
      };
    }
    return null;
  }, [datePreset, customStartDate, customEndDate, currentKST]);

  // 필터링 & 정렬 연산
  const filteredAndSortedEvents = useMemo(() => {
    return events
      .filter((item) => {
        const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
        const matchReg = selectedRegion === 'all' || item.regionId === selectedRegion;

        let matchDate = true;
        if (activeDateRange) {
          matchDate = checkDateOverlap(
            item.startDate,
            item.endDate,
            activeDateRange.start,
            activeDateRange.end
          );
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
      })
      .sort((a, b) => {
        if (sortOrder === 'deadline') {
          return a.deadlineDate.localeCompare(b.deadlineDate);
        }
        if (sortOrder === 'wage_desc') {
          return b.dailyWageWon - a.dailyWageWon;
        }
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [events, selectedCategory, selectedRegion, activeDateRange, sortOrder, searchKeyword]);

  // 1. 지금 핫한 공고 (상위 4개 슬라이스)
  const hotEvents = useMemo(() => {
    return events.slice(0, 4);
  }, [events]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedRegion('all');
    setDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortOrder('latest');
    setSearchKeyword('');
  };

  const currentSortLabel = SORT_OPTIONS.find((opt) => opt.id === sortOrder)?.label || '최신순';

  return (
    <div className="min-h-screen bg-white text-ink flex flex-col pb-[calc(76px+env(safe-area-inset-bottom,0px))] md:pb-12">
      {/* 1. 크루 중심 퍼블릭 헤더 */}
      <PublicHeader className="bg-white/95 border-b border-border/40 backdrop-blur-md" />

      {/* 2. 상단 히어로 섹션 (16:9 hero_white.png 황금 분할 + 검색창 + 필터) */}
      <section className="pt-2 sm:pt-4 pb-5 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* 히어로 배너: 16:9 투명 배경 에셋 (hero_white.png) 황금 분할 배치 */}
          <section className="relative w-full overflow-hidden bg-white min-h-[200px] sm:min-h-[250px] md:min-h-[280px] flex items-center px-4 sm:px-6 lg:px-8 mb-6">
            {/* 좌측: 텍스트 영역 (여백 공간 활용) */}
            <div className="relative z-10 max-w-[48%] sm:max-w-[48%] md:max-w-[46%] py-4 text-left">
              <span className="text-xs sm:text-sm font-bold text-brand tracking-tight">
                지금, 새로운 현장이 기다려요
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-ink tracking-tight mt-1 leading-snug break-keep">
                좋은 사람들과<br />멋진 현장을 만들어봐요
              </h1>
              <p className="text-xs sm:text-sm font-medium text-muted mt-2 break-keep line-clamp-2">
                행사·전시·콘서트·페스티벌까지 다양한 크루 공고를 한눈에!
              </p>
            </div>

            {/* 우측: 16:9 투명 배경 3D 일러스트 (텍스트 높이와 1:1 매칭, 좌측/상하 확장) */}
            <div className="absolute right-1 sm:right-3 md:right-6 top-1/2 -translate-y-1/2 h-[145px] sm:h-[185px] md:h-[220px] aspect-[16/9] w-auto pointer-events-none z-0">
              <Image
                alt="CrewLink 3D Hero"
                className="object-contain object-right"
                fill
                priority
                src="/assets/clay/hero_white.png"
              />
            </div>
          </section>

          {/* 52px 높이 표준 검색 인풋 (토스풍 입체감 그림자) */}
          <div className="relative pt-1">
            <label htmlFor="event-search-input" className="sr-only">
              행사, 지역, 업무 검색
            </label>
            <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <input
              id="event-search-input"
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder=""
              aria-label="행사, 지역, 업무 검색"
              className="w-full h-[52px] pl-11 pr-4 rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-border/50 text-ink text-base focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
            />
            {/* 토스 스타일 부드러운 슬라이드 다운 롤링 플레이스홀더 */}
            {searchKeyword.length === 0 && (
              <div
                aria-hidden="true"
                className="absolute left-11 right-4 top-0 bottom-0 pointer-events-none flex items-center overflow-hidden select-none"
              >
                <div className="relative w-full h-6 sm:h-7 overflow-hidden flex items-center">
                  {prevPlaceholderIndex !== null && (
                    <span
                      key={`prev-${prevPlaceholderIndex}`}
                      className="absolute inset-0 flex items-center text-sm sm:text-base text-muted truncate pointer-events-none animate-rolling-out translate-y-3 opacity-0 duration-[450ms]"
                    >
                      {ROLLING_PLACEHOLDERS[prevPlaceholderIndex]}
                    </span>
                  )}
                  <span
                    key={`curr-${placeholderIndex}`}
                    className="absolute inset-0 flex items-center text-sm sm:text-base text-muted truncate pointer-events-none animate-rolling-in translate-y-0 opacity-100 duration-[450ms]"
                  >
                    {ROLLING_PLACEHOLDERS[placeholderIndex]}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 날짜 퀵 필터 바 */}
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
                        ? 'bg-brand text-white border-brand shadow-xs'
                        : 'bg-white text-muted border-border/40 hover:border-brand/40 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
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
                    ? 'bg-brand text-white border-brand shadow-xs'
                    : 'bg-white text-muted border-border/40 hover:border-brand/40 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                )}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>날짜 직접 선택</span>
              </button>
            </div>

            {/* 날짜 직접 선택 인라인 패널 */}
            {isDatePickerOpen && (
              <div className="p-4 rounded-2xl bg-white border border-border/50 shadow-[0_8px_30px_rgba(0,0,0,0.06)] mt-2 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">근무 희망 기간 설정</span>
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(false)}
                    className="text-xs text-muted hover:text-ink cursor-pointer"
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
                  className="w-full h-10 rounded-xl bg-brand hover:bg-brand-hover disabled:bg-disabled text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  이 기간으로 검색하기
                </button>
              </div>
            )}
          </div>

          {/* 행사 종류 칩 & 지역 칩 */}
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
                        ? 'bg-brand text-white border-brand shadow-xs'
                        : 'bg-white text-muted border-border/40 hover:border-brand/40 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
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
                      'min-h-[36px] px-3.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer border flex items-center gap-1',
                      isSelected
                        ? 'bg-brand text-white border-brand shadow-xs'
                        : 'bg-white text-muted border-border/40 hover:border-brand/40 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 shrink-0" />}
                    <span>{reg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. 섹션 1: 🔥 지금 핫한 공고 (가로 스크롤 카드 형태) */}
      <section className="max-w-4xl w-full mx-auto px-4 sm:px-6 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">🔥</span>
            <h2 className="text-lg font-extrabold text-ink tracking-tight">지금 핫한 공고</h2>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-muted hover:text-ink flex items-center gap-0.5 cursor-pointer"
          >
            <span>전체보기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 가로 스크롤 스냅 카드 컨테이너 */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {hotEvents.map((item, idx) => {
            const isFav = !!favorites[item.id];
            const badgeText =
              idx === 0 ? '지금 모집중' : idx === 1 ? '인기 공고' : idx === 2 ? '신규 오픈' : 'HOT';

            return (
              <Link
                key={`hot-${item.id}`}
                href={`/events/${item.id}`}
                className="min-w-[240px] max-w-[260px] snap-start bg-white rounded-2xl border border-slate-200/80 shadow-[0_6px_20px_rgba(15,23,42,0.07)] overflow-hidden flex flex-col justify-between shrink-0 transition-all duration-200 hover:-translate-y-0.5 group"
              >
                {/* 상단 썸네일 */}
                <div className="h-28 w-full relative overflow-hidden bg-slate-100">
                  <Image
                    src={getCategoryFallbackImage(item.category, item.title)}
                    alt={item.title}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* 좌측 상단 뱃지 */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-brand font-extrabold text-[11px] shadow-2xs">
                      {badgeText}
                    </span>
                  </div>
                  {/* 우측 상단 찜하기 버튼 */}
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(e, item.id)}
                    className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-black/25 backdrop-blur-xs flex items-center justify-center text-white hover:text-error transition-colors cursor-pointer"
                    aria-label="찜하기"
                  >
                    <Heart
                      className={cn(
                        'w-4 h-4',
                        isFav ? 'fill-red-500 text-red-500' : 'fill-none text-white stroke-[2.2]'
                      )}
                    />
                  </button>
                </div>

                {/* 하단 본문 */}
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="font-bold text-ink text-sm truncate group-hover:text-brand transition-colors">
                      {item.displayTitle}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted mt-1 truncate">
                      <span className="flex items-center gap-1 shrink-0">
                        <CalendarIcon className="w-3 h-3 text-muted shrink-0" />
                        <span>{item.startDate.slice(5).replace('-', '.')}</span>
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-muted shrink-0" />
                        <span className="truncate">{item.regionLabel}</span>
                      </span>
                    </div>
                  </div>

                  {/* 하루 일당 표시 (3D 코인 /assets/clay/coin.png + 볼드 금액) */}
                  <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-border-subtle">
                    <Image
                      src="/assets/clay/coin.png"
                      alt="하루 일당"
                      width={20}
                      height={20}
                      className="w-5 h-5 object-contain shrink-0"
                    />
                    <span className="text-base sm:text-lg font-black text-black tabular-nums">
                      {item.dailyWageWon.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-black">원</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 하단 페이지 인디케이터 도트 */}
        <div className="flex items-center justify-center gap-1.5 mt-2.5 mb-5">
          <div className="w-1.5 h-1.5 rounded-full bg-brand" />
          <div className="w-1.5 h-1.5 rounded-full bg-brand/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-brand/30" />
        </div>
      </section>

      {/* 4. 섹션 2: 방금 올라왔어요 (헤더바 리팩토링) */}
      <section className="max-w-4xl w-full mx-auto px-4 sm:px-6 pt-2 pb-2">
        <div className="flex items-center justify-between mb-3 px-1">
          {/* 좌측: 타이틀 + 카운트 뱃지 */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <span className="text-base sm:text-lg">✨</span>
              <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight whitespace-nowrap">
                방금 올라왔어요
              </h2>
            </div>
            <span className="bg-brand-soft/50 text-brand-strong text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
              {filteredAndSortedEvents.length}개
            </span>
            {/* 필터 활성화 시 리셋 버튼 */}
            {(selectedCategory !== 'all' ||
              selectedRegion !== 'all' ||
              datePreset !== 'all' ||
              searchKeyword) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-6 px-2 rounded-full bg-white text-muted hover:text-ink text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>초기화</span>
                </button>
              )}
            {/* 활성 날짜 뱃지 */}
            {activeDateRange && (
              <span className="h-6 px-2 rounded-full bg-brand-soft text-brand-strong border border-brand-border text-[11px] font-semibold flex items-center gap-1 shrink-0">
                <span>{activeDateRange.label}</span>
                <button
                  type="button"
                  onClick={() => setDatePreset('all')}
                  className="hover:text-ink cursor-pointer"
                  aria-label="날짜 필터 제거"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>

          {/* 우측: [최신순 | 지도형] 단일 세그먼트 + [추천순 ∨] 독립 버튼 */}
          <div className="flex items-center shrink-0">
            {/* [최신순 | 지도형] 세그먼트 */}
            <div className="bg-slate-100 p-1 rounded-full flex items-center text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setSortOrder('latest');
                  setViewMode('list');
                }}
                className={cn(
                  "rounded-full transition-all cursor-pointer",
                  sortOrder === 'latest' && viewMode === 'list'
                    ? "bg-brand text-white font-bold px-3 py-1 shadow-xs"
                    : "text-muted hover:text-ink px-2.5 py-1"
                )}
              >
                최신순
              </button>
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                className={cn(
                  "rounded-full transition-all cursor-pointer",
                  viewMode === 'map'
                    ? "bg-brand text-white font-bold px-3 py-1 shadow-xs"
                    : "text-muted hover:text-ink px-2.5 py-1"
                )}
              >
                지도형
              </button>
            </div>

            {/* [추천순 ∨] 별도 독립 버튼 */}
            <div ref={sortDropdownRef} className="relative ml-1.5">
              <button
                type="button"
                onClick={() => setIsSortDropdownOpen((prev) => !prev)}
                className={cn(
                  "bg-white border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold text-muted hover:text-ink shadow-2xs flex items-center gap-1 transition-colors cursor-pointer",
                  sortOrder !== 'latest' && viewMode === 'list' && "border-brand text-brand font-bold"
                )}
              >
                <span>
                  {sortOrder === 'wage_desc' ? '보수순' : sortOrder === 'deadline' ? '마감순' : '추천순'}
                </span>
                <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", isSortDropdownOpen && "rotate-180")} />
              </button>

              {isSortDropdownOpen && (
                <div
                  role="listbox"
                  className="absolute right-0 top-full mt-1.5 z-30 w-36 p-1.5 rounded-2xl border border-border bg-white shadow-lg animate-in fade-in zoom-in-95 duration-150"
                >
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
                          setViewMode('list');
                          setIsSortDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full text-xs font-semibold rounded-xl px-3 py-2 text-ink hover:bg-brand-soft hover:text-brand-strong cursor-pointer flex items-center justify-between transition-colors',
                          isSelected && 'bg-brand-soft text-brand-strong font-bold'
                        )}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. 공고 콘텐츠 영역 (목록형 or 지도형) */}
      {viewMode === 'map' ? (
        <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-2 flex-1">
          <EventMapExplorer events={filteredAndSortedEvents} currentKST={currentKST} />
        </main>
      ) : (
        <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 pt-1 flex-1">
          {filteredAndSortedEvents.length === 0 ? (
            <div className="py-20 text-center rounded-3xl bg-white border border-border/40 space-y-3 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
              <p className="text-base font-bold text-ink">선택한 조건의 모집 공고가 없어요</p>
              <p className="text-xs text-muted break-keep">
                날짜나 지역, 검색어 조건을 변경하거나 필터를 초기화해 보세요.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-10 px-5 rounded-2xl bg-brand text-white text-xs font-bold hover:bg-brand-hover transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                <span>전체 공고 보기</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredAndSortedEvents.map((item) => {
                const deadlineInfo = getDeadlineInfo(item.deadlineDate, currentKST);
                const isFav = !!favorites[item.id];

                return (
                  <Link
                    key={item.id}
                    href={`/events/${item.id}`}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.12)] p-4 sm:p-4.5 mb-3.5 flex flex-col gap-3 transition-all duration-200 group block"
                  >
                    {/* [상단 영역]: 썸네일 + 기본 정보 */}
                    <div className="flex items-start gap-3.5">
                      {/* 썸네일 이미지 (D-day 브랜드 블루 단일화) */}
                      <div className="w-24 h-24 rounded-2xl overflow-hidden relative shrink-0 bg-slate-100">
                        <Image
                          src={getCategoryFallbackImage(item.category, item.title)}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-brand text-white text-[11px] font-bold shadow-xs">
                          {deadlineInfo.dDayLabel || '신규'}
                        </span>
                      </div>

                      {/* 우측 텍스트 (위치, 제목, 날짜, 시간) */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-0.5">
                        {/* 1줄: 카테고리 · 위치 + 찜 */}
                        <div className="flex items-center justify-between text-xs text-muted font-medium">
                          <span className="truncate">{item.categoryLabel} · {item.regionLabel}</span>
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(e, item.id)}
                            className="text-muted hover:text-error transition-colors shrink-0 p-1 -mr-1"
                            aria-label="찜하기"
                          >
                            <Heart
                              className={cn(
                                'w-4 h-4',
                                isFav ? 'fill-red-500 text-red-500' : 'fill-none text-muted'
                              )}
                            />
                          </button>
                        </div>

                        {/* 2줄: 행사 제목 */}
                        <h3 className="text-sm font-bold text-ink truncate leading-snug group-hover:text-brand transition-colors">
                          {item.displayTitle}
                        </h3>

                        {/* 3줄: 날짜 */}
                        <div className="text-xs text-muted font-medium flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-muted/70 shrink-0" />
                          <span className="truncate">{item.dateRangeLabel}</span>
                        </div>

                        {/* 4줄: 시간 (기존 태그 자리를 채움) */}
                        <div className="text-xs text-muted font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-muted/70 shrink-0" />
                          <span className="truncate">{item.workHoursLabel}</span>
                        </div>
                      </div>
                    </div>

                    {/* [하단 영역]: 썸네일 아래 전체 가로 폭을 활용한 태그 & 금액 */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      {/* 좌측: 직무 능력 태그들 (가로 인라인 나열) */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar">
                        {item.primaryRoles.map((tag) => (
                          <span
                            key={tag}
                            className="bg-brand-soft/40 text-brand-strong text-[11px] font-semibold px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* 우측: 코인 에셋 + 금액 (절대 겹침 없이 넓게 고정) */}
                      <div className="shrink-0 flex items-center gap-1.5 ml-2">
                        <Image
                          src="/assets/clay/coin.png"
                          alt="일당"
                          width={20}
                          height={20}
                          className="w-5 h-5 object-contain shrink-0"
                        />
                        <span className="text-ink font-black text-sm sm:text-base tracking-tight whitespace-nowrap">
                          {item.dailyWageWon.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* 6. 이용 안내 배너 & 푸터 */}
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6">
        <section className="mt-10 p-5 rounded-3xl bg-white border border-border/40 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-brand shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-ink">지원부터 정산까지, 흐름을 확인해요</p>
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

        <footer className="mt-12 pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <p>© 2026 CrewLink. 행사와 크루를 잇다.</p>
          <Link
            href="/biz"
            className="text-muted hover:text-ink hover:underline transition-colors font-medium"
          >
            기업 주최사 센터 바로가기 &rarr;
          </Link>
        </footer>
      </div>

      {/* 7. 모바일 4탭 하단 내비게이션 바 */}
      <MobileBottomNav />
    </div>
  );
}