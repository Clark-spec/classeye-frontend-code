/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0B6F6B',
          dark: '#095955',
          light: '#D9EBE8',
          bg: '#EEF3F3',
          surface: '#F1F6F6',
        },
        ink: {
          DEFAULT: '#12302E',
          muted: '#5B6F6D',
        },
        occupied: {
          bg: '#FDF0C8',
          text: '#8A5A0B',
        },
        empty: {
          bg: '#DDF5E3',
          text: '#1E7A3C',
        },
        maint: {
          bg: '#E5E7EB',
          text: '#4B5563',
        },
        danger: {
          DEFAULT: '#B42318',
          light: '#FDECEA',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 12px 30px -18px rgba(18, 48, 46, 0.35)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(30px, -40px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'pulse-dot': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 18s ease-in-out infinite',
        shimmer: 'shimmer 1.4s linear infinite',
        'pulse-dot': 'pulse-dot 1.8s ease-out infinite',
        'fade-up': 'fade-up 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};
