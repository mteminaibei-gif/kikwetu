/**
 * Tailwind CSS v4 is CSS-first (@theme / @utility in CSS).
 * This file documents safe-area tokens for IDE/tooling and any
 * plugins that still read a JS config. Runtime theme lives in:
 *   src/styles/safe-area.css
 *   src/app/globals.css
 *
 * Usage examples:
 *   className="pb-safe"           // home indicator only
 *   className="pb-safe-tab"       // tab bar + home indicator
 *   className="pt-safe"           // notch / status bar
 *   className="px-safe-min"       // side insets or 0.75rem min
 *   className="bottom-safe-fab"   // FAB above tabs
 *   className="p-safe"            // all four insets
 *
 * Theme spacing also enables: pb-safe-b, pt-safe-t, m-safe-b, top-safe-t, etc.
 */
import type { Config } from 'tailwindcss';

const config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      spacing: {
        'safe-t': 'env(safe-area-inset-top, 0px)',
        'safe-r': 'env(safe-area-inset-right, 0px)',
        'safe-b': 'env(safe-area-inset-bottom, 0px)',
        'safe-l': 'env(safe-area-inset-left, 0px)',
        'safe-tab': 'calc(3.75rem + env(safe-area-inset-bottom, 0px))',
        'safe-nav': 'calc(3.5rem + env(safe-area-inset-top, 0px))',
        'safe-fab': 'calc(3.75rem + 1.5rem + env(safe-area-inset-bottom, 0px))',
        'safe-toast': 'calc(3.75rem + 1.25rem + env(safe-area-inset-bottom, 0px))',
      },
      minHeight: {
        'screen-safe': 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
      },
      height: {
        'screen-safe': 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
      },
      padding: {
        safe: 'env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)',
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
