import type { Config } from 'tailwindcss';

// Colours and faces come from the Hallmark tokens in src/assets/tokens.css.
const token = (name: string) => `var(--color-${name})`;

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: Object.fromEntries(
        [
          'paper',
          'paper-2',
          'paper-3',
          'ink',
          'ink-2',
          'muted',
          'rule',
          'rule-2',
          'accent',
          'accent-ink',
          'accent-soft',
          'cool',
          'cool-soft',
          'ok',
          'ok-soft',
          'bad',
          'bad-soft'
        ].map((n) => [n, token(n)])
      ),
      fontFamily: {
        sans: 'var(--font-body)',
        mono: 'var(--font-outlier)'
      },
      borderRadius: {
        card: 'var(--radius-card)',
        pill: 'var(--radius-pill)'
      },
      spacing: {
        'pi-w': '480px',
        'pi-h': '320px'
      }
    }
  },
  plugins: []
} satisfies Config;
