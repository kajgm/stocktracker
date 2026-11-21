import { ref } from 'vue';

/**
 * Shared wall clock for time-based UI (market open/closed, stale tiles).
 * One timer for the whole app instead of one per tile.
 */
export const now = ref(Date.now());

let timer: ReturnType<typeof setInterval> | undefined;

export function startClock(intervalMs = 10_000): void {
  if (timer) return;
  timer = setInterval(() => (now.value = Date.now()), intervalMs);
}
