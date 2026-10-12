'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PublicHeader } from '@/components/common/PublicHeader';
import { MobileBottomNav } from '@/components/common/MobileBottomNav';
import { FloatingClayCoin3D } from '@/components/assets/FloatingClayCoin3D';
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

export type DatePreset = 'all' | 'today_tomorrow' | 'this_weekend' | 'next_week' | 'custom';
export type { EventCategory, RecruitmentStatus, EventItem as EventListItem };

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
  const events = useMemo(() => getPublicEvents(), []);

  // KST dynamic date state - initialized with stable base date during SSR, hydrated in useEffect
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

        // 날짜 조건 일치 확인
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
    <div className="min-h-screen bg-canvas text-ink flex flex-col pb-20 md:pb-12">
      {/* 1. 크루 중심 퍼블릭 헤더 */}
      <PublicHeader />

      {/* 2. 상단 타이틀 & 검색 바 */}
      <section className="bg-surface border-b border-border-subtle pt-6 pb-5 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div>
            <p className="text-xs font-bold text-muted tracking-wider uppercase mb-1">
              지금 모집 중인 현황
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              어떤 현장으로 가볼까요?
            </h1>
            <p className="text-sm text-muted mt-1 break-keep">
              날짜와 장소만 고르면 딱 맞는 일이 기다려요.
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

          {/* 2. 날짜 퀵 필터 바 (한 손 조작 최적화) */}
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
                      'min-h-[36px] px-3.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer border flex items-center gap-1',
                      isSelected
                        ? 'bg-brand-soft text-brand-strong border-brand-border'
                        : 'bg-surface text-muted border-border hover:border-brand-border'
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

      {/* 4. 활성 필터 태그 & 커스텀 정렬 드롭다운 헤더 */}
      <section className="max-w-4xl w-full mx-auto px-4 sm:px-6 pt-5 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 활성 필터 리셋 & 칩 표시 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-muted mr-1">
              총 <span className="text-brand font-black">{filteredAndSortedEvents.length}</span>개의 현장
            </span>

            {/* 필터 활성화 시 리셋 버튼 */}
            {(selectedCategory !== 'all' ||
              selectedRegion !== 'all' ||
              datePreset !== 'all' ||
              searchKeyword) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-7 px-2.5 rounded-full bg-surface-muted hover:bg-border text-muted hover:text-ink text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>초기화</span>
                </button>
              )}

            {/* 활성 날짜 뱃지 */}
            {activeDateRange && (
              <span className="h-7 px-2.5 rounded-full bg-brand-soft text-brand-strong border border-brand-border text-xs font-semibold flex items-center gap-1">
                <span>{activeDateRange.label}</span>
                <button
                  type="button"
                  onClick={() => setDatePreset('all')}
                  className="hover:text-ink cursor-pointer"
                  aria-label="날짜 필터 제거"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {/* Task 1 & Task 4: 보기 모드 전환 토글 & 커스텀 정렬 드롭다운 헤더 */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* 보기 모드 전환 토글 탭 [ 목록형 | 지도형 ] - 슬라이딩 인디케이터 */}
            <div
              role="tablist"
              aria-label="공고 보기 방식 선택"
              className="relative flex items-center p-1 bg-white/90 rounded-2xl border border-border-subtle select-none h-9"
            >
              {/* 브랜드 색상 및 round 곡선이 적용된 슬라이딩 인디케이터 */}
              <div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-brand shadow-xs transition-transform duration-300 ease-out will-change-transform"
                style={{
                  transform: viewMode === 'map' ? 'translateX(100%)' : 'translateX(0)',
                  left: '4px',
                }}
              />
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                className={cn(
                  'relative z-10 w-14 h-7 flex items-center justify-center text-xs font-bold transition-colors duration-200 cursor-pointer rounded-full select-none',
                  viewMode === 'list' ? 'text-white' : 'text-muted hover:text-ink'
                )}
              >
                목록형
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'map'}
                onClick={() => setViewMode('map')}
                className={cn(
                  'relative z-10 w-14 h-7 flex items-center justify-center text-xs font-bold transition-colors duration-200 cursor-pointer rounded-full select-none',
                  viewMode === 'map' ? 'text-white' : 'text-muted hover:text-ink'
                )}
              >
                지도형
              </button>
            </div>

            {/* 커스텀 정렬 드롭다운 (플로팅 메뉴) - 목록형/지도형과 텍스트 사이즈(text-xs font-bold) 및 높이(h-9) 일치 */}
            <div ref={sortDropdownRef} className="relative">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isSortDropdownOpen}
                onClick={() => setIsSortDropdownOpen((prev) => !prev)}
                className="h-9 px-3 rounded-2xl border border-border bg-surface text-xs font-bold text-ink flex items-center gap-1.5 shadow-2xs hover:border-brand-border cursor-pointer transition-colors select-none"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>{currentSortLabel}</span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-muted transition-transform duration-200',
                    isSortDropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              {isSortDropdownOpen && (
                <div
                  role="listbox"
                  className="absolute right-0 top-full mt-1.5 z-30 w-36 p-1.5 rounded-2xl border border-border bg-surface shadow-lg animate-in fade-in zoom-in-95 duration-150"
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
        <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-3 flex-1">
          <EventMapExplorer
            events={filteredAndSortedEvents}
            currentKST={currentKST}
          />
        </main>
      ) : (
        <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 pt-3 flex-1">
          {filteredAndSortedEvents.length === 0 ? (
            <div className="py-20 text-center rounded-3xl bg-surface border border-border space-y-3">
              <p className="text-base font-bold text-ink">선택한 조건의 모집 공고가 없어요</p>
              <p className="text-xs text-muted break-keep">
                날짜나 지역, 검색어 조건을 변경하거나 필터를 초기화해 보세요.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-10 px-5 rounded-2xl bg-brand text-inverse text-xs font-bold hover:bg-brand-hover transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                <span>전체 공고 보기</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAndSortedEvents.map((item) => {
                const deadlineInfo = getDeadlineInfo(item.deadlineDate, currentKST);

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
                        <div className="flex flex-col items-end shrink-0 text-right rounded-xl px-2.5 py-1">
                          <span className="text-[12px] font-bold text-brand leading-tight">
                            {deadlineInfo.dateLabel}
                          </span>
                          <span className="text-xs font-bold text-brand leading-tight mt-0.5">
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

                    {/* 카드 하단: 하루 보수 (오픈형 3D 클레이 코인 좌측 인라인 배치) & 주최사 정보 */}
                    <div className="pt-3 border-t border-border-subtle flex items-end justify-between">
                      <div>
                        <p className="text-xs text-muted">하루 보수 · 세전</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {/* Task 2: 오픈형 3D 클레이 코인 금액 좌측 인라인 배치 */}
                          <FloatingClayCoin3D className="w-6 h-6 shrink-0" />
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
        </main>
      )}

      {/* 6. 이용 안내 배너 & 푸터 */}
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6">

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
      </div>

      {/* 8. 모바일 4탭 하단 내비게이션 바 */}
      <MobileBottomNav />
    </div>
  );
}