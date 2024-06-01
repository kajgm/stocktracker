import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Ticker from '@/views/Ticker.vue';

describe('HelloWorld', () => {
  it('renders properly', () => {
    const wrapper = mount(Ticker);
    expect(wrapper.text()).toContain('(Coinbase)');
  });
});
