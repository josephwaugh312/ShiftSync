/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          100: 'var(--color-primary-100, #e6f0ff)',
          200: 'var(--color-primary-200, #bfd4ff)',
          300: 'var(--color-primary-300, #99b9ff)',
          400: 'var(--color-primary-400, #739dff)',
          500: 'var(--color-primary-500, #4d82ff)',
          600: 'var(--color-primary-600, #2766ff)',
          700: 'var(--color-primary-700, #0051ff)',
          800: 'var(--color-primary-800, #0040cc)',
          900: 'var(--color-primary-900, #003399)',
        },
        secondary: {
          100: '#f0f0f9',
          200: '#d9d9f0',
          300: '#c2c2e6',
          400: '#acacdd',
          500: '#9595d3',
          600: '#7f7fca',
          700: '#6868c0',
          800: '#5252b7',
          900: '#3b3bad',
        },
        success: {
          100: '#e6f7e6',
          200: '#c2eac2',
          300: '#9fdd9f',
          400: '#7bd07b',
          500: '#58c358',
          600: '#34b634',
          700: '#2d9d2d',
          800: '#267d26',
          900: '#1f661f',
        },
        warning: {
          100: '#fff8e6',
          200: '#ffedb2',
          300: '#ffe27f',
          400: '#ffd74c',
          500: '#ffcc19',
          600: '#e6b800',
          700: '#b39100',
          800: '#806800',
          900: '#4d3f00',
        },
        danger: {
          100: '#ffebeb',
          200: '#ffcccc',
          300: '#ffadad',
          400: '#ff8f8f',
          500: '#ff7070',
          600: '#ff5252',
          700: '#ff3333',
          800: '#ff1414',
          900: '#f50000',
        },
        dark: {
          100: '#d5d5d5',
          200: '#aaaaaa',
          300: '#808080',
          400: '#555555',
          500: '#2b2b2b',
          600: '#222222',
          700: '#1a1a1a',
          800: '#111111',
          900: '#080808',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
      },
      touchAction: {
        manipulation: 'manipulation',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      spacing: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
  corePlugins: {
    touchAction: true,
  },
} 