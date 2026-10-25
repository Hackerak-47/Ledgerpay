/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#172B4D',
        slate: '#344563',
        'gray-bg': '#F4F6F8',
        border: '#DFE3E8',
        'text-primary': '#17212F',
        'text-secondary': '#667085',
        green: '#218568',
        amber: '#B7791F',
        red: '#C2414B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        'card-md': '0 2px 6px rgba(0,0,0,0.10)',
      },
      borderRadius: {
        DEFAULT: '4px',
        card: '6px',
      },
      fontSize: {
        base: '14px',
      },
    },
  },
  plugins: [],
}
