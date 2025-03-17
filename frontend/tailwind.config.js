/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4dabf5',
          main: '#2196f3',
          dark: '#1769aa',
        },
        secondary: {
          light: '#f73378',
          main: '#f50057',
          dark: '#ab003c',
        },
      },
      boxShadow: {
        modal: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
  // Importante: asegurarse de que Tailwind no entre en conflicto con MUI
  corePlugins: {
    preflight: false,
  },
}

