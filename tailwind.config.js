/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palace Luxe Design System
        'palace': {
          midnight: '#0a0f1a',
          navy: '#0d1321',
          deep: '#111827',
          charcoal: '#1a2234',
        },
        'gold': {
          DEFAULT: '#c9a962',
          light: '#d4b872',
          dark: '#a08040',
        },
        'ivory': {
          DEFAULT: '#f5f0e6',
          light: '#faf8f5',
          muted: '#d4cfc5',
        },
        // Module Colors
        'resto': '#722f37',
        'hotel': '#1e3a5f',
        'sommelier': '#6b2d3c',
        'stock': '#2d5a4a',
        'ruby': '#9b2335',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
}
