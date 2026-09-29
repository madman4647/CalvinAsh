/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    screens: {
      sm: '360px',
      md: '768px',
      lg: '1280px',
    },
    extend: {
      colors: {
        paper: 'var(--paper)',
        'paper-light': 'var(--paper-light)',
        ink: 'var(--ink)',
        red: 'var(--red)',
        'red-deep': 'var(--red-deep)',
        pine: 'var(--pine)',
        mustard: 'var(--mustard)',
        status: {
          normal: 'var(--status-normal)',
          active: 'var(--status-active)',
          pending: 'var(--status-pending)',
          attention: 'var(--status-attention)',
          critical: 'var(--status-critical)',
        },
      },
      fontFamily: {
        heading: ['"Comic Neue"', 'cursive'],
        body: ['Nunito', 'sans-serif'],
        'case-files': ['"Special Elite"', 'monospace'],
      },
    },
  },
  plugins: [],
};
