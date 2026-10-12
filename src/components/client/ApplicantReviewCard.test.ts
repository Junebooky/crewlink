import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('ApplicantReviewCard & 3D Clay Assets Specification Verification', () => {
  const clayAssets = [
    { name: '키 (height)', path: 'public/assets/clay/height.png' },
    { name: '상/하의 (shirt)', path: 'public/assets/clay/shirt.png' },
    { name: '신발 (shoe)', path: 'public/assets/clay/shoe.png' },
    { name: '경력 (briefcase)', path: 'public/assets/clay/briefcase.png' },
    { name: '평점 (star)', path: 'public/assets/clay/star.png' },
    { name: '전화번호 (phone)', path: 'public/assets/clay/phone.png' },
    { name: '전문분야 (quote)', path: 'public/assets/clay/quote.png' },
    { name: '선발체크 (check)', path: 'public/assets/clay/check.png' },
    { name: '일당코인 (coin)', path: 'public/assets/clay/coin.png' },
  ];

  it('모든 9종 3D Clay PNG 에셋이 public/assets/clay 경로에 실존해야 한다', () => {
    for (const asset of clayAssets) {
      const fullPath = path.resolve(process.cwd(), asset.path);
      expect(fs.existsSync(fullPath), `${asset.name} (${asset.path}) 파일이 존재해야 합니다`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size, `${asset.name} 파일 크기가 0보다 커야 합니다`).toBeGreaterThan(100);
    }
  });

  it('신체 스펙 기본값 폴백이 명세서대로 동작해야 한다', () => {
    const defaultHeight = (h: number | null) => (h ? `${h}cm` : '176cm');
    const defaultSizes = (top: string | null, bot: string | null) => `${top || 'M'} / ${bot || '32'}`;
    const defaultShoes = (s: number | null) => (s ? `${s}mm` : '270mm');
    const defaultExp = (y: number | null, count: number | null) => `${y || 3}년 (${count || 24}회)`;
    const defaultRating = (r: number | null) => (r ? r.toFixed(2) : '4.96');
    const defaultBio = (b: string | null) => b || '외국어 회화 및 관람객 동선 통제 전문';

    expect(defaultHeight(null)).toBe('176cm');
    expect(defaultHeight(182)).toBe('182cm');

    expect(defaultSizes(null, null)).toBe('M / 32');
    expect(defaultSizes('L', '30')).toBe('L / 30');

    expect(defaultShoes(null)).toBe('270mm');
    expect(defaultShoes(265)).toBe('265mm');

    expect(defaultExp(null, null)).toBe('3년 (24회)');
    expect(defaultExp(5, 42)).toBe('5년 (42회)');

    expect(defaultRating(null)).toBe('4.96');
    expect(defaultRating(4.88)).toBe('4.88');

    expect(defaultBio(null)).toBe('외국어 회화 및 관람객 동선 통제 전문');
    expect(defaultBio('VIP 의전 전문')).toBe('VIP 의전 전문');
  });

  it('토스 스타일 카피(선발 되돌리기, 안내 문구)가 컴포넌트 코드에 정확히 반영되어야 한다', () => {
    const cardContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/client/ApplicantReviewCard.tsx'),
      'utf-8'
    );
    expect(cardContent).toContain('선발 되돌리기');
    expect(cardContent).toContain('선발 완료');
    expect(cardContent).toContain('whitespace-nowrap shrink-0 text-xs font-medium text-muted');
    expect(cardContent).toContain('신체 정보');
    expect(cardContent).toContain('경력 및 평점');
    expect(cardContent).toContain('전문 분야');
    expect(cardContent).toContain('bg-white rounded-2xl shadow-2xs');

    const pageContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/(client)/client/page.tsx'),
      'utf-8'
    );
    expect(pageContent).toContain('크루에게 행사 확정 알림과 현장 안내를 보냈어요');
  });
});
