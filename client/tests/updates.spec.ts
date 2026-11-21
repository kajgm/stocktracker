import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { assetRefs, createUpdateChecker, fetchLatestRefs, updateAvailable } from '@/helpers/updates';

const page = (entry: string, css = '/assets/index-aaa.css') =>
  `<!doctype html><html><head>
    <script type="module" crossorigin src="${entry}"></script>
    <link rel="modulepreload" href="/assets/vendor-111.js">
    <link rel="stylesheet" href="${css}">
    <link rel="icon" href="/favicon.ico">
  </head><body><div id="app"></div></body></html>`;

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');
const OLD = assetRefs(parse(page('/assets/index-old.js')));
const NEW = assetRefs(parse(page('/assets/index-new.js')));

describe('assetRefs', () => {
  it('lists the built scripts and stylesheets, ignoring other links', () => {
    expect(OLD).toEqual(['/assets/index-aaa.css', '/assets/index-old.js', '/assets/vendor-111.js']);
  });

  it('is empty on the dev server, which serves source files', () => {
    expect(assetRefs(parse('<script type="module" src="/src/main.ts"></script>'))).toEqual([]);
  });
});

describe('fetchLatestRefs', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches index.html without the cache', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(page('/assets/index-new.js')) })
    );
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchLatestRefs()).toEqual(NEW);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/^\/index\.html\?v=\d+$/), { cache: 'no-store' });
  });

  it('returns null on errors or a page without assets', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline')))
    );
    expect(await fetchLatestRefs()).toBeNull();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, text: () => Promise.resolve('') }))
    );
    expect(await fetchLatestRefs()).toBeNull();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve('<p>Bad gateway</p>') }))
    );
    expect(await fetchLatestRefs()).toBeNull();
  });
});

describe('createUpdateChecker', () => {
  beforeEach(() => {
    updateAvailable.value = false;
    // Node 26 has its own sessionStorage global that shadows jsdom's; use a simple in-memory one.
    const data = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, String(v))
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does nothing while the served version matches', async () => {
    const reload = vi.fn();
    const checker = createUpdateChecker({ current: OLD, reload, fetchLatest: () => Promise.resolve(OLD) });
    expect(await checker.check()).toBe(false);
    expect(reload).not.toHaveBeenCalled();
    expect(updateAvailable.value).toBe(false);
  });

  it('reloads when a new version is served', async () => {
    const reload = vi.fn();
    const checker = createUpdateChecker({ current: OLD, reload, fetchLatest: () => Promise.resolve(NEW) });
    expect(await checker.check()).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('ignores failed checks', async () => {
    const reload = vi.fn();
    const checker = createUpdateChecker({ current: OLD, reload, fetchLatest: () => Promise.resolve(null) });
    expect(await checker.check()).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('waits while busy, then reloads once idle', async () => {
    const reload = vi.fn();
    let busy = true;
    const checker = createUpdateChecker({
      current: OLD,
      reload,
      isBusy: () => busy,
      fetchLatest: () => Promise.resolve(NEW)
    });
    await checker.check();
    expect(updateAvailable.value).toBe(true);
    expect(reload).not.toHaveBeenCalled();

    busy = false;
    checker.applyIfIdle();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('reloads only once per version, so a stale cache cannot cause a loop', async () => {
    const reload = vi.fn();
    const make = () => createUpdateChecker({ current: OLD, reload, fetchLatest: () => Promise.resolve(NEW) });
    await make().check();
    await make().check(); // the "reloaded" page still has the old assets
    expect(reload).toHaveBeenCalledOnce();
  });

  it('skips checking on the dev server', async () => {
    const fetchLatest = vi.fn(() => Promise.resolve(NEW));
    const checker = createUpdateChecker({ current: [], fetchLatest });
    expect(await checker.check()).toBe(false);
    expect(fetchLatest).not.toHaveBeenCalled();
  });
});
