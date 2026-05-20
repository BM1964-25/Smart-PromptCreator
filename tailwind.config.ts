import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#171717',
        panel: '#f7f7f4',
        line: '#dedbd2',
        brand: '#256f63',
        berry: '#8f3f64',
        amber: '#b36b24'
      },
      boxShadow: {
        soft: '0 14px 34px rgba(23, 23, 23, 0.08)'
      }
    }
  },
  plugins: []
} satisfies Config;
