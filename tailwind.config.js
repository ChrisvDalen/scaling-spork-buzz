/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'SF Mono',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      colors: {
        surface: {
          // Light mode neutrals
          0: '#ffffff',
          50: '#f7f8fa',
          100: '#eef0f4',
          200: '#e2e5ea',
          300: '#cfd4dc',
          // Dark mode neutrals (control-room slate)
          700: '#2a2f3a',
          750: '#232833',
          800: '#1c212b',
          850: '#171b24',
          900: '#12161d',
          950: '#0d1015',
        },
        status: {
          neutral: '#8a93a3',
          info: '#3b82f6',
          running: '#2f9e6e',
          success: '#2f9e6e',
          warning: '#c08428',
          danger: '#d0453b',
          blocked: '#a855f7',
          approval: '#e08a1e',
        },
      },
      boxShadow: {
        panel: '0 1px 2px rgba(9, 12, 18, 0.06), 0 1px 1px rgba(9, 12, 18, 0.04)',
        drawer: '-8px 0 24px rgba(6, 9, 14, 0.28)',
      },
    },
  },
  plugins: [],
};
