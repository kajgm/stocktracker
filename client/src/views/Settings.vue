<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useTickerStore } from '@/store/ticker';
import { ApiError, getTickers, saveTickers } from '@/api/tickers';
import { checkTicker } from '@/helpers/tickers';
import { loadToken, storeToken } from '@/helpers/adminToken';
import { updateAvailable } from '@/helpers/updates';
import type { TickerLists, TickerType } from '@/types/types';

const tickerStore = useTickerStore();

const saved = ref<TickerLists>({ stock: [], crypto: [] });
const draft = reactive<TickerLists>({ stock: [], crypto: [] });
const loading = ref(true);
const loadError = ref('');

const storedToken = loadToken();
const token = ref(storedToken);
const remember = ref(storedToken !== '');
const saving = ref(false);
const message = ref<{ kind: 'ok' | 'error'; text: string } | null>(null);

const sections: { type: TickerType; key: keyof TickerLists; title: string; hint: string; placeholder: string }[] = [
  { type: 'STOCK', key: 'stock', title: 'Stocks', hint: 'US-listed symbols, quoted by Finnhub.', placeholder: 'AAPL' },
  { type: 'CRYPTO', key: 'crypto', title: 'Crypto', hint: 'Coinbase products.', placeholder: 'BTC-USD' }
];
const inputs = reactive<Record<keyof TickerLists, string>>({ stock: '', crypto: '' });
const inputErrors = reactive<Record<keyof TickerLists, string>>({ stock: '', crypto: '' });

const sameList = (a: string[], b: string[]) => a.length == b.length && a.every((s, i) => s == b[i]);
const dirty = computed(() => !sameList(draft.stock, saved.value.stock) || !sameList(draft.crypto, saved.value.crypto));

function reset(lists: TickerLists) {
  saved.value = { stock: [...lists.stock], crypto: [...lists.crypto] };
  draft.stock = [...lists.stock];
  draft.crypto = [...lists.crypto];
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    reset(await getTickers());
  } catch (e) {
    loadError.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);

function add(key: keyof TickerLists, type: TickerType) {
  const result = checkTicker(inputs[key], type, draft[key]);
  if ('error' in result) {
    inputErrors[key] = result.error;
    return;
  }
  draft[key].push(result.symbol);
  inputs[key] = '';
  inputErrors[key] = '';
  message.value = null;
}

function remove(key: keyof TickerLists, index: number) {
  draft[key].splice(index, 1);
  message.value = null;
}

function move(key: keyof TickerLists, index: number, by: -1 | 1) {
  const list = draft[key];
  const to = index + by;
  if (to < 0 || to >= list.length) return;
  [list[index], list[to]] = [list[to], list[index]];
  message.value = null;
}

/** What the display currently shows for a saved ticker. */
function status(type: TickerType, symbol: string): { label: string; tone: string } {
  if (!(type == 'STOCK' ? saved.value.stock : saved.value.crypto).includes(symbol)) {
    return { label: 'Not saved', tone: 'text-accent' };
  }
  const data = type == 'STOCK' ? tickerStore.stockDataMap.get(symbol) : tickerStore.cryptoDataMap.get(symbol);
  if (data?.status == 'CONNECTED') return { label: 'Live', tone: 'text-ok' };
  if (data?.status == 'ERROR') return { label: 'Error', tone: 'text-bad' };
  return { label: 'Waiting', tone: 'text-muted' };
}

async function save() {
  saving.value = true;
  message.value = null;
  try {
    reset(await saveTickers({ stock: [...draft.stock], crypto: [...draft.crypto] }, token.value.trim()));
    storeToken(token.value.trim(), remember.value);
    message.value = { kind: 'ok', text: 'Saved. Displays update right away.' };
  } catch (e) {
    message.value = { kind: 'error', text: e instanceof ApiError ? e.message : 'Saving failed. Try again.' };
  } finally {
    saving.value = false;
  }
}

function discard() {
  reset(saved.value);
  message.value = null;
}

function reloadPage() {
  window.location.reload();
}

function onRememberChange() {
  // Unticking forgets a stored token immediately, not just on the next save.
  if (!remember.value) storeToken('', false);
}
</script>

