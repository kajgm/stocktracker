import { DOWN_FILTER, UP_FILTER } from '@/types/types';

/** Arrow style for a price move; keeps the current one when the price is unchanged or unknown. */
export function priceDirection(currentDirection: string, currentPrice: number, previousPrice: number): string {
  if (previousPrice < 0) return currentDirection;
  if (previousPrice > currentPrice) return DOWN_FILTER;
  if (previousPrice < currentPrice) return UP_FILTER;
  return currentDirection;
}

// Credit to: https://stackoverflow.com/a/9462382
export function concatNumber(num: number, digits: number, extraPrecise?: boolean, ignoreTrailing?: boolean): string {
  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' }
  ];
  const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/;

  const item = lookup
    .slice()
    .reverse()
    .find((item) => num >= item.value && (extraPrecise ? num / item.value > 99 || item.value == 1 : true));
  if (item) {
    return ignoreTrailing
      ? (num / item.value).toFixed(digits).replace(regexp, '').concat(item.symbol)
      : (num / item.value).toFixed(digits).concat(item.symbol);
  } else {
    return num.toString();
  }
}
