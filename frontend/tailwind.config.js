/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        peach: {
          50: '#fff5f2',
          100: '#ffe8e0',
          200: '#ffd4c7',
          300: '#ffb8a0',
          400: '#ff9b79',
          500: '#ff7e52',
          600: '#ff6129',
          700: '#e64a0f',
          800: '#bf3d0c',
          900: '#992f0a',
        },
        dark: {
          bg: '#0a0a0a',
          surface: '#141414',
          card: '#1a1a1a',
          border: '#2a2a2a',
          text: '#e5e5e5',
          textMuted: '#a3a3a3',
        }
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
