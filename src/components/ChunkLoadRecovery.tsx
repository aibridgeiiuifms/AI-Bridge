'use client';

import { useEffect } from 'react';

const RELOAD_GUARD_KEY = 'chunk-load-recovery-reload-at';
const RELOAD_GUARD_WINDOW_MS = 30_000;

function isChunkLoadError(message: string): boolean {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes('failed to fetch dynamically imported module') ||
    normalizedMessage.includes('importing a module script failed') ||
    normalizedMessage.includes('chunkloaderror') ||
    normalizedMessage.includes('loading chunk')
  );
}

function errorMessage(reason: unknown): string | null {
  if (typeof reason === 'string') {
    return reason;
  }

  if (reason instanceof Error) {
    return reason.message;
  }

  if (typeof reason === 'object' && reason !== null && 'message' in reason) {
    const message = reason.message;
    return typeof message === 'string' ? message : null;
  }

  return null;
}

function reloadOnce(): void {
  const now = Date.now();

  try {
    const lastReloadAt = Number(sessionStorage.getItem(RELOAD_GUARD_KEY));
    if (Number.isFinite(lastReloadAt) && now - lastReloadAt < RELOAD_GUARD_WINDOW_MS) {
      return;
    }

    sessionStorage.setItem(RELOAD_GUARD_KEY, String(now));
  } catch (error) {
    console.error('Unable to guard chunk recovery reload with session storage:', error);
    return;
  }

  window.location.reload();
}

export default function ChunkLoadRecovery() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.message)) {
        reloadOnce();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = errorMessage(event.reason);
      if (message && isChunkLoadError(message)) {
        reloadOnce();
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
