'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker once the app is mounted.
 * This component renders nothing — it's a side-effect-only hook.
 */
export default function PWAInit() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((err) => {
            // SW registration failed — app still works normally
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
