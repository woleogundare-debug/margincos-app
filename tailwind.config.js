/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#0F2942', light: '#1A3A5C', dark: '#091E30' },
        teal:   { DEFAULT: '#0D9488', light: '#14B8A8', dark: '#0F766E', 50: '#F0FDFA' },
        red:    { DEFAULT: '#DC2626', 50: '#FEF2F2' },
        amber:  { DEFAULT: '#D97706', 50: '#FFFBEB' },
        purple: { DEFAULT: '#7C3AED', 50: '#F5F3FF' },
        gold:   { DEFAULT: '#E8C468', 50: '#FEFCE8' },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
