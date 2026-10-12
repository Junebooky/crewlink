'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Loader2, ExternalLink } from 'lucide-react';
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
    } catch (err: any) {
      if (err.name !== 'AbortError') {
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

      {/* 3. 선택된 주소 요약 카드 (다른 카드 섹션과 통일된 UI) */}
      {hasSelectedLocation && venueAddress && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-surface text-xs shadow-2xs">
          <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
          <span className="text-muted font-normal shrink-0">도로명 주소</span>
          <span className="text-ink font-semibold truncate">{venueAddress}</span>
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

      {/* 5. 현장 지도 프리뷰 (높이 160px) */}
      {hasSelectedLocation && latitude && longitude && (
        <div className="rounded-2xl border border-border overflow-hidden bg-surface shadow-2xs">
          <div className="h-8 px-3.5 bg-surface border-b border-border/80 flex items-center justify-between text-[11px] text-muted">
            <span className="flex items-center gap-1.5 font-bold text-ink">
              <MapPin className="w-3.5 h-3.5 text-brand" />
              현장 위치 미리보기
            </span>
            <a
              href={`https://map.kakao.com/link/map/${encodeURIComponent(venueName || '행사 위치')},${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-brand hover:underline font-semibold flex items-center gap-1 transition-colors"
            >
              <span>지도 크게보기</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="w-full h-[160px] relative bg-neutral-100 overflow-hidden">
            {isLoaded && window.kakao?.maps ? (
              <div ref={miniMapRef} className="w-full h-full" />
            ) : (
              <iframe
                title="현장 위치 지도"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(longitude) - 0.005}%2C${Number(latitude) - 0.003}%2C${Number(longitude) + 0.005}%2C${Number(latitude) + 0.003}&layer=mapnik&marker=${latitude}%2C${longitude}`}
                className="w-full h-full border-0 pointer-events-auto"
                loading="lazy"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
