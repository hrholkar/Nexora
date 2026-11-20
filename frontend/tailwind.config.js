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
        bg: {
          main: '#090B12',
          sidebar: '#10131D',
          card: '#151A27',
          elevated: '#1B2232',
        },
        accent: {
          primary: '#8B5CF6',
          secondary: '#06B6D4',
        },
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
        },
        border: {
          dark: '#283044',
          subtle: '#1E2536',
        },
        text: {
          main: '#F8FAFC',
          muted: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
