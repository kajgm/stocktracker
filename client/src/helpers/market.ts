// Mirrors server/lib/marketHours.ts: regular US session, Mon-Fri 09:30-16:00
// New York time, daylight saving aware. Holidays are not modelled.
const OPEN_MINUTES = 9 * 60 + 30;
const CLOSE_MINUTES = 16 * 60;

const nyClock = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
});
const nyDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }); // YYYY-MM-DD
const nyWeekday = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' });

export function isUsMarketOpen(date: Date = new Date()): boolean {
  const parts = Object.fromEntries(nyClock.formatToParts(date).map((p) => [p.type, p.value]));
  if (parts.weekday === 'Sat' || parts.weekday === 'Sun') return false;
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  return minutes >= OPEN_MINUTES && minutes <= CLOSE_MINUTES;
}

/** "Close" for a quote from today's session (New York date), otherwise e.g. "Fri close". */
export function closeLabel(quoteTime: number, now: Date = new Date()): string {
  const quote = new Date(quoteTime);
  return nyDate.format(quote) === nyDate.format(now) ? 'Close' : `${nyWeekday.format(quote)} close`;
}
