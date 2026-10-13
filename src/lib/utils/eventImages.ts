/**
 * Event category fallback image resolution utility
 * Maps event categories and titles to high quality Unsplash preview images
 */
export function getCategoryFallbackImage(category?: string | null, title?: string): string {
  const normalizedCat = (category || '').toLowerCase();
  const normalizedTitle = (title || '').toLowerCase();

  if (
    normalizedCat === 'festival' ||
    normalizedCat === 'concert' ||
    normalizedTitle.includes('페스티벌') ||
    normalizedTitle.includes('콘서트') ||
    normalizedTitle.includes('뮤직')
  ) {
    return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80';
  }

  if (
    normalizedCat === 'conference' ||
    normalizedCat === 'seminar' ||
    normalizedTitle.includes('컨퍼런스') ||
    normalizedTitle.includes('세미나') ||
    normalizedTitle.includes('ai')
  ) {
    return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop&q=80';
  }

  if (
    normalizedCat === 'expo' ||
    normalizedCat === 'exhibition' ||
    normalizedTitle.includes('전시') ||
    normalizedTitle.includes('박람회') ||
    normalizedTitle.includes('모빌리티')
  ) {
    return 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=500&auto=format&fit=crop&q=80';
  }

  if (
    normalizedCat === 'popup' ||
    normalizedCat === 'brand' ||
    normalizedCat === 'event' ||
    normalizedTitle.includes('팝업') ||
    normalizedTitle.includes('스토어')
  ) {
    return 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=500&auto=format&fit=crop&q=80';
  }

  return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=80';
}

/**
 * 업무 태그를 최대 4글자 이내로 정갈하게 압축하는 함수
 */
export function formatJobTag(tag: string): string {
  const raw = tag.trim().replace(/\s+/g, '');
  if (raw.includes('부스') || raw.includes('체험')) return '부스지원';
  if (raw.includes('동선') || raw.includes('대기열')) return '동선관리';
  if (raw.includes('안내') || raw.includes('응대')) return '현장안내';
  if (raw.includes('운영') || raw.includes('스태프')) return '행사운영';
  if (raw.includes('설치') || raw.includes('무대')) return '무대설치';
  if (raw.includes('티켓') || raw.includes('검표')) return '티켓검표';
  if (raw.includes('주차') || raw.includes('차량')) return '주차안내';
  return tag.length > 4 ? tag.slice(0, 4) : tag;
}
