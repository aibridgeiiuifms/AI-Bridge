'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Award,
  Images,
  Users,
  GraduationCap,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Home',     href: '/#hero',          icon: Home,          exact: true  },
  { label: 'Certify',  href: '/#certification', icon: Award,         exact: false },
  { label: 'Gallery',  href: '/#events',        icon: Images,        exact: false },
  { label: 'Team',     href: '/#team',          icon: Users,         exact: false },
  { label: 'Portal',   href: '/portal',         icon: GraduationCap, exact: false },
] as const;

/**
 * Mobile-only bottom tab bar — visible only on screens < lg (1024 px).
 */
export default function BottomNav() {
  const pathname = usePathname();

  const handleTabClick = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {}
    }
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className={[
        'fixed bottom-0 inset-x-0 z-50',
        'lg:hidden',
        'bg-white/95 backdrop-blur-md',
        'border-t border-[#E2DFD7]',
        'shadow-[0_-4px_24px_rgba(15,23,42,0.06)]',
        'pb-[env(safe-area-inset-bottom)]',
      ].join(' ')}
    >
      <ul className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isPortal = href === '/portal';
          const isActive = isPortal
            ? pathname === '/portal' || pathname.startsWith('/portal/')
            : pathname === '/' && href === '/#hero';

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                onClick={handleTabClick}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center justify-center gap-0.5 h-full w-full transition-colors"
              >
                <span
                  className={[
                    'flex items-center justify-center',
                    'rounded-full px-4 py-1 transition-all duration-200',
                    isActive ? 'bg-[#E6F0EC]' : 'bg-transparent',
                  ].join(' ')}
                >
                  <Icon
                    className={[
                      'w-5 h-5 transition-colors duration-200',
                      isActive ? 'text-[#0F4C3A]' : 'text-[#64748B]',
                    ].join(' ')}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </span>

                <span
                  className={[
                    'text-[10px] font-semibold leading-none tracking-tight transition-colors duration-200',
                    isActive ? 'text-[#0F4C3A]' : 'text-[#64748B]',
                  ].join(' ')}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
