'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const TABS = ['/', '/team', '/events', '/portal'];

export default function MobileSwipeNav() {
  const pathname = usePathname();
  const router = useRouter();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // Only enable on mobile viewports (< 1024px)
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const target = e.target as HTMLElement | null;
      // Skip if swiping inside interactive elements, carousels, or forms
      if (
        target?.closest('input, textarea, select, button, [role="dialog"], .HighlightsCarousel, [data-swipe-ignore]')
      ) {
        touchStartRef.current = null;
        return;
      }
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touchEnd = e.changedTouches[0];
      const deltaX = touchEnd.clientX - touchStartRef.current.x;
      const deltaY = touchEnd.clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      // Ensure horizontal swipe: deltaX significant (> 80px) and vertical small (< 45px)
      if (Math.abs(deltaX) > 80 && Math.abs(deltaY) < 45) {
        // Find current tab index
        let currentIndex = TABS.findIndex((tab) =>
          tab === '/' ? pathname === '/' : pathname === tab || pathname.startsWith(tab + '/')
        );

        if (currentIndex === -1) return;

        if (deltaX < 0 && currentIndex < TABS.length - 1) {
          // Swiped left -> Next tab
          if ('vibrate' in navigator) {
            try { navigator.vibrate(8); } catch {}
          }
          router.push(TABS[currentIndex + 1]);
        } else if (deltaX > 0 && currentIndex > 0) {
          // Swiped right -> Previous tab
          if ('vibrate' in navigator) {
            try { navigator.vibrate(8); } catch {}
          }
          router.push(TABS[currentIndex - 1]);
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pathname, router]);

  return null;
}
