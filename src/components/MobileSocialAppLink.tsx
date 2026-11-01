'use client';

import type { MouseEvent, ReactNode } from 'react';

export default function MobileSocialAppLink({
  href,
  appHref,
  androidAppHref,
  label,
  className,
  children,
}: {
  href: string;
  appHref: string;
  androidAppHref?: string;
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
    const isAndroid = /Android/i.test(userAgent);
    const isMobile =
      isAndroid ||
      /iPhone|iPad|iPod/i.test(userAgent) ||
      (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1);

    if (!isMobile) return;

    event.preventDefault();
    window.location.assign(isAndroid && androidAppHref ? androidAppHref : appHref);
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
