import { describe, it, expect } from 'vitest';
import { getPublicEvents } from './events';

describe('Geospatial Events Data & Bounding Box Logic', () => {
  const events = getPublicEvents();

  it('모든 기본 공고에 유효한 대한민국 WGS84 위도(33~39) 및 경도(124~131)가 설정되어 있어야 한다', () => {
    expect(events.length).toBeGreaterThan(0);
    events.forEach((event) => {
      expect(event.latitude).toBeDefined();
      expect(event.longitude).toBeDefined();
      expect(typeof event.latitude).toBe('number');
      expect(typeof event.longitude).toBe('number');

      // 대한민국 좌표 범위 검증
      expect(event.latitude!).toBeGreaterThanOrEqual(33.0);
      expect(event.latitude!).toBeLessThanOrEqual(39.0);
      expect(event.longitude!).toBeGreaterThanOrEqual(124.0);
      expect(event.longitude!).toBeLessThanOrEqual(131.0);
    });
  });

  it('서울 강남/코엑스 바운딩 박스 쿼리 시 코엑스 공고가 정상 필터링되어야 한다', () => {
    // 코엑스 부근 Bounding Box (37.50 ~ 37.52, 127.05 ~ 127.07)
    const minLat = 37.50;
    const maxLat = 37.52;
    const minLng = 127.05;
    const maxLng = 127.07;

    const inBounds = events.filter((e) => {
      if (!e.latitude || !e.longitude) return false;
      return (
        e.latitude >= minLat &&
        e.latitude <= maxLat &&
        e.longitude >= minLng &&
        e.longitude <= maxLng
      );
    });

    expect(inBounds.length).toBeGreaterThanOrEqual(1);
    expect(inBounds.some((e) => e.venueAddress.includes('코엑스') || e.title.includes('코엑스') || e.regionId === 'gangnam')).toBe(true);
  });

  it('성수 에스팩토리 바운딩 박스 쿼리 시 성수 공고가 정상 필터링되어야 한다', () => {
    // 성수동 부근 Bounding Box (37.53 ~ 37.55, 127.04 ~ 127.07)
    const minLat = 37.53;
    const maxLat = 37.55;
    const minLng = 127.04;
    const maxLng = 127.07;

    const inBounds = events.filter((e) => {
      if (!e.latitude || !e.longitude) return false;
      return (
        e.latitude >= minLat &&
        e.latitude <= maxLat &&
        e.longitude >= minLng &&
        e.longitude <= maxLng
      );
    });

    expect(inBounds.length).toBeGreaterThanOrEqual(1);
    expect(inBounds.some((e) => e.regionId === 'seongsu')).toBe(true);
  });

  it('굿빌더 스타일 브랜드 칩 라벨 생성 로직이 정확히 포맷팅되어야 한다', () => {
    events.forEach((event) => {
      const wageManwon = Math.round(event.dailyWageWon / 10000);
      const chipLabel = `${wageManwon}만원 | ${event.categoryLabel}`;

      expect(chipLabel).toMatch(/^\d+만원 \| (팝업스토어|전시·박람회|브랜드 행사|페스티벌)$/);
    });
  });
});
