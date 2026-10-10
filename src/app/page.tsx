'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Check,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  ArrowUpDown,
  RotateCcw,
  X,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PublicHeader } from '@/components/common/PublicHeader';
import { MobileBottomNav } from '@/components/common/MobileBottomNav';

import {
  EVENT_FEED_DATA,
  EventCategory,
  EventListItem,
  formatRecruitmentDeadline,
} from '@/lib/data/events';

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
  { id: 'wage_desc', label: '일당 높은순' },
];

// Reference date for D-Day calculation (2026-10-09 KST)
const REFERENCE_DATE = new Date('2026-10-09T00:00:00+09:00');

function calculateDDay(deadlineDateStr: string): string {
  try {
    const deadline = new Date(`${deadlineDateStr}T23:59:59+09:00`);
    const diffMs = deadline.getTime() - REFERENCE_DATE.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return '마감';
    if (diffDays === 0) return 'D-Day';
    return `D-${diffDays}`;
  } catch {
    return '모집중';
  }
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | EventCategory>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close custom dropdown on outside click or ESC
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

  const hasActiveFilters =
    selectedCategory !== 'all' || selectedRegion !== 'all' || searchKeyword.trim() !== '';

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedRegion('all');
    setSortOrder('latest');
    setSearchKeyword('');
    setIsSortDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col pb-20 md:pb-12">
      {/* 1. 크루 중심 퍼블릭 헤더 (주최사 링크 상단 완전 제거) */}
      <PublicHeader />

      {/* 2. 슬림 검색 및 필터 헤더 (거대한 주최사 유도 박스 제거) */}
      <section className="bg-surface border-b border-border pt-6 pb-5 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
              지금, 함께할 현장
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1 break-keep">
              날짜와 장소, 일당을 확인하고 나에게 맞는 팝업·박람회 현장을 찾아보세요.
            </p>
          </div>

          {/* 슬림 검색 인풋: 정확히 52px 높이, sr-only 라벨 제공 */}
          <div className="relative">
            <label htmlFor="event-search-input" className="sr-only">
              행사, 지역, 업무 검색
            </label>
            <Search className="w-5 h-5 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="event-search-input"
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="행사, 지역, 업무로 검색 (예: 성수, 코엑스, 안내, POS)"
              className="w-full h-[52px] min-h-[52px] pl-12 pr-10 rounded-2xl border border-border bg-surface text-ink text-sm sm:text-base focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 shadow-xs transition-colors"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface-muted hover:bg-border flex items-center justify-center text-muted hover:text-ink cursor-pointer"
                aria-label="검색어 지우기"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 행사 종류 칩 필터 */}
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
                      ? 'bg-brand-soft text-brand-strong border-brand-border font-bold'
                      : 'bg-surface text-muted border-border hover:border-brand-border'
                  )}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* 지역 선택 칩 */}
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
                    'min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer border',
                    isSelected
                      ? 'bg-brand-soft text-brand-strong border-brand-border font-bold'
                      : 'bg-surface text-muted border-border hover:border-brand-border'
                  )}
                >
                  <span>{reg.label}</span>
                </button>
              );
            })}
          </div>

          {/* 선택된 필터 해제 칩 (인라인 해제: [성수 ✕], [팝업스토어 ✕]) */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border-subtle text-xs animate-in fade-in duration-150">
              <span className="text-[11px] font-bold text-muted mr-1">적용된 필터:</span>

              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-soft text-brand-strong font-semibold text-xs border border-brand-border hover:bg-brand-soft/80 cursor-pointer"
                >
                  <span>{CATEGORY_OPTIONS.find((c) => c.id === selectedCategory)?.label}</span>
                  <X className="w-3 h-3 text-brand" />
                </button>
              )}

              {selectedRegion !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedRegion('all')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-soft text-brand-strong font-semibold text-xs border border-brand-border hover:bg-brand-soft/80 cursor-pointer"
                >
                  <span>{REGION_OPTIONS.find((r) => r.id === selectedRegion)?.label}</span>
                  <X className="w-3 h-3 text-brand" />
                </button>
              )}

              {searchKeyword.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-soft text-brand-strong font-semibold text-xs border border-brand-border hover:bg-brand-soft/80 cursor-pointer"
                >
                  <span>&quot;{searchKeyword}&quot;</span>
                  <X className="w-3 h-3 text-brand" />
                </button>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-muted hover:text-ink underline ml-1 cursor-pointer font-medium"
              >
                전체 초기화
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 3. 공고 카드 메인 피드 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 flex-1 w-full">
        {/* 결과 수 및 정렬 컨트롤 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-ink">
            조건에 맞는 현장 <span className="text-brand tabular-nums">{filteredAndSortedEvents.length}</span>개
          </p>

          {/* 브랜드 정렬 드롭다운 */}
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

            {/* 펼쳐지는 스무스 드롭다운 */}
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

        {/* 빈 검색 결과 */}
        {filteredAndSortedEvents.length === 0 ? (
          <div className="py-20 text-center bg-surface rounded-3xl border border-border p-6 max-w-lg mx-auto">
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
              const dDayLabel = calculateDDay(item.deadlineDate);
              const deadlineDateLabel = formatRecruitmentDeadline(item.deadlineDate);

              return (
                <Link
                  key={item.id}
                  href={`/events/${item.id}`}
                  className="group bg-surface rounded-3xl border border-border hover:border-brand-border transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <div>
                    {/* 카드 상단: 카테고리 & 브랜드 색상 D-Day 토큰 배지 (brand-soft + brand-strong) */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-xs text-muted font-medium bg-surface-muted px-2 py-0.5 rounded-md border border-border-subtle">
                        {item.categoryLabel}
                      </span>

                      {/* 브랜드 토큰 D-Day 배지: 에러/경고색(Red/Green) 대신 brand-soft + brand-strong 사용 */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-brand-strong bg-brand-soft px-2 py-0.5 rounded-md border border-brand-border">
                          {dDayLabel}
                        </span>
                        <span className="text-xs font-medium text-muted">
                          {deadlineDateLabel}
                        </span>
                      </div>
                    </div>

                    {/* 공고 제목 */}
                    <h2 className="text-base sm:text-lg font-bold text-ink leading-snug group-hover:text-brand-strong transition-colors line-clamp-2 break-keep mb-3">
                      {item.displayTitle}
                    </h2>

                    {/* 장소 - 날짜 - 시간 순서 */}
                    <div className="space-y-1.5 text-xs text-muted mb-3.5">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="font-medium text-ink">
                          {item.regionLabel}
                          {item.stationInfo ? ` · ${item.stationInfo}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="font-medium text-ink">{item.dateRangeLabel}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span>{item.workHoursLabel}</span>
                      </div>
                    </div>

                    {/* 모집 인원 및 배정 현황 */}
                    <div className="flex items-center gap-1.5 text-xs text-muted mb-3">
                      <Users className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span>모집 {item.requiredCount}명</span>
                      <span className="text-brand font-semibold">
                        ({item.confirmedCount}명 확정)
                      </span>
                    </div>

                    {/* 주요 업무 태그 */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {item.primaryRoles.map((role) => (
                        <span
                          key={role}
                          className="px-2 py-0.5 rounded-md bg-canvas text-muted text-xs font-medium border border-border"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 카드 하단: 하루 보수 단일 기준 표기 */}
                  <div className="pt-3 border-t border-border-subtle flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-muted">하루 보수 · 세전</p>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-lg sm:text-xl font-black text-ink tabular-nums">
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

        {/* 4. 지원 및 정산 절차 배너 */}
        <section className="mt-10 p-5 rounded-3xl bg-surface border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-brand shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-ink">
                지원부터 정산까지, 투명하게 확인해요
              </p>
              <p className="text-xs text-muted mt-0.5 break-keep">
                전자 도급계약으로 크루를 보호하며, 3.3% 사업소득세 원천징수 후 안전하게 정산돼요.
              </p>
            </div>
          </div>
          <Link
            href="/guide"
            className="text-xs font-bold text-brand hover:text-brand-strong flex items-center gap-1 shrink-0"
          >
            <span>이용 안내 보기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      </main>

      {/* 5. 푸터: 주최사 센터는 푸터 우측 하단에 작은 텍스트로만 은닉 배치 */}
      <footer className="mt-12 border-t border-border bg-surface px-4 sm:px-6 py-6 text-xs text-muted">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 CrewLink. 현장 행사와 크루를 잇다.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/guide" className="hover:text-ink transition-colors">
              이용 안내
            </Link>
            <span className="text-border">|</span>
            <Link
              href="/biz"
              className="text-muted hover:text-brand font-medium transition-colors"
            >
              주최사 센터
            </Link>
          </div>
        </div>
      </footer>

      {/* 6. 모바일 4탭 하단 내비게이션 바 */}
      <MobileBottomNav />
    </div>
  );
}