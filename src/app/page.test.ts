import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getCategoryFallbackImage } from './page';

describe('Home Page Revamp Verification', () => {
  it('히어로 3D 에셋 public/assets/clay/hero.png 파일이 실존해야 한다', () => {
    const heroPath = path.resolve(process.cwd(), 'public/assets/clay/hero.png');
    expect(fs.existsSync(heroPath), 'hero.png 에셋이 존재해야 합니다').toBe(true);
    const stat = fs.statSync(heroPath);
    expect(stat.size, 'hero.png 크기가 0보다 커야 합니다').toBeGreaterThan(1000);
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

  it('홈 화면 파일에 #E8F3FE 배경색과 핫한 공고 및 방금 올라왔어요 섹션이 포함되어야 한다', () => {
    const pageContent = fs.readFileSync(path.resolve(process.cwd(), 'src/app/page.tsx'), 'utf-8');
    expect(pageContent).toContain('#E8F3FE');
    expect(pageContent).toContain('지금 핫한 공고');
    expect(pageContent).toContain('방금 올라왔어요');
    expect(pageContent).toContain('/assets/clay/hero.png');
    expect(pageContent).toContain('/assets/clay/coin.png');
  });
});
