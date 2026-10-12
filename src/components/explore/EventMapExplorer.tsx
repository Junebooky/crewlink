'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  RotateCcw,
  Plus,
  Minus,
  Navigation,
  ChevronRight,
  ExternalLink,
  MapPin,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKakaoMapLoader } from '@/lib/kakao/useKakaoMapLoader';
import { FloatingClayCoin3D } from '@/components/assets/FloatingClayCoin3D';
import { getDeadlineInfo } from '@/lib/utils/date';
import type { EventItem } from '@/lib/data/events';
import type { KakaoMap, KakaoCustomOverlay } from '@/types/kakao';

interface EventMapExplorerProps {
  events: EventItem[];
  currentKST: string;
  className?: string;
}

export function EventMapExplorer({
  events,
  currentKST,
  className = '',
}: EventMapExplorerProps) {
  const { isLoaded, loadError } = useKakaoMapLoader();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<KakaoMap | null>(null);
  const overlaysRef = useRef<Record<string, KakaoCustomOverlay>>({});
  const markerElementsRef = useRef<Record<string, HTMLDivElement>>({});
  const desktopListRef = useRef<HTMLDivElement>(null);
  const mobileCarouselRef = useRef<HTMLDivElement>(null);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showResearchBtn, setShowResearchBtn] = useState(false);
  const [boundedEvents, setBoundedEvents] = useState<EventItem[] | null>(null);

  // 이벤트 목록: 화면 영역 필터가 적용되어 있으면 boundedEvents, 아니면 부모로부터 전달받은 events
  const displayEvents = useMemo(() => {
    return boundedEvents !== null ? boundedEvents : events;
  }, [boundedEvents, events]);

  // 부모의 이벤트 목록이 바뀌면 영역 필터링 초기화
  useEffect(() => {
    setBoundedEvents(null);
    setShowResearchBtn(false);
  }, [events]);

  // 이벤트 선택 및 지도 중심 이동 처리
  const handleSelectEvent = useCallback(
    (eventId: string, shouldPanMap = true) => {
      setSelectedEventId(eventId);

      const targetEvent = events.find((e) => e.id === eventId);
      if (
        shouldPanMap &&
        targetEvent &&
        targetEvent.latitude &&
        targetEvent.longitude &&
        mapInstanceRef.current &&
        window.kakao?.maps
      ) {
        const moveLatLng = new window.kakao.maps.LatLng(
          targetEvent.latitude,
          targetEvent.longitude
        );
        mapInstanceRef.current.panTo(moveLatLng);
      }

      // 데스크톱 목록 스크롤
      const desktopCard = document.getElementById(`explorer-card-${eventId}`);
      if (desktopCard && desktopListRef.current) {
        desktopCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // 모바일 캐러셀 스크롤
      const mobileCard = document.getElementById(`mobile-card-${eventId}`);
      if (mobileCard && mobileCarouselRef.current) {
        mobileCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    },
    [events]
  );

  // 지도 인스턴스 초기화 (최초 1회)
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || !window.kakao?.maps) return;
    if (mapInstanceRef.current) return;

    // 초기 중심 좌표 결정: 좌표가 있는 첫 번째 이벤트 혹은 기본값(코엑스 부근)
    const firstWithCoords = events.find((e) => e.latitude && e.longitude);
    const initialLat = firstWithCoords?.latitude || 37.511854;
    const initialLng = firstWithCoords?.longitude || 127.059287;

    const center = new window.kakao.maps.LatLng(initialLat, initialLng);
    const options = {
      center,
      level: 7,
    };

    const map = new window.kakao.maps.Map(mapContainerRef.current, options);
    mapInstanceRef.current = map;

    // 드래그 및 줌 완료 시 "현재 지도에서 재검색" 플로팅 버튼 노출
    const handleMapMovement = () => {
      setShowResearchBtn(true);
    };

    window.kakao.maps.event.addListener(map, 'dragend', handleMapMovement);
    window.kakao.maps.event.addListener(map, 'zoom_changed', handleMapMovement);

    return () => {
      // 정리
      try {
        window.kakao.maps.event.removeListener(map, 'dragend', handleMapMovement);
        window.kakao.maps.event.removeListener(map, 'zoom_changed', handleMapMovement);
      } catch {
        // 무시
      }
    };
  }, [isLoaded, events]);

  // 마커(커스텀 오버레이) 생성 및 갱신
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.kakao?.maps) return;

    // 기존 오버레이 제거
    Object.values(overlaysRef.current).forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = {};
    markerElementsRef.current = {};

    const bounds = new window.kakao.maps.LatLngBounds();
    let hasCoordsCount = 0;

    events.forEach((event) => {
      if (!event.latitude || !event.longitude) return;

      const position = new window.kakao.maps.LatLng(event.latitude, event.longitude);
      bounds.extend(position);
      hasCoordsCount++;

      // 굿빌더 UX 차용 브랜드 칩 마커 엘리먼트 생성: [12만원 | 뷰티 팝업] 형태
      const container = document.createElement('div');
      container.id = `map-chip-${event.id}`;
      container.className =
        'px-2.5 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1 cursor-pointer select-none transition-all duration-150 ' +
        (event.id === selectedEventId
          ? 'bg-brand text-white scale-110 z-20 ring-2 ring-brand-subtle'
          : 'bg-surface border border-brand-border text-ink hover:bg-brand hover:text-white');

      const wageWonTenThousand = Math.round(event.dailyWageWon / 10000);
      container.innerHTML = `
        <span class="tabular-nums">${wageWonTenThousand}만원</span>
        <span class="opacity-40">|</span>
        <span class="truncate max-w-[85px]">${event.categoryLabel}</span>
      `;

      container.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSelectEvent(event.id, true);
      });

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position,
        content: container,
        yAnchor: 1.2,
        zIndex: event.id === selectedEventId ? 30 : 10,
      });

      customOverlay.setMap(map);
      overlaysRef.current[event.id] = customOverlay;
      markerElementsRef.current[event.id] = container;
    });

    // 이벤트가 2개 이상이면 모든 마커가 화면에 들어오도록 bounds 자동 조정
    if (hasCoordsCount > 1 && !bounds.isEmpty()) {
      map.setBounds(bounds);
    } else if (hasCoordsCount === 1) {
      const single = events.find((e) => e.latitude && e.longitude);
      if (single?.latitude && single?.longitude) {
        map.setCenter(new window.kakao.maps.LatLng(single.latitude, single.longitude));
        map.setLevel(5);
      }
    }
  }, [events, isLoaded, handleSelectEvent, selectedEventId]);

  // 활성화된 마커 스타일 동적 업데이트
  useEffect(() => {
    Object.entries(markerElementsRef.current).forEach(([id, el]) => {
      const isSelected = id === selectedEventId;
      el.className =
        'px-2.5 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1 cursor-pointer select-none transition-all duration-150 ' +
        (isSelected
          ? 'bg-brand text-white scale-110 z-20 ring-2 ring-brand-subtle'
          : 'bg-surface border border-brand-border text-ink hover:bg-brand hover:text-white');

      overlaysRef.current[id]?.setZIndex(isSelected ? 30 : 10);
    });
  }, [selectedEventId]);

  // "현재 지도에서 재검색" 핸들러
  const handleResearchInBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const minLat = sw.getLat();
    const minLng = sw.getLng();
    const maxLat = ne.getLat();
    const maxLng = ne.getLng();

    // 프론트엔드 좌표 범위 필터링
    const matched = events.filter((e) => {
      if (!e.latitude || !e.longitude) return false;
      return (
        e.latitude >= minLat &&
        e.latitude <= maxLat &&
        e.longitude >= minLng &&
        e.longitude <= maxLng
      );
    });

    setBoundedEvents(matched);
    setShowResearchBtn(false);

    // 검색 결과가 있고 현재 선택된 공고가 목록에 없으면 첫 번째 공고 선택
    if (matched.length > 0) {
      if (!selectedEventId || !matched.some((e) => e.id === selectedEventId)) {
        setSelectedEventId(matched[0].id);
      }
    } else {
      setSelectedEventId(null);
    }
  };

  // 영역 필터 초기화(전체 보기)
  const handleResetBounds = () => {
    setBoundedEvents(null);
    setShowResearchBtn(false);

    const map = mapInstanceRef.current;
    if (map && window.kakao?.maps) {
      const bounds = new window.kakao.maps.LatLngBounds();
      let count = 0;
      events.forEach((e) => {
        if (e.latitude && e.longitude) {
          bounds.extend(new window.kakao.maps.LatLng(e.latitude, e.longitude));
          count++;
        }
      });
      if (count > 0 && !bounds.isEmpty()) {
        map.setBounds(bounds);
      }
    }
  };

  // 줌 인/아웃 컨트롤 핸들러
  const handleZoom = (delta: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const currentLevel = map.getLevel();
    map.setLevel(Math.max(1, Math.min(14, currentLevel + delta)));
  };

  return (
    <div
      className={cn(
        'w-full h-[calc(100vh-200px)] min-h-[560px] max-h-[880px] relative flex flex-col md:flex-row bg-canvas rounded-2xl md:rounded-3xl border border-border overflow-hidden shadow-xs',
        className
      )}
    >
      {/* 1. 데스크톱(MD 이상) 좌측 공고 목록 패널 (가로 420px, 스크롤 가능) */}
      <aside className="hidden md:flex flex-col w-[420px] shrink-0 border-r border-border bg-surface h-full z-10 shadow-xs">
        {/* 패널 헤더: 검색된 공고 개수 및 영역 필터 리셋 */}
        <div className="p-3.5 border-b border-border flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted">지도 내 현장</span>
            <span className="text-xs font-black text-brand tabular-nums">
              {displayEvents.length}개
            </span>
          </div>

          {boundedEvents !== null && (
            <button
              type="button"
              onClick={handleResetBounds}
              className="text-xs text-muted hover:text-brand font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>전체 영역 복귀</span>
            </button>
          )}
        </div>

        {/* 패널 공고 리스트 */}
        <div
          ref={desktopListRef}
          className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin divide-y-0"
        >
          {displayEvents.length === 0 ? (
            <div className="py-16 text-center space-y-3 px-4">
              <MapPin className="w-8 h-8 text-muted mx-auto stroke-1" />
              <p className="text-sm font-bold text-ink">
                현재 지도 화면에 모집 중인 공고가 없어요
              </p>
              <p className="text-xs text-muted break-keep">
                지도를 드래그하여 다른 지역을 확인하거나 축소해 보세요.
              </p>
              {boundedEvents !== null && (
                <button
                  type="button"
                  onClick={handleResetBounds}
                  className="h-9 px-4 rounded-xl bg-brand text-inverse text-xs font-bold hover:bg-brand-hover transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>전체 공고 보기</span>
                </button>
              )}
            </div>
          ) : (
            displayEvents.map((item) => {
              const isSelected = item.id === selectedEventId;
              const deadlineInfo = getDeadlineInfo(item.deadlineDate, currentKST);

              return (
                <div
                  key={item.id}
                  id={`explorer-card-${item.id}`}
                  onClick={() => handleSelectEvent(item.id, true)}
                  onMouseEnter={() => setSelectedEventId(item.id)}
                  className={cn(
                    'group p-4 rounded-2xl border transition-all cursor-pointer relative shadow-2xs',
                    isSelected
                      ? 'border-brand bg-brand-soft/25 ring-2 ring-brand/20 shadow-xs'
                      : 'border-border bg-surface hover:border-brand-border'
                  )}
                >
                  {/* 상단 메타 & 마감 배지 */}
                  <div className="flex items-start justify-between gap-2 mb-2">
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

                    <div className="flex flex-col items-end shrink-0 text-right">
                      <span className="text-[11px] font-bold text-brand leading-tight">
                        {deadlineInfo.dDayLabel}
                      </span>
                    </div>
                  </div>

                  {/* 공고 제목 */}
                  <h3 className="text-sm font-bold text-ink leading-snug line-clamp-2 break-keep mb-2.5 group-hover:text-brand-strong transition-colors">
                    {item.displayTitle}
                  </h3>

                  {/* 일시 & 시간 */}
                  <div className="space-y-1 text-xs text-muted mb-3">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3 h-3 text-muted shrink-0" />
                      <span className="font-medium text-ink">{item.dateRangeLabel}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-muted shrink-0" />
                      <span>{item.workHoursLabel}</span>
                    </div>
                  </div>

                  {/* 하단 보수 & 상세 이동 링크 */}
                  <div className="pt-2.5 border-t border-border-subtle flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-muted">하루 보수</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <FloatingClayCoin3D className="w-4 h-4 shrink-0" />
                        <span className="text-base font-extrabold text-ink tabular-nums">
                          {item.dailyWageWon.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-ink">원</span>
                      </div>
                    </div>

                    <Link
                      href={`/events/${item.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-strong p-1 rounded-lg hover:bg-brand-soft transition-colors"
                    >
                      <span>상세보기</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* 2. 지도 뷰포트 영역 (우측 또는 모바일 전체 화면) */}
      <main className="flex-1 h-full w-full relative overflow-hidden">
        {/* 카카오 지도 컨테이너 */}
        <div ref={mapContainerRef} className="w-full h-full bg-canvas" />

        {/* 로딩 인디케이터 */}
        {!isLoaded && !loadError && (
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
            <p className="text-xs font-bold text-ink">카카오 지도를 불러오는 중...</p>
          </div>
        )}

        {/* 로드 실패 가이드 */}
        {loadError && (
          <div className="absolute inset-0 bg-surface/90 flex flex-col items-center justify-center gap-2 p-6 text-center z-20">
            <AlertCircle className="w-8 h-8 text-danger mx-auto" />
            <p className="text-sm font-bold text-ink">카카오 지도를 연결할 수 없어요</p>
            <p className="text-xs text-muted max-w-sm">{loadError}</p>
          </div>
        )}

        {/* "현재 지도에서 재검색" 플로팅 트리거 */}
        {showResearchBtn && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={handleResearchInBounds}
              className="h-10 px-4.5 rounded-full bg-surface border-2 border-brand text-brand hover:bg-brand hover:text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>현재 지도에서 검색 🔄</span>
            </button>
          </div>
        )}

        {/* 지도 우측 상단 줌 컨트롤 버튼 */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 shadow-md">
          <button
            type="button"
            onClick={() => handleZoom(-1)}
            aria-label="지도 확대"
            className="w-8 h-8 rounded-lg bg-surface border border-border text-ink hover:text-brand flex items-center justify-center transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(1)}
            aria-label="지도 축소"
            className="w-8 h-8 rounded-lg bg-surface border border-border text-ink hover:text-brand flex items-center justify-center transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* 3. 모바일 하단 스와이프 가능한 공고 카드 캐러셀 (MD 미만 전용) */}
        {displayEvents.length > 0 && (
          <div className="md:hidden absolute bottom-[72px] left-0 right-0 z-30 px-3 pointer-events-none">
            <div
              ref={mobileCarouselRef}
              className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none pointer-events-auto"
            >
              {displayEvents.map((item) => {
                const isSelected = item.id === selectedEventId;
                const deadlineInfo = getDeadlineInfo(item.deadlineDate, currentKST);

                return (
                  <div
                    key={item.id}
                    id={`mobile-card-${item.id}`}
                    onClick={() => handleSelectEvent(item.id, true)}
                    className={cn(
                      'snap-center shrink-0 w-[280px] bg-surface/98 backdrop-blur-md rounded-2xl border p-3.5 shadow-xl transition-all cursor-pointer',
                      isSelected
                        ? 'border-brand ring-2 ring-brand scale-[1.02]'
                        : 'border-border'
                    )}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="text-[11px] font-semibold text-muted truncate">
                        {item.categoryLabel} · {item.regionLabel}
                      </span>
                      <span className="text-[11px] font-bold text-brand shrink-0">
                        {deadlineInfo.dDayLabel}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-ink truncate mb-2">
                      {item.displayTitle}
                    </h4>

                    <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                      <div className="flex items-center gap-1">
                        <FloatingClayCoin3D className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-extrabold text-ink tabular-nums">
                          {item.dailyWageWon.toLocaleString()}원
                        </span>
                      </div>

                      <Link
                        href={`/events/${item.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-bold text-brand hover:text-brand-strong inline-flex items-center gap-0.5"
                      >
                        <span>지원하기</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
