/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#1A1A1A',
        accent: '#FF4D4D',
        background: '#F8F8F8',
        card: '#FFFFFF',
        muted: '#A0A0A0',
        border: '#E8E8E8',
        danger: '#FF4D4D',
        success: '#22C55E',
      },
      fontFamily: {
        sans: ['System', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
