/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          900: '#0f172a', // Deepest background
          800: '#1e293b', // Card background
          700: '#334155', // Border / Input bg
          600: '#475569', // Muted text
        },
        'high-vis': {
          DEFAULT: '#EAB308', // Yellow-500 equivalent
          hover: '#CA8A04',
          dim: 'rgba(234, 179, 8, 0.1)',
        },
        'safety': {
          DEFAULT: '#EF4444', // Red-500
          orange: '#F97316', // Orange-500 (Gatekeepers)
        }
      },
      fontFamily: {
        'ops': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Menlo', 'monospace'], // For data/numbers
      },
      boxShadow: {
        'glow': '0 0 15px rgba(234, 179, 8, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}