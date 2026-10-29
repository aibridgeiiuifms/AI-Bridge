'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

/**
 * Hides the footer on standalone dedicated pages like /login to ensure a clean,
 * full-height, distraction-free authentication and profile experience.
 */
export default function ConditionalFooter({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return null;
  }

  return <div className="pb-20 lg:pb-0">{children}</div>;
}
