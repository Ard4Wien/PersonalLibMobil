/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: 'rgba(30, 30, 40, 0.8)',
        'surface-light': 'rgba(50, 50, 60, 0.6)',
        primary: { 
          from: '#9333ea', // purple-600
          to: '#db2777'    // pink-600
        },
        accent: {
          cyan: '#06b6d4',
          pink: '#ec4899'
        },
        text: {
          primary: '#ffffff',
          secondary: '#94a3b8',
          muted: '#64748b'
        }
      }
    },
  },
  plugins: [],
}
