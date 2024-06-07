import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import App from '@/App.vue';

describe('App', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders properly', () => {
    const wrapper = mount(App);
    expect(wrapper.text()).toContain('Connecting...');
  });
});
