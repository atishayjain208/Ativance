/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Theme Colors
        background: '#090B10',
        sidebar: '#0F1219',
        card: '#141821',
        elevated: '#181D27',
        border: '#1F2633',
        'border-hover': '#2E384D',
        
        // Accents
        primary: {
          DEFAULT: '#7C5CFC',
          hover: '#9B7CFF',
          dark: '#6344E2',
        },
        ai: {
          DEFAULT: '#22D3EE',
          hover: '#38BDF8',
        },
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',

        // Typography
        main: '#F8FAFC',
        secondary: '#94A3B8',
        muted: '#64748B',
      },
      boxShadow: {
        'soft': '0 2px 10px 0 rgba(0, 0, 0, 0.4)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'hover': '0 8px 30px -4px rgba(124, 92, 252, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.4)',
        'glow-purple': '0 0 25px -5px rgba(124, 92, 252, 0.35)',
        'glow-cyan': '0 0 25px -5px rgba(34, 211, 238, 0.35)',
      },
    },
  },
  plugins: [],
}



