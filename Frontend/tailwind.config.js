/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#262624',
        card: '#1F1E1D',
        sidebar: '#20201e',
        primary: '#FFFFFF', // White for text
        'primary-foreground': '#000000', // Black for text on white button
        secondary: '#3a3a38',
        'secondary-foreground': '#FFFFFF',
        accent: '#4a4a48',
        'accent-foreground': '#FFFFFF',
        border: '#3a3a38',
        input: '#3a3a38',
        ring: '#FFFFFF',
      },
    },
  },
  plugins: [],
}
