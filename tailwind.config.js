/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Midnight Luxe Design System
        'midnight': {
          950: '#020617', // bg-slate-950
          900: '#0f172a', // bg-slate-900
          800: '#1e293b', // border-slate-800
        },
        // Accents Fonctionnels
        'resto': '#f97316',      // orange-500
        'hotel': '#6366f1',      // indigo-500
        'sommelier': '#881337',  // rose-900 (Bordeaux)
        'danger': '#dc2626',     // red-600
      },
      animation: {
        'pulse-danger': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
