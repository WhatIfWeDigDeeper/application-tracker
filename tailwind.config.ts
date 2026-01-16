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
        status: {
          applied: '#3B82F6',      // blue-500
          interviewing: '#F59E0B', // amber-500
          offered: '#10B981',      // emerald-500
          rejected: '#EF4444',     // red-500
          accepted: '#22C55E',     // green-500
          declined: '#6B7280',     // gray-500
        },
      },
    },
  },
  plugins: [],
};

export default config;
