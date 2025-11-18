/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f7f0',
          100: '#b3e6d1',
          200: '#80d5b2',
          300: '#4dc493',
          400: '#1ab374',
          500: '#00a85a',
          600: '#008247',
          700: '#006534',
          800: '#004721',
          900: '#002a0e',
        },
        accent: {
          50: '#e6ffe6',
          100: '#b3ffb3',
          200: '#80ff80',
          300: '#4dff4d',
          400: '#1aff1a',
          500: '#00e600',
          600: '#00b300',
          700: '#008000',
          800: '#004d00',
          900: '#001a00',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #004721 0%, #00a85a 50%, #4dc493 100%)',
        'gradient-accent': 'linear-gradient(135deg, #00a85a 0%, #1ab374 100%)',
      },
    },
  },
  plugins: [],
};
