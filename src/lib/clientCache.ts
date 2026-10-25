interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

const MAX_CACHE_ENTRY_LENGTH = 750_000;

export function readClientCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (!entry || typeof entry.expiresAt !== 'number' || entry.expiresAt <= Date.now()) {
      window.localStorage.removeItem(key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

export function writeClientCache<T>(key: string, value: T, ttlMs: number): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify({
      expiresAt: Date.now() + ttlMs,
      value,
    } satisfies CacheEntry<T>);

    if (serialized.length > MAX_CACHE_ENTRY_LENGTH) return;
    window.localStorage.setItem(key, serialized);
  } catch {
    // Storage can be disabled or full; the network response remains authoritative.
  }
}
