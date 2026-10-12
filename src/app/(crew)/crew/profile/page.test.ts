import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('크루 프로필 관리 페이지 UI/UX 검증', () => {
  const profilePagePath = path.resolve(process.cwd(), 'src/app/(crew)/crew/profile/page.tsx');
  const profileContent = fs.readFileSync(profilePagePath, 'utf-8');

  it('3D Clay 에셋 파일들이 public/assets/clay/ 디렉토리에 모두 실존해야 한다', () => {
    const requiredAssets = [
      'profile.png',
      'phone.png',
      'shirt.png',
      'quote.png',
      'language.png',
    ];

    for (const asset of requiredAssets) {
      const assetPath = path.resolve(process.cwd(), 'public/assets/clay', asset);
      expect(fs.existsSync(assetPath)).toBe(true);
    }
  });

  it('각 섹션 헤더에 매핑된 3D Clay 아이콘이 next/image로 올바르게 배치되어야 한다', () => {
    expect(profileContent).toContain('/assets/clay/profile.png');
    expect(profileContent).toContain('/assets/clay/phone.png');
    expect(profileContent).toContain('/assets/clay/shirt.png');
    expect(profileContent).toContain('/assets/clay/quote.png');
    expect(profileContent).toContain('/assets/clay/language.png');

    // 공통 아이콘 규격
    expect(profileContent).toMatch(/object-contain shrink-0/);
    // 공통 제목 컨테이너 규격
    expect(profileContent).toContain('flex items-center gap-2 mb-4 text-left');
  });

  it('유니폼 섹션 메인 제목에만 shirt.png가 배치되고 하위 개별 항목에는 아이콘이 없어야 한다', () => {
    // shirt.png는 유니폼 섹션 제목에만 1회 사용되어야 함
    const shirtMatches = profileContent.match(/\/assets\/clay\/shirt\.png/g);
    expect(shirtMatches?.length).toBe(1);

    // 하위 항목 라벨에 아이콘 컴포넌트가 없어야 함
    expect(profileContent).not.toMatch(/<Ruler/);
    expect(profileContent).not.toMatch(/<Footprints/);
    expect(profileContent).not.toMatch(/<Clock/);
  });

  it('모든 카드 컨테이너의 외곽선 테두리가 제거되고 입체 그림자(Elevation Shadow)가 적용되어야 한다', () => {
    expect(profileContent).toContain('shadow-[0_0_0_1px_rgba(15,23,42,0.04)');
    expect(profileContent).toContain('hover:-translate-y-1');

    // 카드 컨테이너 클래스에 테두리 관련 클래스가 없어야 함
    expect(profileContent).not.toContain('border-border-subtle p-5');
  });

  it('라벨과 인풋 간 수직 여백(mb-2)과 유니폼 4분할 그리드가 표준 규격으로 적용되어야 한다', () => {
    // 라벨 공통 스타일 mb-2 text-left 검증
    expect(profileContent).toContain('text-xs sm:text-sm font-bold text-ink mb-2 text-left');

    // 유니폼 4분할 그리드 검증
    expect(profileContent).toContain('grid grid-cols-2 gap-4 sm:gap-5');

    // 폼 컨테이너 space-y 검증
    expect(profileContent).toContain('space-y-5 sm:space-y-6');
  });
});
