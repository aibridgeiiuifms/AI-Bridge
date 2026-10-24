/**
 * Manages anonymous visitor session IDs and client-side geo caching.
 */

const SESSION_KEY = 'aib_session_id';
const COUNTRY_KEY = 'aib_country';

/**
 * Returns a stable UUID for the current browser session.
 * Reused across refreshes; generated once and stored in localStorage.
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr_session';
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'temp_session_' + Date.now();
  }
}

/**
 * Fetches country name ONCE per user session to avoid third-party API rate limits.
 * Silently caches to localStorage.
 */
export async function fetchAndCacheCountry(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(COUNTRY_KEY);
    if (cached) return cached;

    // Fast, lightweight country lookup with 3-second timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const res = await fetch('https://ipapi.co/country_name/', {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const country = (await res.text()).trim();
      if (country && !country.includes('error')) {
        localStorage.setItem(COUNTRY_KEY, country);
        return country;
      }
    }
  } catch {
    // Geo lookup failed or timed out — non-critical, ignored
  }
  return null;
}

/**
 * Reads cached country synchronously without network overhead.
 */
export function getCachedCountry(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(COUNTRY_KEY);
  } catch {
    return null;
  }
}
