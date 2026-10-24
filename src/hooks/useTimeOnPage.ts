'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/tracking/trackEvent';

/**
 * Tracks time spent on a specific page/album and reports it on unmount.
 */
export function useTimeOnPage(pagePath: string, metadata: Record<string, any> = {}): void {
  const metadataRef = useRef(metadata);
  metadataRef.current = metadata;

  useEffect(() => {
    const startTime = Date.now();

    return () => {
      const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
      // Only track if user stayed at least 2 seconds
      if (elapsedSeconds >= 2) {
        trackEvent('event_time_on_page', pagePath, {
          duration_seconds: elapsedSeconds,
          ...metadataRef.current,
        });
      }
    };
  }, [pagePath]);
}
