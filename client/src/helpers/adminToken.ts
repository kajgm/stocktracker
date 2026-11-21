// The admin token is kept only on devices where you tick "Remember". Browser
// storage can be unavailable (private windows, blocked site data), so every
// access is guarded and the page still works without it.
const KEY = 'stocktracker.adminToken';

export function loadToken(): string {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

export function storeToken(token: string, remember: boolean): void {
  try {
    if (remember && token) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch {
    // Not remembered; the token still works for this visit.
  }
}
