import { ref } from 'vue';

/**
 * Portrait phones get the chart-first layout. The height floor keeps the
 * 480x320 kiosk display (and phones in landscape) on the tile grid.
 */
export const PHONE_QUERY = '(max-width: 767px) and (min-height: 560px)';

export const isPhone = ref(false);

export function watchViewport() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
  const mq = window.matchMedia(PHONE_QUERY);
  isPhone.value = mq.matches;
  mq.addEventListener('change', (e) => (isPhone.value = e.matches));
}
