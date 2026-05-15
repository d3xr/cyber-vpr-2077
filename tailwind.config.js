/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'nc-black': '#0A0E14',
        'nc-dark': '#11161E',
        'nc-cyan': '#00F0FF',
        'nc-yellow': '#FCEE0A',
        'nc-magenta': '#FF003C',
        'nc-purple': '#B026FF',
        'nc-green': '#39FF14',
        'nc-text': '#E8F4FF',
        'nc-muted': '#7A8B9C',
      },
      fontFamily: {
        display: ['Oxanium', 'Orbitron', 'system-ui', 'sans-serif'],
        ui: ['Rajdhani', 'system-ui', 'sans-serif'],
        mono: ['"Share Tech Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 8px #00F0FF, 0 0 22px rgba(0,240,255,0.55)',
        'neon-yellow': '0 0 8px #FCEE0A, 0 0 22px rgba(252,238,10,0.55)',
        'neon-magenta': '0 0 8px #FF003C, 0 0 22px rgba(255,0,60,0.55)',
        'neon-green': '0 0 8px #39FF14, 0 0 22px rgba(57,255,20,0.55)',
        'neon-purple': '0 0 8px #B026FF, 0 0 22px rgba(176,38,255,0.55)',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        scan: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100vh' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0,0)' },
          '20%': { transform: 'translate(-2px,1px)' },
          '40%': { transform: 'translate(2px,-1px)' },
          '60%': { transform: 'translate(-1px,2px)' },
          '80%': { transform: 'translate(1px,-2px)' },
        },
        cursor: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
      },
      animation: {
        flicker: 'flicker 4s linear infinite',
        scan: 'scan 8s linear infinite',
        glitch: 'glitch 220ms steps(2, jump-none)',
        cursor: 'cursor 1s steps(2) infinite',
      },
    },
  },
  plugins: [],
};
