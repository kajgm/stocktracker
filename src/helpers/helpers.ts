export function priceDirection(currentdirection: string, currentPrice: number, previousPrice: number): string {
  if (previousPrice > currentPrice) {
    return 'fill-red-500 rotate-90';
  } else if (previousPrice < currentPrice) {
    return 'fill-emerald-500 -rotate-90';
  }
  return currentdirection;
}

//Credit to: https://stackoverflow.com/a/9462382
export function concatVol(volume: number): string {
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
    .find((item) => volume >= item.value);
  return item ? (volume / item.value).toFixed(1).replace(regexp, '').concat(item.symbol) : '0';
}
