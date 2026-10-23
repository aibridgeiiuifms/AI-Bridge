/**
 * Offline submission queue helper for Portal and Surveys
 * Caches pending submissions when network is offline and retries when reconnected.
 */

interface QueuedSubmission {
  id: string;
  url: string;
  payload: any;
  timestamp: number;
}

const STORAGE_KEY = 'ai_bridge_queued_submissions';

export function queueSubmission(url: string, payload: any): void {
  if (typeof window === 'undefined') return;
  try {
    const existing: QueuedSubmission[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const newEntry: QueuedSubmission = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      url,
      payload,
      timestamp: Date.now(),
    };
    existing.push(newEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    // Request Service Worker background sync if supported
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((reg: any) => {
        if (reg.sync) {
          reg.sync.register('portal-submit').catch(() => {});
        }
      });
    }
  } catch (err) {
    console.error('Failed to queue submission offline:', err);
  }
}

export async function flushQueuedSubmissions(): Promise<number> {
  if (typeof window === 'undefined' || !navigator.onLine) return 0;
  let sentCount = 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const items: QueuedSubmission[] = JSON.parse(raw);
    if (!items.length) return 0;

    const remaining: QueuedSubmission[] = [];
    for (const item of items) {
      try {
        const res = await fetch(item.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });
        if (res.ok) {
          sentCount++;
        } else {
          remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  } catch (err) {
    console.error('Failed to flush submissions:', err);
  }
  return sentCount;
}

// Automatically flush when coming online or on service worker message
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushQueuedSubmissions();
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_PORTAL_SUBMISSIONS') {
        flushQueuedSubmissions();
      }
    });
  }
}
