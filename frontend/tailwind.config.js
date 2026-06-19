/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#dce4ff',
          300: '#c2cfff',
          400: '#9db0ff',
          500: '#6366f1', // Primary Indigo
          600: '#4f46e5', // Darker Indigo
          700: '#4338ca',
          850: '#1e1b4b',
          900: '#0f172a', // Dark theme background
        },
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.04)',
        'premium': '0 10px 40px -10px rgba(99, 102, 241, 0.05)',
        'dark-premium': '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}
