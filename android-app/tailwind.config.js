/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'pastel-pink': '#FFE5E5',
        'pastel-mint': '#D4F4F4',
        'pastel-beige': '#FFE8D6',
        'pastel-lavender': '#E5E5FF',
        'pastel-coral': '#FFD4D4',
        'brand-dark': '#1A1A2E',
        'brand-gray': '#6B7280',
        'brand-accent': '#6366F1',
      },
    },
  },
  plugins: [],
};
