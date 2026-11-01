'use client';

import type { MouseEvent, ReactNode } from 'react';

const instagramWebUrl = 'https://www.instagram.com/theaibridgefmsiiui/';
const instagramAppUrl = 'instagram://user?username=theaibridgefmsiiui';

export default function MobileInstagramLink({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const userAgent = navigator.userAgent;
    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(userAgent) ||
      (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1);

    if (!isMobile) return;

    event.preventDefault();

    const fallbackTimeout = window.setTimeout(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (!document.hidden) window.location.assign(instagramWebUrl);
    }, 1200);

    function handleVisibilityChange() {
      if (document.hidden) {
        window.clearTimeout(fallbackTimeout);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.location.assign(instagramAppUrl);
  }

  return (
    <a
      href={instagramWebUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Follow The AI Bridge on Instagram"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
