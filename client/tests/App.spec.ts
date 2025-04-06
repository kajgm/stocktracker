/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { type StatusType } from '@/types/types';
import { useTickerStore } from '@/store/ticker';
import router from '@/router';
import App from '@/App.vue';

describe('App', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('renders the main page with stock and crypto tickers', async () => {
    const tickerStore = useTickerStore();

    tickerStore.setExtStatus('CONNECTING' as StatusType, 'CRYPTO');
    tickerStore.setExtStatus('CONNECTING' as StatusType, 'STOCK');

    void router.push('/');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    });

    expect(wrapper.text()).toContain('Connecting...');
  });
});
