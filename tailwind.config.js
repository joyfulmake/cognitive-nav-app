/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.7rem', { lineHeight: '1rem' }],
      },
      colors: {
        ink: '#1c1a14',
        paper: '#fdf8f0',
        line: '#e4dace',
        muted: '#8a7d6e',
        depth: {
          1: '#c43d0f',
          2: '#1a6b3a',
          3: '#1a5c8a',
          4: '#7c2d96',
        },
        tag: {
          r: '#fde8e0',
          g: '#d8f3e6',
          b: '#d4edf7',
          p: '#eedff6',
          a: '#fef3cd',
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'warm': '0 1px 3px rgba(28,26,20,0.06), 0 4px 16px rgba(28,26,20,0.05)',
        'warm-lg': '0 2px 8px rgba(28,26,20,0.08), 0 8px 32px rgba(28,26,20,0.07)',
        'warm-xl': '0 4px 16px rgba(28,26,20,0.10), 0 16px 48px rgba(28,26,20,0.09)',
        'glow-1': '0 0 24px rgba(196,61,15,0.25), 0 4px 16px rgba(196,61,15,0.15)',
        'glow-2': '0 0 24px rgba(26,107,58,0.25), 0 4px 16px rgba(26,107,58,0.15)',
        'glow-3': '0 0 24px rgba(26,92,138,0.25), 0 4px 16px rgba(26,92,138,0.15)',
        'glow-4': '0 0 24px rgba(124,45,150,0.25), 0 4px 16px rgba(124,45,150,0.15)',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
      },
    },
  },
  plugins: [],
}
