/**
 * CrewLink Design Tokens & WCAG 2.2 AA Theme Constants
 */

export const colors = {
  primary: {
    DEFAULT: '#1E60F3',
    hover: '#164BC4',
    subtle: '#E8F0FE',
  },
  background: {
    canvas: '#F5F7FB',
    surface: '#FFFFFF',
    muted: '#F0F3F8',
    card: '#FFFFFF',
  },
  border: {
    subtle: '#E2E8F0',
    default: '#CBD5E1',
    strong: '#94A3B8',
  },
  state: {
    info: {
      text: '#194DA8',
      bg: '#EDF3FF',
      border: '#C7DCFE',
    },
    success: {
      text: '#08734E',
      bg: '#E7F5EE',
      border: '#B6E6CE',
    },
    attention: {
      text: '#895400',
      bg: '#FFF3D9',
      border: '#FDE19E',
    },
    critical: {
      text: '#BB2449',
      bg: '#FFF0F3',
      border: '#FDC4D0',
    },
    neutral: {
      text: '#526174',
      bg: '#EDF1F6',
      border: '#D5DCE5',
    },
  },
} as const;

export const motionTokens = {
  duration: {
    fast: '140ms',
    standard: '220ms',
    sheet: '320ms',
  },
  easing: {
    settle: 'cubic-bezier(0.22, 1, 0.36, 1)',
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export const typography = {
  fontFamily:
    '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif',
} as const;
