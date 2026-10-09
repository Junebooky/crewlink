/**
 * CrewLink Design Tokens & WCAG 2.2 AA Theme Constants
 * Single source of truth: palette.json
 */
import palette from './palette.json';

export const paletteTokens = palette;

export const colors = {
  primary: {
    DEFAULT: palette.brand,
    hover: palette['brand-hover'],
    subtle: palette['brand-soft'],
  },
  background: {
    canvas: palette.canvas,
    surface: palette.surface,
    muted: palette['surface-muted'],
    card: palette.surface,
  },
  border: {
    subtle: palette['border-subtle'],
    default: palette.border,
    strong: palette['border-strong'],
  },
  state: {
    info: {
      text: palette['brand-strong'],
      bg: palette['brand-subtle'],
      border: palette['brand-border'],
    },
    success: {
      text: palette['brand-strong'],
      bg: palette['brand-soft'],
      border: palette['brand-border'],
    },
    attention: {
      text: palette.muted,
      bg: palette['surface-muted'],
      border: palette['neutral-border'],
    },
    critical: {
      text: palette.error,
      bg: palette['error-bg'],
      border: palette['error-border'],
    },
    neutral: {
      text: palette.muted,
      bg: palette['surface-muted'],
      border: palette['neutral-border'],
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
