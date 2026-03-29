import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D6A4F',
          50: '#E8F5EE',
          100: '#C6E6D3',
          200: '#95CEB0',
          300: '#63B68D',
          400: '#40976E',
          500: '#2D6A4F',
          600: '#245840',
          700: '#1B4530',
          800: '#123220',
          900: '#081F10',
        },
        secondary: {
          DEFAULT: '#52B788',
        },
        accent: {
          DEFAULT: '#F4A261',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
