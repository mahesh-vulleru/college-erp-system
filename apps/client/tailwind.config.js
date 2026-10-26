/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#1e344e',
          900: '#0f1f33',
          950: '#081220'
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e'
        },
        warm: {
          50: '#fbfbfa',
          100: '#f7f7f5',
          200: '#f1f1ed',
          300: '#e5e5df',
          400: '#d1d1c7',
          500: '#a8a89a',
          800: '#292823',
          900: '#1c1b18'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(15, 31, 51, 0.05), 0 1px 2px 0 rgba(15, 31, 51, 0.03)',
        'card': '0 4px 6px -1px rgba(15, 31, 51, 0.04), 0 2px 4px -1px rgba(15, 31, 51, 0.02)',
        'elevation': '0 10px 15px -3px rgba(15, 31, 51, 0.08), 0 4px 6px -2px rgba(15, 31, 51, 0.04)'
      }
    },
  },
  plugins: [],
};
