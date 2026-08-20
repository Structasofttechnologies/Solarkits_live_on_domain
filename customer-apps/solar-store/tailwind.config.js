/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SolarKits Brand Colors
        primary: {
          DEFAULT: '#1565C0',
          50:  '#E3F0FF',
          100: '#BAD7FD',
          200: '#7FB4F9',
          300: '#4A91F0',
          400: '#2274E0',
          500: '#1565C0',
          600: '#0F52A6',
          700: '#0D3B6E',
          800: '#092850',
          900: '#051830',
        },
        accent: {
          DEFAULT: '#F5A623',
          50:  '#FFF8EC',
          100: '#FEEECA',
          200: '#FDDA8F',
          300: '#FCC554',
          400: '#F5A623',
          500: '#E88B0A',
          600: '#C97308',
          700: '#A85C06',
        },
        sky: {
          solar: '#29ABE2',
          light: '#E0F5FF',
        },
        navy: '#0D3B6E',
        solarbg: '#F8FAFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(21, 101, 192, 0.08)',
        'card-hover': '0 12px 40px rgba(21, 101, 192, 0.18)',
        glow: '0 0 30px rgba(245, 166, 35, 0.35)',
      },
      animation: {
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
