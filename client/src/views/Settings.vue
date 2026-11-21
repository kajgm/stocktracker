<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useTickerStore } from '@/store/ticker';
import { ApiError, getTickers, saveTickers } from '@/api/tickers';
import { checkTicker } from '@/helpers/tickers';
import { loadToken, storeToken } from '@/helpers/adminToken';
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
function status(type: TickerType, symbol: string): { label: string; dot: string } {
  if (!(type == 'STOCK' ? saved.value.stock : saved.value.crypto).includes(symbol)) {
    return { label: 'Not saved', dot: 'bg-zinc-500' };
  }
  const data = type == 'STOCK' ? tickerStore.stockDataMap.get(symbol) : tickerStore.cryptoDataMap.get(symbol);
  if (data?.status == 'CONNECTED') return { label: 'Live', dot: 'bg-emerald-500' };
  if (data?.status == 'ERROR') return { label: 'Error', dot: 'bg-red-500' };
  return { label: 'Waiting', dot: 'bg-zinc-500' };
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

function onRememberChange() {
  // Unticking forgets a stored token immediately, not just on the next save.
  if (!remember.value) storeToken('', false);
}
</script>

<template>
  <main class="mx-auto w-full max-w-md px-4 py-6 text-zinc-200">
    <header class="mb-6 flex items-baseline justify-between">
      <h1 class="text-2xl font-medium">Tickers</h1>
      <RouterLink to="/" class="text-sm text-zinc-400 underline-offset-2 hover:underline">Back to display</RouterLink>
    </header>

    <p v-if="loading" class="text-zinc-400">Loading...</p>
    <div v-else-if="loadError" class="space-y-3">
      <p class="text-red-400">{{ loadError }}</p>
      <button type="button" class="rounded-md bg-zinc-700 px-3 py-1.5 text-sm" @click="load">Try again</button>
    </div>

    <form v-else class="space-y-8" @submit.prevent="save">
      <section v-for="s in sections" :key="s.key" :aria-labelledby="`${s.key}-title`">
        <h2 :id="`${s.key}-title`" class="text-lg font-medium">{{ s.title }}</h2>
        <p class="mb-3 text-sm text-zinc-400">{{ s.hint }}</p>

        <ul class="mb-3 divide-y divide-zinc-700 rounded-lg border border-zinc-700" :data-testid="`${s.key}-list`">
          <li v-if="!draft[s.key].length" class="px-3 py-2 text-sm text-zinc-500">None</li>
          <li v-for="(symbol, i) in draft[s.key]" :key="symbol" class="flex items-center gap-2 px-3 py-2">
            <span class="font-medium">{{ symbol }}</span>
            <span class="flex items-center gap-1.5 text-xs text-zinc-400">
              <span class="inline-block h-2 w-2 rounded-full" :class="status(s.type, symbol).dot"></span>
              {{ status(s.type, symbol).label }}
            </span>
            <span class="ml-auto flex gap-1">
              <button
                type="button"
                class="rounded px-2 text-zinc-400 hover:bg-zinc-700 disabled:opacity-30"
                :disabled="i == 0"
                :aria-label="`Move ${symbol} up`"
                @click="move(s.key, i, -1)"
              >
                &uarr;
              </button>
              <button
                type="button"
                class="rounded px-2 text-zinc-400 hover:bg-zinc-700 disabled:opacity-30"
                :disabled="i == draft[s.key].length - 1"
                :aria-label="`Move ${symbol} down`"
                @click="move(s.key, i, 1)"
              >
                &darr;
              </button>
              <button
                type="button"
                class="rounded px-2 text-zinc-400 hover:bg-zinc-700 hover:text-red-400"
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
            class="min-w-0 flex-1 rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 uppercase placeholder:normal-case placeholder:text-zinc-500"
            @input="inputErrors[s.key] = ''"
            @keydown.enter.prevent="add(s.key, s.type)"
          />
          <button type="button" class="rounded-md bg-zinc-700 px-3 py-1.5 text-sm" @click="add(s.key, s.type)">
            Add
          </button>
        </div>
        <p v-if="inputErrors[s.key]" class="mt-1 text-sm text-red-400" role="alert">{{ inputErrors[s.key] }}</p>
      </section>

      <section aria-labelledby="token-title">
        <h2 id="token-title" class="text-lg font-medium">Admin token</h2>
        <p class="mb-3 text-sm text-zinc-400">Needed to save when the server sets ADMIN_TOKEN.</p>
        <input
          v-model="token"
          type="password"
          aria-label="Admin token"
          autocomplete="current-password"
          class="w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5"
        />
        <label class="mt-2 flex items-center gap-2 text-sm text-zinc-400">
          <input v-model="remember" type="checkbox" @change="onRememberChange" />
          Remember on this device
        </label>
      </section>

      <div class="flex items-center gap-3">
        <button
          type="submit"
          class="rounded-md bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-50"
          :disabled="saving || !dirty"
        >
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
        <button v-if="dirty" type="button" class="text-sm text-zinc-400 hover:underline" @click="discard">
          Discard changes
        </button>
      </div>
      <p
        v-if="message"
        :class="message.kind == 'ok' ? 'text-emerald-400' : 'text-red-400'"
        :role="message.kind == 'ok' ? 'status' : 'alert'"
      >
        {{ message.text }}
      </p>
    </form>
  </main>
</template>
