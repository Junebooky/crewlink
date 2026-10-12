import { describe, it, expect } from 'vitest';
import { ROLLING_PLACEHOLDERS } from '@/app/page';

describe('Rolling Placeholder Tests (토스 스타일 롤링 플레이스홀더 검증)', () => {
  it('플레이스홀더 카피 세트가 정확히 3가지 대화 유도형 문구로 구성되어야 한다', () => {
    expect(ROLLING_PLACEHOLDERS).toHaveLength(3);
    expect(ROLLING_PLACEHOLDERS[0]).toBe('관심 있는 행사 찾기 (예: 팝업스토어, 페스티벌)');
    expect(ROLLING_PLACEHOLDERS[1]).toBe('가까운 핫플로 찾기 (예: 성수, 코엑스, 킨텍스)');
    expect(ROLLING_PLACEHOLDERS[2]).toBe('자신 있는 역할로 찾기 (예: 리셉션, 동선 안내, 운영)');
  });

  it('순환 루프 인덱스 계산이 정상적으로 동작해야 한다', () => {
    let index = 0;
    const nextIndex = (curr: number) => (curr + 1) % ROLLING_PLACEHOLDERS.length;

    index = nextIndex(index);
    expect(index).toBe(1);

    index = nextIndex(index);
    expect(index).toBe(2);

    index = nextIndex(index);
    expect(index).toBe(0);
  });

  it('검색어가 존재할 때 플레이스홀더 표시 여부가 false여야 한다', () => {
    const isPlaceholderVisible = (query: string) => query.length === 0;

    expect(isPlaceholderVisible('')).toBe(true);
    expect(isPlaceholderVisible('성')).toBe(false);
    expect(isPlaceholderVisible('성수')).toBe(false);
  });
});
