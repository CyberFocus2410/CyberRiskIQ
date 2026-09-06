/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      colors: {
        void: '#08090D',
        surface: {
          DEFAULT: '#0D1117',
          subtle: '#121620',
          elevated: '#161B26',
          highlight: '#1E2536'
        },
        border: {
          subtle: '#1C2333',
          tactical: '#26324B',
          strong: '#3B4B6E'
        },
        signal: {
          cyan: '#00F0FF',
          blue: '#3B82F6',
          indigo: '#6366F1',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
          crimson: '#E11D48'
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -5px rgba(0, 240, 255, 0.35)',
        'glow-rose': '0 0 20px -5px rgba(239, 68, 68, 0.35)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.35)',
        'tactical': '0 4px 20px -2px rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'data-stream': 'dataStream 1.5s linear infinite',
      },
      keyframes: {
        dataStream: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        }
      }
    },
  },
  plugins: [],
}
