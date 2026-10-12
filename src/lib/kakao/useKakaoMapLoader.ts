'use client';

import { useState, useEffect } from 'react';

/**
 * Kakao Maps SDK 안전 비동기 로더 훅
 * autoload=false 모드에서 kakao.maps.load() 완료를 보장합니다.
 */
export function useKakaoMapLoader() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 이미 kakao.maps 인스턴스가 완전히 로드되어 있는 경우
    if (window.kakao?.maps?.Map && window.kakao?.maps?.services) {
      setIsLoaded(true);
      return;
    }

    const appKey =
      process.env.NEXT_PUBLIC_KAKAO_MAP_CLIENT_KEY ||
      process.env.NEXT_PUBLIC_KAKAO_JS_KEY ||
      '';

    if (!appKey) {
      setLoadError('카카오 지도 클라이언트 키가 설정되지 않았습니다.');
      return;
    }

    const initMaps = () => {
      if (window.kakao?.maps?.load) {
        window.kakao.maps.load(() => {
          setIsLoaded(true);
        });
        return true;
      }
      return false;
    };

    if (initMaps()) return;

    // 이미 스크립트 엘리먼트가 DOM에 있는지 확인
    const existingScript = document.getElementById('kakao-maps-sdk') as HTMLScriptElement;
    if (existingScript) {
      const handleLoad = () => {
        initMaps();
      };
      existingScript.addEventListener('load', handleLoad);
      // 스크립트가 이미 로드 완료되어 load 이벤트가 다시 발생하지 않는 경우 대비 폴링
      const pollTimer = setInterval(() => {
        if (initMaps()) {
          clearInterval(pollTimer);
        }
      }, 100);
      return () => {
        existingScript.removeEventListener('load', handleLoad);
        clearInterval(pollTimer);
      };
    }

    // 스크립트 동적 생성 및 삽입
    const script = document.createElement('script');
    script.id = 'kakao-maps-sdk';
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services,clusterer&autoload=false`;
    script.async = true;
    script.onload = () => {
      initMaps();
    };
    script.onerror = () => {
      setLoadError('카카오 지도 SDK를 불러오지 못했습니다.');
    };

    document.head.appendChild(script);
  }, []);

  return { isLoaded, loadError };
}
