export function priceDirection(currentdirection: string, currentPrice: number, previousPrice: number) {
  if (previousPrice > currentPrice) {
    return 'redFilter';
  } else if (previousPrice < currentPrice) {
    return 'greenFilter';
  }
  return currentdirection;
}
