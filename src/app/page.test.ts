import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getCategoryFallbackImage } from '@/lib/utils/eventImages';

describe('Home Page Revamp Verification', () => {
  it('히어로 3D 투명 에셋 public/assets/clay/hero_white.png 파일이 실존해야 한다', () => {
    const heroPath = path.resolve(process.cwd(), 'public/assets/clay/hero_white.png');
    expect(fs.existsSync(heroPath), 'hero_white.png 에셋이 존재해야 합니다').toBe(true);
    const stat = fs.statSync(heroPath);
    expect(stat.size, 'hero_white.png 크기가 0보다 커야 합니다').toBeGreaterThan(1000);
  });

  it('Unsplash 썸네일 fallback 매핑이 명세서 URL과 일치해야 한다', () => {
    // 1. 콘서트 / 페스티벌
    expect(getCategoryFallbackImage('festival')).toBe(
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80'
    );
    expect(getCategoryFallbackImage(null, '뮤직 페스티벌 스태프')).toBe(
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80'
    );

    // 2. 컨퍼런스 / 세미나
    expect(getCategoryFallbackImage('conference')).toBe(
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop&q=80'
    );
    expect(getCategoryFallbackImage(null, '글로벌 AI 컨퍼런스')).toBe(
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop&q=80'
    );

    // 3. 전시 / 박람회
    expect(getCategoryFallbackImage('expo')).toBe(
      'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=500&auto=format&fit=crop&q=80'
    );
    expect(getCategoryFallbackImage(null, '서울 모빌리티 엑스포')).toBe(
      'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=500&auto=format&fit=crop&q=80'
    );

    // 4. 팝업스토어 / 이벤트
    expect(getCategoryFallbackImage('popup')).toBe(
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=500&auto=format&fit=crop&q=80'
    );

    // 5. 기본값
    expect(getCategoryFallbackImage(null, '일반 공고')).toBe(
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=80'
    );
  });

  it('홈 화면 파일에 순백색 bg-white 배경과 토스풍 카드 엘리베이션 그림자가 포함되어야 한다', () => {
    const pageContent = fs.readFileSync(path.resolve(process.cwd(), 'src/app/page.tsx'), 'utf-8');
    expect(pageContent).toContain('bg-white');
    expect(pageContent).toContain('지금 핫한 공고');
    expect(pageContent).toContain('방금 올라왔어요');
    expect(pageContent).toContain('/assets/clay/hero_white.png');
    expect(pageContent).toContain('/assets/clay/coin.png');
    expect(pageContent).toContain('shadow-[0_8px_30px_rgba(0,0,0,0.06)]');
    expect(pageContent).toContain('shadow-[0_4px_16px_rgba(0,0,0,0.05)]');
    expect(pageContent).toContain('shadow-[0_4px_16px_rgba(0,0,0,0.04)]');
    expect(pageContent).toContain('shadow-[0_2px_8px_rgba(0,0,0,0.04)]');
  });

  it('공고 리스트 카드가 컴팩트 모바일 4줄 고정 구조 및 썸네일 규격을 따라야 한다', () => {
    const pageContent = fs.readFileSync(path.resolve(process.cwd(), 'src/app/page.tsx'), 'utf-8');
    expect(pageContent).toContain('w-24 h-24 sm:w-28 sm:h-28');
    expect(pageContent).toContain('items-stretch');
    expect(pageContent).toContain('flex-1 min-w-0 flex flex-col justify-between py-0.5');
    expect(pageContent).toContain('text-sm font-bold text-ink truncate mt-0.5');
    expect(pageContent).toContain('overflow-x-auto no-scrollbar whitespace-nowrap min-w-0 flex-1');
  });

  it('방금 올라왔어요 섹션이 통합 헤더바 구조를 따라야 한다', () => {
    const pageContent = fs.readFileSync(path.resolve(process.cwd(), 'src/app/page.tsx'), 'utf-8');
    expect(pageContent).toContain('방금 올라왔어요');
    expect(pageContent).toContain('최신순');
    expect(pageContent).toContain('지도형');
    expect(pageContent).toContain('추천순');
  });
});
