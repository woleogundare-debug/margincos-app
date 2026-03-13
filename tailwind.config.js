/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#1B2A4A', dark: '#111D33', light: '#2A3F66', 50: '#E8EBF0' },
        teal:   { DEFAULT: '#0D8F8F', light: '#11B3B3', dark: '#0A7070', 50: '#E6F5F5' },
        red:    { DEFAULT: '#DC2626', brand: '#C0392B', light: '#E74C3C', 50: '#FBEAE8' },
        amber:  { DEFAULT: '#D97706', 50: '#FFFBEB' },
        purple: { DEFAULT: '#7C3AED', 50: '#F5F3FF' },
        gold:   { DEFAULT: '#D4A843', light: '#E8C468', 50: '#FBF5E8' },
        gray:   { DEFAULT: '#8896A7', 100: '#E8ECF0', text: '#5A6B80' },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