<template>
  <main class="mx-auto w-full max-w-md px-4 py-6 text-ink">
    <header class="mb-6 flex items-baseline justify-between">
      <h1 class="text-3xl">Tickers</h1>
      <RouterLink to="/" class="text-sm text-muted underline decoration-rule-2 hover:text-accent"
        >Back to display</RouterLink
      >
    </header>

    <div
      v-if="updateAvailable"
      class="mb-6 flex items-center justify-between gap-3 rounded-card border border-rule bg-paper-2 px-3 py-2 text-sm"
      role="status"
    >
      <span>A new version is available.{{ dirty ? ' Reloading discards unsaved changes.' : '' }}</span>
      <button
        type="button"
        class="shrink-0 inline-flex h-9 items-center rounded-pill border border-rule-2 bg-paper-2 px-3 text-sm font-medium text-ink transition-colors hover:bg-paper-3"
        @click="reloadPage"
      >
        Reload
      </button>
    </div>

    <p v-if="loading" class="text-muted">Loading...</p>
    <div v-else-if="loadError" class="space-y-3">
      <p class="text-bad">{{ loadError }}</p>
      <button
        type="button"
        class="inline-flex h-9 items-center rounded-pill border border-rule-2 bg-paper-2 px-3 text-sm font-medium text-ink transition-colors hover:bg-paper-3"
        @click="load"
      >
        Try again
      </button>
    </div>

    <form v-else class="space-y-8" @submit.prevent="save">
      <section v-for="s in sections" :key="s.key" :aria-labelledby="`${s.key}-title`">
        <h2 :id="`${s.key}-title`" class="text-xl">{{ s.title }}</h2>
        <p class="mb-3 text-sm text-muted">{{ s.hint }}</p>

        <ul
          class="mb-3 divide-y divide-rule overflow-hidden rounded-card border border-rule bg-paper-2"
          :data-testid="`${s.key}-list`"
        >
          <li v-if="!draft[s.key].length" class="px-3 py-2 text-sm text-muted">None</li>
          <li v-for="(symbol, i) in draft[s.key]" :key="symbol" class="flex items-center gap-2 px-3 py-2">
            <span class="measured text-ink">{{ symbol }}</span
            >{{ ' ' }}
            <span class="text-xs font-medium" :class="status(s.type, symbol).tone">
              {{ status(s.type, symbol).label }}
            </span>
            <span class="ml-auto flex gap-1">
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-pill text-muted transition-colors hover:bg-paper-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-55"
                :disabled="i == 0"
                :aria-label="`Move ${symbol} up`"
                @click="move(s.key, i, -1)"
              >
                &uarr;
              </button>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-pill text-muted transition-colors hover:bg-paper-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-55"
                :disabled="i == draft[s.key].length - 1"
                :aria-label="`Move ${symbol} down`"
                @click="move(s.key, i, 1)"
              >
                &darr;
              </button>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-pill text-muted transition-colors hover:bg-paper-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-55 hover:text-bad"
                :aria-label="`Remove ${symbol}`"
                @click="remove(s.key, i)"
              >
                &times;
              </button>
            </span>
          </li>
        </ul>

        <div class="flex gap-2">
          <input
            v-model="inputs[s.key]"
            :aria-label="`Add a ${s.title.toLowerCase()} ticker`"
            :placeholder="s.placeholder"
            autocapitalize="characters"
            autocomplete="off"
            spellcheck="false"
            class="measured h-9 min-w-0 flex-1 rounded-pill border border-rule bg-paper-3 px-3 uppercase text-ink placeholder:normal-case placeholder:text-muted focus-visible:outline-offset-[-2px]"
            @input="inputErrors[s.key] = ''"
            @keydown.enter.prevent="add(s.key, s.type)"
          />
          <button
            type="button"
            class="inline-flex h-9 items-center rounded-pill border border-rule-2 bg-paper-2 px-3 text-sm font-medium text-ink transition-colors hover:bg-paper-3"
            @click="add(s.key, s.type)"
          >
            Add
          </button>
        </div>
        <p v-if="inputErrors[s.key]" class="mt-1 text-sm text-bad" role="alert">{{ inputErrors[s.key] }}</p>
      </section>

      <section aria-labelledby="token-title">
        <h2 id="token-title" class="text-xl">Admin token</h2>
        <p class="mb-3 text-sm text-muted">Needed to save when the server sets ADMIN_TOKEN.</p>
        <input
          v-model="token"
          type="password"
          aria-label="Admin token"
          autocomplete="current-password"
          class="h-9 w-full rounded-pill border border-rule bg-paper-3 px-3 text-ink focus-visible:outline-offset-[-2px]"
        />
        <label class="mt-2 flex items-center gap-2 text-sm text-muted">
          <input v-model="remember" type="checkbox" class="h-4 w-4 accent-accent" @change="onRememberChange" />
          Remember on this device
        </label>
      </section>

      <div class="flex items-center gap-3">
        <button
          type="submit"
          class="inline-flex h-10 items-center whitespace-nowrap rounded-pill bg-accent px-4 font-medium text-accent-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-55"
          :disabled="saving || !dirty"
        >
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
        <button
          v-if="dirty"
          type="button"
          class="text-sm text-muted underline decoration-rule-2 hover:text-accent"
          @click="discard"
        >
          Discard changes
        </button>
      </div>
      <p
        v-if="message"
        :class="message.kind == 'ok' ? 'text-ok' : 'text-bad'"
        :role="message.kind == 'ok' ? 'status' : 'alert'"
      >
        {{ message.text }}
      </p>
    </form>
  </main>
</template>
