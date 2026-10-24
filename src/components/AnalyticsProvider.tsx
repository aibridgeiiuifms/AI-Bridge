'use client';

import { useEffect } from 'react';
import { usePageTracking } from '@/hooks/usePageTracking';
import { fetchAndCacheCountry } from '@/lib/tracking/session';

/**
 * Global analytics provider that listens to page views and initialises
 * client-side geo-cache once per session.
 */
export default function AnalyticsProvider() {
  usePageTracking();

  useEffect(() => {
    fetchAndCacheCountry();
  }, []);

  return null;
}
