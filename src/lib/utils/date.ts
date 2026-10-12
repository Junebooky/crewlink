/**
 * KST (Asia/Seoul, UTC+9) 동적 날짜 유틸리티
 */

export const DEFAULT_BASE_DATE_STR = '2026-10-12';

/**
 * 한국 표준시(KST, UTC+9) 기준 Date 객체 반환
 */
export function getKSTDate(date?: Date): Date {
  const target = date ? new Date(date) : new Date();
  const utc = target.getTime() + target.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 60 * 60000);
}

/**
 * 한국 표준시(KST, UTC+9) 기준 'YYYY-MM-DD' 문자열 반환
 */
export function getKSTDateString(date?: Date): string {
  const kst = getKSTDate(date);
  const year = kst.getFullYear();
  const month = String(kst.getMonth() + 1).padStart(2, '0');
  const day = String(kst.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * YYYY-MM-DD 기준 일수 더하기/빼기
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 요일 인덱스 (0: 일, 1: 월, ..., 6: 토)
 */
export function getDayOfWeekIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCDay();
}

/**
 * 한국어 요일 문자열 ('일' ~ '토')
 */
export function getDayOfWeekKorean(dateStr: string): string {
  const KOREAN_DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  return KOREAN_DAYS[getDayOfWeekIndex(dateStr)];
}

export interface DateRangeResult {
  start: string;
  end: string;
  label: string;
}

/**
 * 오늘·내일 범위 반환
 */
export function getTodayTomorrowRange(baseDateStr?: string): DateRangeResult {
  const today = baseDateStr || DEFAULT_BASE_DATE_STR;
  const tomorrow = addDays(today, 1);
  const startFmt = today.slice(5).replace('-', '.');
  const endFmt = tomorrow.slice(5).replace('-', '.');
  return {
    start: today,
    end: tomorrow,
    label: `오늘·내일 (${startFmt}~${endFmt})`,
  };
}

/**
 * 이번 주 (월~일) 범위 반환
 */
export function getThisWeekRange(baseDateStr?: string): DateRangeResult {
  const today = baseDateStr || DEFAULT_BASE_DATE_STR;
  const dayIndex = getDayOfWeekIndex(today); // 0: Sun, 1: Mon, ..., 6: Sat
  const diffToMonday = dayIndex === 0 ? -6 : 1 - dayIndex;
  const monday = addDays(today, diffToMonday);
  const sunday = addDays(monday, 6);
  const startFmt = monday.slice(5).replace('-', '.');
  const endFmt = sunday.slice(5).replace('-', '.');
  return {
    start: monday,
    end: sunday,
    label: `이번 주 (${startFmt}~${endFmt})`,
  };
}

/**
 * 이번 주말 (토~일) 범위 반환
 */
export function getThisWeekendRange(baseDateStr?: string): DateRangeResult {
  const today = baseDateStr || DEFAULT_BASE_DATE_STR;
  const dayIndex = getDayOfWeekIndex(today);
  const diffToMonday = dayIndex === 0 ? -6 : 1 - dayIndex;
  const monday = addDays(today, diffToMonday);
  const saturday = addDays(monday, 5);
  const sunday = addDays(monday, 6);
  const startFmt = saturday.slice(5).replace('-', '.');
  const endFmt = sunday.slice(5).replace('-', '.');
  return {
    start: saturday,
    end: sunday,
    label: `이번 주말 (${startFmt}~${endFmt})`,
  };
}

/**
 * 다음 주 (월~일) 범위 반환
 */
export function getNextWeekRange(baseDateStr?: string): DateRangeResult {
  const today = baseDateStr || DEFAULT_BASE_DATE_STR;
  const dayIndex = getDayOfWeekIndex(today);
  const diffToMonday = dayIndex === 0 ? -6 : 1 - dayIndex;
  const monday = addDays(today, diffToMonday);
  const nextMonday = addDays(monday, 7);
  const nextSunday = addDays(nextMonday, 6);
  const startFmt = nextMonday.slice(5).replace('-', '.');
  const endFmt = nextSunday.slice(5).replace('-', '.');
  return {
    start: nextMonday,
    end: nextSunday,
    label: `다음 주 (${startFmt}~${endFmt})`,
  };
}

/**
 * 행사 일정과 필터 일정의 중첩(Overlap) 여부 판별
 */
export function checkDateOverlap(
  eventStart: string,
  eventEnd: string,
  targetStart: string,
  targetEnd: string
): boolean {
  return !(eventEnd < targetStart || eventStart > targetEnd);
}

export interface DeadlineInfo {
  dateLabel: string;
  dDayLabel: string;
  diffDays: number;
}

/**
 * 지원 마감 정보 (1행: 마감 일자 고정 표기, 2행: D-Day 표기)
 */
export function getDeadlineInfo(deadlineStr: string, baseDateStr?: string): DeadlineInfo {
  const parts = deadlineStr.split('-');
  const monthDay =
    parts.length === 3 ? `${parts[1]}.${parts[2]}` : deadlineStr.slice(5).replace('-', '.');
  const dateLabel = `지원 마감 ${monthDay}`;

  const today = baseDateStr || DEFAULT_BASE_DATE_STR;
  const [ty, tm, td] = today.split('-').map(Number);
  const [dy, dm, dd] = deadlineStr.split('-').map(Number);
  const currentMs = Date.UTC(ty, tm - 1, td);
  const deadlineMs = Date.UTC(dy, dm - 1, dd);
  const diffDays = Math.round((deadlineMs - currentMs) / (1000 * 60 * 60 * 24));

  let dDayLabel = `D-${diffDays}`;
  if (diffDays < 0) {
    dDayLabel = '마감';
  } else if (diffDays === 0) {
    dDayLabel = '오늘 마감';
  }

  return { dateLabel, dDayLabel, diffDays };
}
