/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        accent: '#dc6b2f',
        'accent-dark': '#c45a22',
        navy: '#1e2a4a',
        'navy-mid': '#2d3e6b',
        cream: '#faf8f5',
        'cream-mid': '#f0ebe3',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
