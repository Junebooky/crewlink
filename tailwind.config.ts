import type { Config } from 'tailwindcss';
import palette from './src/lib/tokens/palette.json';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: palette.brand,
          hover: palette['brand-hover'],
          strong: palette['brand-strong'],
          soft: palette['brand-soft'],
          subtle: palette['brand-subtle'],
          border: palette['brand-border'],
          inverse: palette['brand-inverse'],
        },
        canvas: palette.canvas,
        surface: {
          DEFAULT: palette.surface,
          muted: palette['surface-muted'],
        },
        ink: palette.ink,
        muted: palette.muted,
        inverse: {
          DEFAULT: palette.inverse,
          muted: palette['inverse-muted'],
        },
        border: {
          DEFAULT: palette.border,
          subtle: palette['border-subtle'],
          strong: palette['border-strong'],
        },
        'neutral-border': palette['neutral-border'],
        error: {
          DEFAULT: palette.error,
          bg: palette['error-bg'],
          border: palette['error-border'],
        },
        disabled: palette.disabled,
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
      },
      transitionDuration: {
        fast: '140ms',
        standard: '220ms',
        sheet: '320ms',
      },
      transitionTimingFunction: {
        settle: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
