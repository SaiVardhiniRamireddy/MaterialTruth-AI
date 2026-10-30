/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#effaf5', 100: '#d8f3e6', 200: '#b3e6cf', 300: '#80d2b2', 400: '#4bb791',
          500: '#279c78', 600: '#197e61', 700: '#156550', 800: '#135141', 900: '#114337',
        },
        teal: { 50: '#effcfb', 100: '#d6f6f4', 400: '#3ccbc4', 500: '#20aeaa', 600: '#178b8a', 700: '#17706f' },
        ink: { 900: '#0f1f1a', 700: '#334641', 500: '#5f716c', 400: '#87958f', 200: '#dfe6e3', 100: '#eef2f0', 50: '#f6f8f7' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,40,32,.04), 0 4px 16px rgba(16,40,32,.06)',
        lift: '0 2px 4px rgba(16,40,32,.05), 0 12px 32px rgba(16,40,32,.10)',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
        pulseRing: { '0%': { transform: 'scale(.9)', opacity: .7 }, '100%': { transform: 'scale(1.6)', opacity: 0 } },
      },
      animation: { fadeUp: 'fadeUp .45s ease-out both', pulseRing: 'pulseRing 1.4s ease-out infinite' },
    },
  },
  plugins: [],
};
