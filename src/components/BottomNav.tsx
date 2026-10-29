'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Images,
  GraduationCap,
  UserCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { label: 'Home',           href: '/',       icon: Home,          exact: true  },
  { label: 'Team',           href: '/team',   icon: Users,         exact: false },
  { label: 'Gallery',        href: '/events', icon: Images,        exact: false },
  { label: 'Portal',         href: '/portal', icon: GraduationCap, exact: false },
  { label: 'Profile',        href: '/login',  icon: UserCircle,    exact: false },
] as const;

const CONTINUOUS_PATHS: readonly string[] = ['/', '/team', '/events', '/portal'];

/**
 * Mobile-only bottom tab bar — visible only on screens < lg (1024 px).
 * Mirrors the YouTube-style bottom nav pattern.
 * Hidden on desktop (lg:hidden) and hidden on /login for a dedicated auth screen.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(Boolean(session?.user));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Dedicated full-screen experience for login
  if (pathname === '/login') {
    return null;
  }

  const handleTabClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {}
    }

    // When transitioning into /login, preserve continuous scroll offset and reset viewport
    if (href === '/login' && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('ai_bridge_continuous_scroll_y', String(window.scrollY));
      } catch {}
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }

    const isCurrentlyContinuous = CONTINUOUS_PATHS.includes(pathname);
    const isTargetContinuous = CONTINUOUS_PATHS.includes(href);

    if (isCurrentlyContinuous && isTargetContinuous) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('mobile-page-navigate', { detail: href }));
    }
  };

  return (
    /* Safe-area padding handles iPhone home-bar notch */
    <nav
      aria-label="Mobile navigation"
      className={[
        'fixed bottom-0 inset-x-0 z-50',
        'lg:hidden',                          // desktop → invisible
        'bg-white/95 backdrop-blur-md',
        'border-t border-slate-200/80',
        'shadow-[0_-4px_24px_rgba(0,0,0,0.07)]',
        'pb-[env(safe-area-inset-bottom)]',   // iOS safe area
      ].join(' ')}
    >
      <ul className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/');

          // Dynamically label the tab "Profile" if logged in, otherwise "Sign In"
          const displayLabel = href === '/login' ? (isLoggedIn ? 'Profile' : 'Sign In') : label;

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                onClick={(event) => handleTabClick(event, href)}
                aria-label={displayLabel}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center justify-center gap-0.5 h-full w-full transition-colors"
              >
                {/* Icon wrapper — active pill background */}
                <span
                  className={[
                    'flex items-center justify-center',
                    'rounded-full px-4 py-1 transition-all duration-200',
                    isActive
                      ? 'bg-emerald-100'
                      : 'bg-transparent',
                  ].join(' ')}
                >
                  <Icon
                    className={[
                      'w-5 h-5 transition-colors duration-200',
                      isActive
                        ? 'text-emerald-700'
                        : 'text-slate-400',
                    ].join(' ')}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </span>

                {/* Label */}
                <span
                  className={[
                    'text-[10px] font-semibold leading-none tracking-tight transition-colors duration-200',
                    isActive ? 'text-emerald-700' : 'text-slate-400',
                  ].join(' ')}
                >
                  {displayLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
