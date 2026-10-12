'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Loader2, ExternalLink } from 'lucide-react';
import { useKakaoMapLoader } from '@/lib/kakao/useKakaoMapLoader';
import type { KakaoPlaceItem, KakaoMap, KakaoMarker } from '@/types/kakao';

export interface PlaceSelection {
  venueName: string;
  venueAddress: string;
  latitude: number;
  longitude: number;
}

interface KakaoPlaceSearchInputProps {
  venueName: string;
  venueAddress: string;
  venueDetail: string;
  latitude: number | null;
  longitude: number | null;
  onSelectPlace: (place: PlaceSelection) => void;
  onChangeDetail: (detail: string) => void;
  className?: string;
}

export function KakaoPlaceSearchInput({
  venueName,
  venueAddress,
  venueDetail,
  latitude,
  longitude,
  onSelectPlace,
  onChangeDetail,
  className = '',
}: KakaoPlaceSearchInputProps) {
  const { isLoaded, loadError } = useKakaoMapLoader();

  const [keyword, setKeyword] = useState(venueName || venueAddress || '');
  const [results, setResults] = useState<KakaoPlaceItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<KakaoMap | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 동기화: 부모의 venueName이 바뀌었을 때 인풋 표시 동기화
  useEffect(() => {
    if (venueName && !isOpenDropdown) {
      setKeyword(venueName);
    }
  }, [venueName, isOpenDropdown]);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpenDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 서버 API 기반 장소 검색 (카카오 JS SDK 에러나 차단 시에도 100% 작동)
  const fetchPlaces = useCallback(async (searchKeyword: string) => {
    const q = searchKeyword.trim();
    if (!q || q.length < 2) {
      setResults([]);
      setIsOpenDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // 1. 카카오 SDK 로컬 서비스 우선 시도 (지원되는 경우)
    if (window.kakao?.maps?.services?.Places) {
      try {
        const ps = new window.kakao.maps.services.Places();
        ps.keywordSearch(
          q,
          async (data, status) => {
            if (status === window.kakao.maps.services.Status.OK && data && data.length > 0) {
              setResults(data);
              setIsOpenDropdown(true);
              setIsSearching(false);
              return;
            }
            // 카카오 응답이 없으면 서버 API 호출
            await queryServerApi(q);
          },
          { size: 7 }
        );
        return;
      } catch {
        // SDK 에러 시 계속 진행하여 서버 API 호출
      }
    }

    // 2. 서버 API 호출
    await queryServerApi(q);
  }, []);

  const queryServerApi = async (q: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setIsOpenDropdown(true);
      } else {
        setResults([]);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // 인풋 변경 핸들러 (250ms 디바운스)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length >= 2) {
      setIsSearching(true);
      debounceTimerRef.current = setTimeout(() => {
        fetchPlaces(val);
      }, 250);
    } else {
      setResults([]);
      setIsOpenDropdown(false);
      setIsSearching(false);
    }
  };

  // 장소 선택 핸들러
  const handleSelect = (item: KakaoPlaceItem) => {
    const lat = parseFloat(item.y);
    const lng = parseFloat(item.x);
    const bestAddress = item.road_address_name || item.address_name;

    setKeyword(item.place_name);
    setIsOpenDropdown(false);
    setResults([]);

    onSelectPlace({
      venueName: item.place_name,
      venueAddress: bestAddress,
      latitude: lat,
      longitude: lng,
    });
  };

  // 장소 초기화
  const handleClear = () => {
    setKeyword('');
    setResults([]);
    setIsOpenDropdown(false);
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    mapInstanceRef.current = null;
    onSelectPlace({
      venueName: '',
      venueAddress: '',
      latitude: 0,
      longitude: 0,
    });
  };

  // 공식 카카오 지도 SDK 인스턴스 생성 및 위치/마커 동기화
  useEffect(() => {
    if (!isLoaded || !miniMapRef.current || !latitude || !longitude || latitude === 0) {
      return;
    }

    const kakaoMaps = window.kakao?.maps;
    if (!kakaoMaps) return;

    const coords = new kakaoMaps.LatLng(latitude, longitude);

    if (!mapInstanceRef.current) {
      // 1. 신규 카카오 지도 인스턴스 생성 (레벨 3, 드래그 및 줌 가능)
      const map = new kakaoMaps.Map(miniMapRef.current, {
        center: coords,
        level: 3,
      });
      mapInstanceRef.current = map;

      // 2. 기본 마커 생성 및 지도 중심에 고정 표시
      const marker = new kakaoMaps.Marker({
        position: coords,
        map: map,
        title: venueName || '행사 위치',
      });
      markerRef.current = marker;

      // 타일 렌더링 안정화를 위한 relayout
      setTimeout(() => {
        map.relayout();
        map.setCenter(coords);
      }, 50);
    } else {
      // 3. 기존 맵 위치 및 마커 부드러운 위치 갱신 (panTo)
      const map = mapInstanceRef.current;
      map.relayout();
      map.setCenter(coords);

      if (markerRef.current) {
        markerRef.current.setPosition(coords);
      } else {
        const marker = new kakaoMaps.Marker({
          position: coords,
          map: map,
          title: venueName || '행사 위치',
        });
        markerRef.current = marker;
      }
    }
  }, [isLoaded, latitude, longitude, venueName]);

  // 컨테이너 리사이즈 또는 슬라이드 전환 시 지도 타일 재정렬
  useEffect(() => {
    if (!miniMapRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current && latitude && longitude && latitude !== 0 && window.kakao?.maps) {
        mapInstanceRef.current.relayout();
        const coords = new window.kakao.maps.LatLng(latitude, longitude);
        mapInstanceRef.current.setCenter(coords);
      }
    });
    observer.observe(miniMapRef.current);
    return () => observer.disconnect();
  }, [latitude, longitude]);

  const hasSelectedLocation = Boolean(latitude && longitude && latitude !== 0);

  return (
    <div ref={containerRef} className={`space-y-3 ${className}`}>
      {/* 1. 카카오 키워드 장소 검색 인풋 */}
      <div className="relative">
        <label className="text-xs font-bold text-muted block mb-1">
          행사 장소 검색 <span className="text-brand font-normal">(카카오맵 연동)</span>
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3.5 pointer-events-none text-muted">
            <Search className="w-4 h-4 text-brand" />
          </div>
          <input
            type="text"
            value={keyword}
            onChange={handleInputChange}
            onFocus={() => {
              if (results.length > 0) setIsOpenDropdown(true);
            }}
            placeholder="예: 코엑스 D홀, 성수 에스팩토리, 더현대 서울"
            className="w-full h-11 pl-10 pr-10 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-brand focus:outline-none transition-all placeholder:text-muted/60"
          />
          {isSearching && (
            <div className="absolute right-3.5">
              <Loader2 className="w-4 h-4 text-brand animate-spin" />
            </div>
          )}
          {!isSearching && keyword && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 text-muted hover:text-ink p-1 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="장소 지우기"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 장소 검색 자동완성 드롭다운 */}
        {isOpenDropdown && (
          <div className="absolute z-30 left-0 right-0 mt-1.5 bg-surface border border-border rounded-2xl shadow-xl max-h-64 overflow-y-auto divide-y divide-border/60 backdrop-blur-md">
            {results.length > 0 ? (
              results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full p-3 text-left hover:bg-brand-subtle/50 transition-colors flex items-start gap-2.5 group cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-ink group-hover:text-brand transition-colors">
                      {item.place_name}
                    </p>
                    <p className="text-[11px] text-muted truncate mt-0.5">
                      {item.road_address_name || item.address_name}
                    </p>
                    {item.category_name && (
                      <span className="text-[10px] text-brand/80 font-medium inline-block mt-0.5">
                        {item.category_name.split(' > ').slice(-1)[0]}
                      </span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-muted">
                검색된 장소가 없습니다. 건물명이나 도로명으로 다시 검색해 보세요.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. 현장 위치 미리보기 카카오 지도 및 요약 카드 */}
      {hasSelectedLocation && latitude && longitude && (
        <div className="space-y-2.5">
          {/* 지도 컨테이너 (h-72 sm:h-80 = 288px ~ 320px 시원한 높이) */}
          <div className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-border shadow-2xs relative bg-surface-muted/30">
            {/* 상단 좌측: 현장 위치 미리보기 배지 */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/90 backdrop-blur-md border border-border shadow-xs text-xs font-bold text-ink pointer-events-none">
              <MapPin className="w-3.5 h-3.5 text-brand" />
              <span>현장 위치 미리보기</span>
            </div>

            {/* 상단 우측: 카카오맵 크게보기 바로가기 */}
            <a
              href={`https://map.kakao.com/link/map/${encodeURIComponent(venueName || '행사 위치')},${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-3 right-3 z-10 flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface/90 backdrop-blur-md border border-border shadow-xs text-xs font-semibold text-brand hover:text-brand-strong hover:bg-surface transition-all cursor-pointer"
            >
              <span>지도 크게보기</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* 공식 카카오 지도 캔버스 (OSM iframe 완전 제거) */}
            <div ref={miniMapRef} className="w-full h-full" />

            {/* 로딩 중 중앙 스켈레톤 및 스피너 */}
            {!isLoaded && !loadError && (
              <div className="absolute inset-0 bg-surface/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
                <Loader2 className="w-6 h-6 text-brand animate-spin" />
                <span className="text-xs text-muted font-medium">카카오 지도를 불러오는 중입니다...</span>
              </div>
            )}

            {/* SDK 로드 에러 처리 */}
            {loadError && (
              <div className="absolute inset-0 bg-surface/95 flex flex-col items-center justify-center p-4 text-center z-20">
                <p className="text-xs text-red-500 font-medium mb-1">{loadError}</p>
                <p className="text-[11px] text-muted">카카오 지도를 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.</p>
              </div>
            )}
          </div>

          {/* 3. 지도 바로 아래 선택된 장소 요약 카드 (토스 스타일: 건물명, 도로명 주소, 좌표) */}
          <div className="p-3.5 sm:p-4 rounded-2xl border border-border bg-surface text-xs shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-5 h-5 text-brand" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-ink truncate">
                    {venueName || '선택된 행사 장소'}
                  </h4>
                  <span className="text-[10px] font-semibold text-brand bg-brand-soft px-2 py-0.5 rounded-full shrink-0">
                    카카오맵 연동
                  </span>
                </div>
                {venueAddress && (
                  <p className="text-xs text-muted leading-relaxed break-keep">
                    {venueAddress}
                  </p>
                )}
                <div className="flex items-center gap-3 pt-0.5 text-[11px] text-muted">
                  <span>위도 <strong className="font-mono text-ink/80">{latitude.toFixed(6)}</strong></span>
                  <span className="text-border">·</span>
                  <span>경도 <strong className="font-mono text-ink/80">{longitude.toFixed(6)}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. 상세 위치 인풋 */}
      <div>
        <label className="text-xs font-bold text-muted block mb-1">
          상세 위치 <span className="font-normal text-muted">(동/층/홀/부스 번호)</span>
        </label>
        <input
          type="text"
          value={venueDetail}
          onChange={(e) => onChangeDetail(e.target.value)}
          placeholder="예: 3층 D홀 컨벤션 메인 로비, 2번 게이트 앞"
          className="w-full h-11 px-3 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-brand focus:outline-none transition-all placeholder:text-muted/60"
        />
      </div>
    </div>
  );
}
