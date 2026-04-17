/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx,html}',
    './public/index.html'
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          50: '#faf8f3',
          100: '#f5f1e8',
          200: '#ebe3d5',
          300: '#ddd0bc',
          400: '#c9b8a0',
          500: '#b5a088',
          600: '#9d8872',
          700: '#83715f',
          800: '#6b5a4f',
          900: '#504238',
        },
        accent: {
          orange: '#ff8c42',
          terracotta: '#e07856',
          rust: '#c85a3a',
          sage: '#a89968',
          gold: '#d4a574',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Segoe UI"', 'sans-serif'],
        display: ['"Poppins"', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-gentle': 'pulseGentle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.8' },
        },
      },
    },
  },
  plugins: [],
}

