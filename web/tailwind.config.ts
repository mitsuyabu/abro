import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1A1A1A',
        background: '#F7F7F7',
        surface: '#FFFFFF',
        border: '#E8E8E8',
        muted: '#A0A0A0',
        accent: '#1A1A1A',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Hiragino Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
