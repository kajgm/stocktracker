import { describe, expect, it } from 'vitest';
import { errorHint, formatPercent, formatPrice, formatVolume } from '@/helpers/format';
import { closeLabel, isUsMarketOpen } from '@/helpers/market';

describe('formatting', () => {
  it('formats prices with grouping, keeping precision for sub-dollar prices', () => {
    expect(formatPrice(60187.66)).toBe('$60,187.66');
    expect(formatPrice(342.5)).toBe('$342.50');
    expect(formatPrice(0.123456)).toBe('$0.1235');
  });

  it('formats percentages signed with two decimals', () => {
    expect(formatPercent(0.8)).toBe('+0.80%');
    expect(formatPercent(-2.454)).toBe('-2.45%');
    expect(formatPercent(-0.001)).toBe('+0.00%');
  });

  it('labels crypto volume with the base currency', () => {
    expect(formatVolume(31812, 'BTC-USD')).toBe('31.8k BTC');
  });

  it('gives hints for known errors only', () => {
    expect(errorHint('Unknown symbol')).toBe('Check the ticker list');
    expect(errorHint('HTTP 403')).toBe('Check the Finnhub key or plan');
    expect(errorHint('something else')).toBe('');
  });
});

describe('market hours', () => {
  it('follows New York time, including DST', () => {
    expect(isUsMarketOpen(new Date('2026-07-15T13:30:00Z'))).toBe(true); // 09:30 EDT
    expect(isUsMarketOpen(new Date('2026-11-20T14:29:00Z'))).toBe(false); // 09:29 EST
    expect(isUsMarketOpen(new Date('2026-11-21T15:00:00Z'))).toBe(false); // Saturday
  });

  it('labels the close by New York weekday', () => {
    const fridayClose = Date.parse('2026-11-20T21:00:00Z');
    expect(closeLabel(fridayClose, new Date('2026-11-20T23:00:00Z'))).toBe('Close');
    expect(closeLabel(fridayClose, new Date('2026-11-21T15:00:00Z'))).toBe('Fri close');
  });
});
