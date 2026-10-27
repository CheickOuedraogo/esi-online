import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f3f6ee',
          100: '#e4ebd9',
          200: '#cad7ba',
          300: '#abbf97',
          400: '#8ca672',
          500: '#6f8d51',
          600: '#5a763c',
          700: '#4d6333', // Couleur principale demandée (#4d6333)
          800: '#394b24',
          900: '#243216',
          950: '#141d0c',
        },
        gold: {
          50: '#faf8ee',
          100: '#f2eccb',
          200: '#e5d996',
          300: '#d5c360',
          400: '#c2ab30',
          500: '#ab9322',
          600: '#8c7419',
          700: '#6f5917',
          800: '#5c4915',
          900: '#4a3a13',
        },
        cream: '#f6f7f2',
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
