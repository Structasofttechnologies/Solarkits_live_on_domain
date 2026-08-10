/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#28377F',
          50: '#EFF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#4F59BD',
          500: '#28377F',
          600: '#1F2B66',
          700: '#17204D',
          800: '#101634',
          900: '#080B1B',
        },
        secondary: {
          DEFAULT: '#F39220',
          50: '#FFF8F0',
          100: '#FFEEDD',
          200: '#FFD9B3',
          300: '#FFBE80',
          400: '#F8A64D',
          500: '#F39220',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        orange: {
          DEFAULT: '#F39220',
          50: '#FFF8F0',
          100: '#FFEEDD',
          200: '#FFD9B3',
          300: '#FFBE80',
          400: '#F8A64D',
          500: '#F39220',
          600: '#E07E0D',
          700: '#B86305',
        },
        purple: {
          DEFAULT: '#35297E',
          50: '#F4F3FA',
          100: '#E8E6F5',
          200: '#D1CEEB',
          300: '#A39CD7',
          400: '#756AC4',
          500: '#35297E',
          600: '#2A2065',
          700: '#20184D',
          800: '#151034',
          900: '#0B081B',
        },
        accent: {
          DEFAULT: '#308D08',
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#308D08',
          600: '#257006',
          700: '#1C5304',
          pista: '#58D38F',
        },
        solar: {
          blue: '#28377F',
          yellow: '#F39220',
          orange: '#F39220',
          purple: '#35297E',
          green: '#308D08',
          pista: '#58D38F',
          bg: '#F2F6FA',
          surface: '#FFFFFF',
          navy: '#28377F',
          slate: '#475569',
          border: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.10), 0 2px 6px -2px rgba(0,0,0,0.06)',
        'sidebar': '2px 0 8px 0 rgba(0,0,0,0.08)',
        'topbar': '0 1px 4px 0 rgba(0,0,0,0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        }
      }
    },
  },
  plugins: [],
}