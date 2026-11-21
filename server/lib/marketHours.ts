const OPEN_MINUTES = 9 * 60 + 30; // 09:30
const CLOSE_MINUTES = 16 * 60; // 16:00

const nyClock = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
});

/**
 * Whether `date` falls in the regular US equity session (Mon-Fri 09:30-16:00
 * America/New_York). Uses the real New York offset, so it is correct across
 * daylight saving time and independent of the server's own timezone.
 * Exchange holidays are not modelled; polling on one is harmless.
 */
export function isUsMarketOpen(date: Date = new Date()): boolean {
  const parts = Object.fromEntries(nyClock.formatToParts(date).map((p) => [p.type, p.value]));
  if (parts.weekday === 'Sat' || parts.weekday === 'Sun') return false;
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  return minutes >= OPEN_MINUTES && minutes <= CLOSE_MINUTES;
}
