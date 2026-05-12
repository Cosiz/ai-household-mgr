/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        onyx:    '#09090b',   // bg-zinc-950
        alabaster: '#f5f5f4', // text-stone-100
      },
    },
  },
  plugins: [],
};
