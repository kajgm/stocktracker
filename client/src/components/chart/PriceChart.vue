<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { HistoryPoint } from '@/types/history';

const { points, up, formatPrice, formatTime } = defineProps<{
  points: HistoryPoint[];
  up: boolean;
  formatPrice: (price: number) => string;
  formatTime: (time: number) => string;
}>();

// Draw in real pixels (not a stretched viewBox) so lines and labels stay crisp.
const el = ref<HTMLElement>();
const width = ref(0);
const height = ref(0);
let observer: ResizeObserver | undefined;
onMounted(() => {
  const measure = () => {
    width.value = el.value?.clientWidth ?? 0;
    height.value = el.value?.clientHeight ?? 0;
  };
  measure();
  if (typeof ResizeObserver !== 'undefined' && el.value) {
    observer = new ResizeObserver(measure);
    observer.observe(el.value);
  }
});
onBeforeUnmount(() => observer?.disconnect());

const PAD = { top: 8, bottom: 18, left: 0, right: 0 };

const bounds = computed(() => {
  const prices = points.map((p) => p[1]);
  const times = points.map((p) => p[0]);
  let lo = Math.min(...prices);
  let hi = Math.max(...prices);
  if (hi === lo) {
    // Flat line: give it some room instead of dividing by zero.
    hi += Math.abs(hi) * 0.001 || 1;
    lo -= Math.abs(lo) * 0.001 || 1;
  }
  return { lo, hi, t0: Math.min(...times), t1: Math.max(...times) };
});

const x = (t: number) => {
  const { t0, t1 } = bounds.value;
  return PAD.left + ((t - t0) / (t1 - t0 || 1)) * (width.value - PAD.left - PAD.right);
};
const y = (p: number) => {
  const { lo, hi } = bounds.value;
  return PAD.top + (1 - (p - lo) / (hi - lo)) * (height.value - PAD.top - PAD.bottom);
};

const line = computed(() =>
  points.map(([t, p], i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(p).toFixed(1)}`).join('')
);
const area = computed(() => {
  if (points.length < 2) return '';
  const base = (height.value - PAD.bottom).toFixed(1);
  return `${line.value}L${x(points.at(-1)![0]).toFixed(1)},${base}L${x(points[0][0]).toFixed(1)},${base}Z`;
});

const high = computed(() => points.reduce((a, b) => (b[1] > a[1] ? b : a), points[0]));
const low = computed(() => points.reduce((a, b) => (b[1] < a[1] ? b : a), points[0]));

// Crosshair: nearest point to the pointer.
const hover = ref<HistoryPoint | null>(null);
function onMove(e: PointerEvent) {
  if (!points.length || !el.value) return;
  const px = e.clientX - el.value.getBoundingClientRect().left;
  let best = points[0];
  for (const p of points) if (Math.abs(x(p[0]) - px) < Math.abs(x(best[0]) - px)) best = p;
  hover.value = best;
}

const stroke = computed(() => (up ? '#10b981' : '#ef4444'));
</script>

<template>
  <div
    ref="el"
    class="relative w-full h-full select-none"
    style="touch-action: none"
    @pointermove="onMove"
    @pointerdown="onMove"
    @pointerleave="hover = null"
  >
    <svg v-if="width && height && points.length > 1" :width="width" :height="height" class="block" aria-hidden="true">
      <path :d="area" :fill="stroke" fill-opacity="0.12" />
      <path :d="line" fill="none" :stroke="stroke" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      <template v-if="hover">
        <line
          :x1="x(hover[0])"
          :x2="x(hover[0])"
          :y1="PAD.top"
          :y2="height - PAD.bottom"
          stroke="#a1a1aa"
          stroke-dasharray="3 3"
        />
        <circle :cx="x(hover[0])" :cy="y(hover[1])" r="4" :fill="stroke" />
      </template>
    </svg>

    <template v-if="points.length > 1">
      <!-- High/low on the right, times along the bottom. -->
      <span class="absolute right-1 top-0 rounded bg-zinc-900/80 px-1 text-xs text-zinc-400 tabular-nums">{{
        formatPrice(high[1])
      }}</span>
      <span
        class="absolute right-1 rounded bg-zinc-900/80 px-1 text-xs text-zinc-400 tabular-nums"
        :style="{ bottom: `${PAD.bottom}px` }"
        >{{ formatPrice(low[1]) }}</span
      >
      <span class="absolute left-0 bottom-0 text-xs text-zinc-500">{{ formatTime(points[0][0]) }}</span>
      <span class="absolute right-1 bottom-0 text-xs text-zinc-500">{{ formatTime(points.at(-1)![0]) }}</span>
      <span
        v-if="hover"
        class="absolute left-1 top-0 rounded bg-zinc-800/90 px-1.5 text-xs text-zinc-200 tabular-nums"
        data-testid="hover"
        >{{ formatPrice(hover[1]) }} · {{ formatTime(hover[0]) }}</span
      >
    </template>
  </div>
</template>
