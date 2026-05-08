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
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
        },
        surface: {
          base: 'var(--surface-base)',
          DEFAULT: 'var(--surface)',
          raised: 'var(--surface-raised)',
          inset: 'var(--surface-inset)',
        },
        content: {
          DEFAULT: 'var(--content)',
          secondary: 'var(--content-secondary)',
          muted: 'var(--content-muted)',
        },
        edge: {
          DEFAULT: 'var(--edge)',
          light: 'var(--edge-light)',
        },
      },
    },
  },
  plugins: [],
}
