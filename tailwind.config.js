/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        wood: {
          50: '#FFF8F0',
          100: '#FFFCF7',
          200: '#F5E6D3',
          300: '#E8D5C0',
          400: '#D4A574',
          500: '#C4A882',
          600: '#8B6F47',
          700: '#5C4033',
          800: '#3D2B1F',
        },
        matcha: {
          400: '#A8B5A0',
          500: '#8FA88A',
        },
      },
      fontFamily: {
        display: ['"Noto Serif SC"', 'serif'],
        body: ['"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        wood: '0 2px 12px rgba(92, 64, 51, 0.08)',
        'wood-lg': '0 4px 24px rgba(92, 64, 51, 0.12)',
        'wood-hover': '0 8px 32px rgba(92, 64, 51, 0.16)',
      },
      borderRadius: {
        wood: '8px',
        'wood-lg': '12px',
        'wood-xl': '16px',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 165, 116, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(212, 165, 116, 0)' },
        },
        shake: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(15deg)' },
          '75%': { transform: 'rotate(-15deg)' },
        },
      },
    },
  },
  plugins: [],
};
