'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Loader2, Navigation } from 'lucide-react';
import { useKakaoMapLoader } from '@/lib/kakao/useKakaoMapLoader';
import type { KakaoPlaceItem, KakaoMap, KakaoCustomOverlay } from '@/types/kakao';

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
  const overlayRef = useRef<KakaoCustomOverlay | null>(null);

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

  // 장소 키워드 검색 함수 (디바운스)
  const searchPlaces = useCallback(
    (searchKeyword: string) => {
      if (!isLoaded || !window.kakao?.maps?.services) return;
      if (!searchKeyword.trim() || searchKeyword.trim().length < 2) {
        setResults([]);
        setIsOpenDropdown(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const ps = new window.kakao.maps.services.Places();

      ps.keywordSearch(
        searchKeyword.trim(),
        (data, status) => {
          setIsSearching(false);
          if (status === window.kakao.maps.services.Status.OK) {
            setResults(data || []);
            setIsOpenDropdown(true);
          } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
            setResults([]);
            setIsOpenDropdown(true);
          } else {
            setResults([]);
            setIsOpenDropdown(false);
          }
        },
        { size: 7 }
      );
    },
    [isLoaded]
  );

  // 인풋 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);

    if (val.trim().length >= 2) {
      searchPlaces(val);
    } else {
      setResults([]);
      setIsOpenDropdown(false);
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
    onSelectPlace({
      venueName: '',
      venueAddress: '',
      latitude: 0,
      longitude: 0,
    });
  };

  // 미니맵 렌더링 및 위치 갱신
  useEffect(() => {
    if (!isLoaded || !miniMapRef.current || !latitude || !longitude || latitude === 0) {
      return;
    }

    const kakaoMaps = window.kakao?.maps;
    if (!kakaoMaps) return;

    const coords = new kakaoMaps.LatLng(latitude, longitude);

    if (!mapInstanceRef.current) {
      // 신규 맵 인스턴스 생성
      const map = new kakaoMaps.Map(miniMapRef.current, {
        center: coords,
        level: 3,
      });
      mapInstanceRef.current = map;

      // 커스텀 브랜드 블루 핀 엘리먼트 생성
      const pinEl = document.createElement('div');
      pinEl.className = 'relative flex items-center justify-center -translate-x-1/2 -translate-y-full';
      pinEl.innerHTML = `
        <div class="relative flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] text-white rounded-full shadow-lg border-2 border-white animate-bounce-subtle">
          <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
          </svg>
          <span class="text-xs font-bold leading-none">${venueName || '행사 위치'}</span>
        </div>
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2563EB] rotate-45 border-r border-b border-white"></div>
      `;

      const overlay = new kakaoMaps.CustomOverlay({
        position: coords,
        content: pinEl,
        yAnchor: 1.1,
        zIndex: 10,
      });
      overlay.setMap(map);
      overlayRef.current = overlay;
    } else {
      // 기존 맵 위치 및 핀 갱신
      const map = mapInstanceRef.current;
      map.relayout();
      map.setCenter(coords);
      map.setLevel(3);

      if (overlayRef.current) {
        overlayRef.current.setPosition(coords);
        const pinEl = document.createElement('div');
        pinEl.className = 'relative flex items-center justify-center -translate-x-1/2 -translate-y-full';
        pinEl.innerHTML = `
          <div class="relative flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] text-white rounded-full shadow-lg border-2 border-white animate-bounce-subtle">
            <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
            </svg>
            <span class="text-xs font-bold leading-none">${venueName || '행사 위치'}</span>
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2563EB] rotate-45 border-r border-b border-white"></div>
        `;
        overlayRef.current.setContent(pinEl);
      }
    }
  }, [isLoaded, latitude, longitude, venueName]);

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
              className="absolute right-3 text-muted hover:text-ink p-1 rounded-full hover:bg-neutral-100 transition-colors"
              aria-label="장소 지우기"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. 장소 검색 자동완성 드롭다운 */}
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

      {/* 3. 선택된 주소 요약 칩 */}
      {hasSelectedLocation && venueAddress && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-subtle/60 border border-brand/20 text-xs text-brand font-medium">
          <Navigation className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">도로명: {venueAddress}</span>
        </div>
      )}

      {/* 4. 정밀 상세 위치 인풋 */}
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

      {/* 5. 카카오 미니맵 프리뷰 (높이 160px) */}
      {hasSelectedLocation && (
        <div className="rounded-2xl border border-border overflow-hidden bg-neutral-100 shadow-inner">
          <div className="h-7 px-3 bg-surface/90 border-b border-border/80 flex items-center justify-between text-[11px] text-muted">
            <span className="flex items-center gap-1 font-semibold text-ink">
              <MapPin className="w-3 h-3 text-brand" />
              현장 위치 미리보기
            </span>
            <span className="text-[10px]">카카오맵</span>
          </div>
          <div
            ref={miniMapRef}
            className="w-full h-[160px] relative bg-neutral-100"
            style={{ minHeight: '160px' }}
          >
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface/80 text-xs text-muted gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand" />
                지도를 불러오는 중...
              </div>
            )}
            {loadError && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface/80 text-xs text-red-500">
                {loadError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
