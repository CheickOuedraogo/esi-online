import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f2f5f9',
          100: '#e3eaf2',
          200: '#c8d6e6',
          300: '#a0b7d0',
          400: '#7193b3',
          500: '#4f7495',
          600: '#3d5c7a',
          700: '#1e3a5f',
          800: '#1b3350',
          900: '#172b43',
          950: '#0f1d2e',
        },
        gold: {
          50: '#fdf9ee',
          100: '#f9efcd',
          200: '#f3dc98',
          300: '#ecc75f',
          400: '#e0a825',
          500: '#d4951a',
          600: '#b47616',
          700: '#905817',
          800: '#774618',
          900: '#653a18',
        },
        cream: '#f7f5ef',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out both',
        'fade-up': 'fade-up 400ms ease-out both',
        'scale-in': 'scale-in 500ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
