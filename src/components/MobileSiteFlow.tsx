'use client';

import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import SdgLoading from '@/components/SdgLoading';

const TeamPage = dynamic(() => import('@/components/site-pages/TeamPage'), {
  loading: () => <PageLoading label="Loading the team..." />,
});
const EventsPage = dynamic(() => import('@/components/site-pages/EventsPage'), {
  loading: () => <PageLoading label="Loading the gallery..." />,
});
const PortalPage = dynamic(() => import('@/components/site-pages/PortalPage'), {
  loading: () => <PageLoading label="Loading the portal..." />,
});
const ProfilePage = dynamic(() => import('@/components/site-pages/ProfilePage'), {
  loading: () => <PageLoading label="Loading your profile..." />,
});

const PAGE_PATHS = ['/', '/team', '/events', '/portal', '/login'] as const;

interface MobileSiteFlowProps {
  home: ReactNode;
  routeContent: ReactNode;
}

function PageLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-[50svh] items-center justify-center gap-3 bg-slate-50 px-4 text-sm font-semibold text-slate-500">
      <SdgLoading size={28} label={label} />
      <span>{label}</span>
    </div>
  );
}

export default function MobileSiteFlow({ home, routeContent }: MobileSiteFlowProps) {
  const pathname = usePathname();
  const router = useRouter();
  const sectionsRef = useRef<Map<string, HTMLElement>>(new Map());
  const loadedPathsRef = useRef(new Set<string>(['/']));
  const scrollDrivenRouteChangeRef = useRef(false);
  const hasHandledInitialPathRef = useRef(false);
  const [loadedPaths, setLoadedPaths] = useState<Set<string>>(() => new Set(['/']));

  const currentPagePath = PAGE_PATHS.find((path) => pathname === path);
  const showContinuousFlow = Boolean(currentPagePath);

  const pages = useMemo(() => [
    { path: '/', label: 'Home' },
    { path: '/team', label: 'Team' },
    { path: '/events', label: 'Gallery' },
    { path: '/portal', label: 'Portal' },
    { path: '/login', label: 'Profile' },
  ], []);

  const registerSection = useCallback((path: string, element: HTMLElement | null) => {
    if (element) sectionsRef.current.set(path, element);
    else sectionsRef.current.delete(path);
  }, []);

  const loadPath = useCallback((path: string) => {
    if (loadedPathsRef.current.has(path)) return;
    loadedPathsRef.current.add(path);
    setLoadedPaths(new Set(loadedPathsRef.current));
  }, []);

  useEffect(() => {
    if (!showContinuousFlow) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const path = (entry.target as HTMLElement).dataset.pagePath;
        if (path) loadPath(path);
      }
    }, { rootMargin: '500px 0px' });

    for (const section of sectionsRef.current.values()) observer.observe(section);
    return () => observer.disconnect();
  }, [loadPath, showContinuousFlow, pages]);

  useEffect(() => {
    if (!showContinuousFlow || !currentPagePath) return;

    if (!hasHandledInitialPathRef.current) {
      hasHandledInitialPathRef.current = true;
      if (currentPagePath !== '/') {
        requestAnimationFrame(() => {
          sectionsRef.current.get(currentPagePath)?.scrollIntoView({ block: 'start' });
        });
      }
      loadPath(currentPagePath);
      return;
    }

    if (scrollDrivenRouteChangeRef.current) {
      scrollDrivenRouteChangeRef.current = false;
      loadPath(currentPagePath);
      return;
    }

    requestAnimationFrame(() => {
      sectionsRef.current.get(currentPagePath)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    loadPath(currentPagePath);
  }, [currentPagePath, loadPath, showContinuousFlow]);

  useEffect(() => {
    if (!showContinuousFlow) return;
    const observer = new IntersectionObserver((entries) => {
      const active = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      const path = (active?.target as HTMLElement | undefined)?.dataset.pagePath;
      if (!path || path === pathname) return;
      scrollDrivenRouteChangeRef.current = true;
      router.replace(path, { scroll: false });
    }, {
      rootMargin: '-15% 0px -55% 0px',
      threshold: [0, 0.15, 0.35, 0.6],
    });

    for (const section of sectionsRef.current.values()) observer.observe(section);
    return () => observer.disconnect();
  }, [pathname, router, showContinuousFlow, pages]);

  useEffect(() => {
    const onNavigate = (event: Event) => {
      const path = (event as CustomEvent<string>).detail;
      if (!PAGE_PATHS.includes(path as typeof PAGE_PATHS[number])) return;

      loadPath(path);
      router.push(path, { scroll: false });
      requestAnimationFrame(() => {
        sectionsRef.current.get(path)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    window.addEventListener('mobile-page-navigate', onNavigate);
    return () => window.removeEventListener('mobile-page-navigate', onNavigate);
  }, [loadPath, router]);

  if (!showContinuousFlow) {
    return <div className="lg:hidden">{routeContent}</div>;
  }

  const contentFor = (path: string) => {
    if (path === '/') return home;
    if (!loadedPaths.has(path)) return <PageLoading label="Scroll to load this page..." />;
    switch (path) {
      case '/team': return <TeamPage />;
      case '/events': return <EventsPage />;
      case '/portal': return <PortalPage />;
      case '/login': return <ProfilePage />;
      default: return null;
    }
  };

  return (
    <div className="mobile-site-flow lg:hidden">
      {pages.map(({ path, label }) => (
        <section
          key={path}
          id={`mobile-page-${path === '/' ? 'home' : path.slice(1)}`}
          ref={(element) => registerSection(path, element)}
          data-page-path={path}
          aria-label={`${label} page`}
          className="min-h-[calc(100svh-4rem)] scroll-mt-16 border-b border-slate-200/70"
        >
          {contentFor(path)}
        </section>
      ))}
    </div>
  );
}
