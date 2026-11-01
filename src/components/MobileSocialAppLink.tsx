'use client';

import type { MouseEvent, ReactNode } from 'react';

export default function MobileSocialAppLink({
  href,
  appHref,
  label,
  className,
  children,
}: {
  href: string;
  appHref: string;
  label: string;
  className: string;
  children: ReactNode;
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
      if (!document.hidden) window.location.assign(href);
    }, 1200);

    function handleVisibilityChange() {
      if (document.hidden) {
        window.clearTimeout(fallbackTimeout);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.location.assign(appHref);
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
