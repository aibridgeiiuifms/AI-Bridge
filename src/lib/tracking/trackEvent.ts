import { getSessionId, getCachedCountry } from './session';

/**
 * Dispatches an analytics tracking event to the /api/track endpoint.
 * Fire-and-forget: completely asynchronous, non-blocking, and never throws.
 */
export function trackEvent(
  eventName: string,
  pagePath: string,
  properties: Record<string, any> = {}
): void {
  if (typeof window === 'undefined') return;

  try {
    const payload = {
      eventName,
      pagePath,
      properties,
      sessionId: getSessionId(),
      country: getCachedCountry(),
      referrer: document.referrer || null,
    };

    // Use sendBeacon if supported and payload is small for reliable delivery on page exit,
    // otherwise fallback to non-blocking fetch.
    const jsonStr = JSON.stringify(payload);

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const sent = navigator.sendBeacon('/api/track', blob);
      if (sent) return;
    }

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonStr,
      keepalive: true,
    }).catch(() => {
      // Silently ignore network failures for analytics
    });
  } catch {
    // Analytics failure should never break UI functionality
  }
}
