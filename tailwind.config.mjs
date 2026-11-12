import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  // Strictly light-theme only: never respond to prefers-color-scheme: dark
  darkMode: ['selector', '[data-never-dark-mode]'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Geist',
          '"Geist Fallback"',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        display: [
          'Geist',
          '"Geist Fallback"',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'Monaco',
          'Inconsolata',
          '"Roboto Mono"',
          'Consolas',
          '"Courier New"',
          'monospace',
        ],
      },
    },
  },
  plugins: [typography],
};
