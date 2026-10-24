'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/tracking/trackEvent';

/**
 * Automatically records a page_view event on route transitions.
 */
export function usePageTracking(): void {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // Avoid duplicate triggers on the exact same pathname in React Strict Mode
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    trackEvent('page_view', pathname, {
      title: typeof document !== 'undefined' ? document.title : '',
    });
  }, [pathname]);
}
