/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        emerald: {
          600: "#047857",
          700: "#065f46",
          800: "#064e3b",
        },
        gold: {
          500: "#d4af37",
          600: "#b38a2d",
        },
      },
    },
  },

  plugins: [],
};
