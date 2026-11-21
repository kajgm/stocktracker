import { readFile } from 'node:fs/promises';
import { writeFileAtomic } from '../lib/atomicWrite.js';
import type { HistoryStore } from './historyStore.js';

/** Load saved history. A missing or unreadable file just means an empty chart. */
export async function loadHistoryFile(history: HistoryStore, path: string): Promise<void> {
  try {
    history.load(JSON.parse(await readFile(path, 'utf8')));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error(`Could not load chart history from ${path}: ${(e as Error).message}`);
    }
  }
}

export async function saveHistoryFile(history: HistoryStore, path: string): Promise<void> {
  try {
    await writeFileAtomic(path, JSON.stringify(history));
  } catch (e) {
    console.error(`Could not save chart history to ${path}: ${(e as Error).message}`);
  }
}
