import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface2)',
        surface3: 'var(--surface3)',
        text: 'var(--text)',
        text2: 'var(--text2)',
        text3: 'var(--text3)',
        line: 'var(--line)',
        line2: 'var(--line2)',
        green: 'var(--green)',
        green2: 'var(--green2)',
        greenSoft: 'var(--greenSoft)',
        gold: 'var(--gold)',
        goldSoft: 'var(--goldSoft)',
        earth: 'var(--earth)',
        earthSoft: 'var(--earthSoft)',
        red: 'var(--red)',
        redSoft: 'var(--redSoft)',
        blue: 'var(--blue)',
        blueSoft: 'var(--blueSoft)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces"', 'Georgia', 'serif'],
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '23px',
      },
    },
  },
  plugins: [],
};

export default config;
