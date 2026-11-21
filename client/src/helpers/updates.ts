import { ref } from 'vue';

/**
 * Reload the page when a new UI version is deployed, so unattended displays
 * (the Pi kiosk) don't keep running the old one.
 *
 * Vite gives every built file a content-hashed name, and index.html lists the
 * entry script and stylesheet. So the set of /assets/ files that index.html
 * references identifies the version: when the served index.html lists
 * different files than the page was loaded with, a new version is out. No
 * build step or version endpoint needed. nginx serves index.html with
 * no-cache, so a reload gets the new one.
 */

/** True once a newer version is known; pages with unsaved work show a prompt instead of reloading. */
export const updateAvailable = ref(false);

const RELOADED_KEY = 'stocktracker.reloadedFor';

/** The /assets/ files an index.html references, sorted. */
export function assetRefs(doc: Document): string[] {
  const urls = [
    ...Array.from(doc.querySelectorAll<HTMLScriptElement>('script[src]'), (s) => s.getAttribute('src') ?? ''),
    ...Array.from(
      doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"], link[rel="modulepreload"]'),
      (l) => l.getAttribute('href') ?? ''
    )
  ];
  const paths = urls.map((u) => new URL(u, 'http://x').pathname).filter((p) => p.includes('/assets/'));
  return [...new Set(paths)].sort();
}

/** References in the index.html being served now, or null if it couldn't be fetched or parsed. */
export async function fetchLatestRefs(indexUrl = '/index.html'): Promise<string[] | null> {
  try {
    const res = await fetch(`${indexUrl}?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const refs = assetRefs(new DOMParser().parseFromString(await res.text(), 'text/html'));
    return refs.length ? refs : null;
  } catch {
    return null; // offline or mid-deploy: try again next time
  }
}

function alreadyReloadedFor(key: string): boolean {
  try {
    return sessionStorage.getItem(RELOADED_KEY) === key;
  } catch {
    return false;
  }
}

function markReloadedFor(key: string): void {
  try {
    sessionStorage.setItem(RELOADED_KEY, key);
  } catch {
    // Without session storage there's no loop guard; reloads still only happen on a change.
  }
}

export interface UpdateCheckOptions {
  /** References of the running page (default: read from the current document). */
  current?: string[];
  /** While true (e.g. unsaved edits), only set updateAvailable instead of reloading. */
  isBusy?: () => boolean;
  reload?: () => void;
  fetchLatest?: () => Promise<string[] | null>;
}

export interface UpdateChecker {
  /** Check now; resolves to true when a newer version was found. */
  check: () => Promise<boolean>;
  /** Reload for a known update unless busy (call when the busy state may have ended). */
  applyIfIdle: () => void;
}

export function createUpdateChecker(options: UpdateCheckOptions = {}): UpdateChecker {
  const current = options.current ?? assetRefs(document);
  const isBusy = options.isBusy ?? (() => false);
  const reload = options.reload ?? (() => window.location.reload());
  const fetchLatest = options.fetchLatest ?? (() => fetchLatestRefs());
  let latestKey = '';

  function applyIfIdle() {
    if (!updateAvailable.value || isBusy()) return;
    // Guard against a reload loop if a cache somewhere keeps serving the old page.
    if (alreadyReloadedFor(latestKey)) return;
    markReloadedFor(latestKey);
    reload();
  }

  async function check(): Promise<boolean> {
    if (!current.length) return false; // dev server: nothing to compare
    const latest = await fetchLatest();
    if (!latest || latest.join('|') === current.join('|')) return false;
    latestKey = latest.join('|');
    updateAvailable.value = true;
    applyIfIdle();
    return true;
  }

  return { check, applyIfIdle };
}
