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
