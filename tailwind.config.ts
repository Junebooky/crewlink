import type { Config } from 'tailwindcss';

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
          DEFAULT: '#1E60F3',
          hover: '#164BC4',
          subtle: '#E8F0FE',
        },
        canvas: '#F5F7FB',
        surface: '#FFFFFF',
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
