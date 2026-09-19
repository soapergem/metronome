/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0d1117',
        surface: '#161b22',
        surfaceHover: '#21262d',
        accent: '#38bdf8',
        accentGlow: '#0284c7',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.25)', opacity: '1' },
        },
        pendulum: {
          '0%': { transform: 'rotate(-28deg)' },
          '50%': { transform: 'rotate(28deg)' },
          '100%': { transform: 'rotate(-28deg)' },
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 0.3s cubic-bezier(0.4, 0, 0.6, 1)',
      }
    },
  },
  plugins: [],
}
