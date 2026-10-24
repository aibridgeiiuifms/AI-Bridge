'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/tracking/trackEvent';

/**
 * Returns a convenient track function bound to the current route.
 */
export function useTracking() {
  const currentPath = usePathname();

  const track = useCallback(
    (
      eventName: string,
      properties: Record<string, any> = {},
      pathOverride?: string
    ) => {
      const targetPath = pathOverride || currentPath || '/';
      trackEvent(eventName, targetPath, properties);
    },
    [currentPath]
  );

  return { track };
}
