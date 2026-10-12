/**
 * Search Bar Rolling Placeholder Constants & Types
 */

export type DatePreset = 'all' | 'today_tomorrow' | 'this_weekend' | 'next_week' | 'custom';

export const ROLLING_PLACEHOLDERS = [
  '관심 있는 행사 찾기 (예: 팝업스토어, 페스티벌)',
  '가까운 핫플로 찾기 (예: 성수, 코엑스, 킨텍스)',
  '자신 있는 역할로 찾기 (예: 리셉션, 동선 안내, 운영)',
] as const;

export const ROLLING_INTERVAL_MS = 3600;
export const ROLLING_DURATION_MS = 450;
