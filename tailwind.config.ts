import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      spacing: {
        'pi-w': '480px',
        'pi-h': '320px'
      }
    }
  },
  plugins: []
} satisfies Config;
