/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "Signal deck" palette — a structured, instrument-panel dark UI.
        // The product's job is pulling a clean signal out of noisy chat, so
        // the palette leans toward one warm "extracted signal" accent against
        // a controlled, slightly blue-leaning dark base (not pure black).
        ink: {
          DEFAULT: '#12141C',
          soft: '#171A24',
        },
        surface: {
          DEFAULT: '#1B1E2A',
          raised: '#232739',
          hover: '#282D42',
        },
        border: {
          DEFAULT: '#2E3346',
          soft: '#252A3B',
        },
        ink2: {
          primary: '#EDEFF7',
          muted: '#8B90A8',
          faint: '#5B6079',
        },
        signal: {
          DEFAULT: '#F5B942',
          dim: '#4A3A1E',
          soft: '#FBD98A',
        },
        thread: {
          DEFAULT: '#5B8DEF',
          dim: '#1E2B4A',
        },
        resolved: {
          DEFAULT: '#4ADE80',
          dim: '#1B3A2A',
        },
        alert: {
          DEFAULT: '#F2545B',
          dim: '#3D1E22',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.5)',
        glow: '0 0 0 1px rgba(245,185,66,0.25), 0 0 24px -4px rgba(245,185,66,0.35)',
      },
      keyframes: {
        resolve: {
          '0%': { opacity: 0, transform: 'translateY(6px) scale(0.98)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        pulseSignal: {
          '0%,100%': { opacity: 1 },
          '50%': { opacity: 0.55 },
        },
      },
      animation: {
        resolve: 'resolve 0.5s cubic-bezier(0.16,1,0.3,1) both',
        pulseSignal: 'pulseSignal 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
