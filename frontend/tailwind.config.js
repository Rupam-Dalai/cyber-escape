/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hunt: {
          bg: '#080B10',
          surface: '#111720',
          elevated: '#18202B',
          border: 'rgba(255, 255, 255, 0.08)',
          borderBright: 'rgba(255, 255, 255, 0.18)',
          gold: '#F59E0B',
          goldGlow: 'rgba(245, 158, 11, 0.4)',
          cyan: '#06B6D4',
          cyanGlow: 'rgba(6, 182, 212, 0.4)',
          emerald: '#10B981',
          rose: '#EF4444',
          textMain: '#F3F4F6',
          textMuted: '#9CA3AF'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
