# Speed & UX Improvement Guide — The AI Bridge

> **Stack:** Next.js 15 · React 19 · Tailwind CSS · Supabase · PWA (Service Worker)
> **Goal:** Make every page feel instant and every interaction feel smooth, especially on mobile.

---

## Table of Contents

1. [Image Optimization](#1-image-optimization)
2. [Priority Loading for Above-the-Fold Content](#2-priority-loading-for-above-the-fold-content)
3. [Lazy-Load Heavy Components](#3-lazy-load-heavy-components)
4. [Font Optimization](#4-font-optimization)
5. [API & Data Caching](#5-api--data-caching)
6. [Loading Skeletons](#6-loading-skeletons)
7. [Suspense Boundaries](#7-suspense-boundaries)
8. [Offline Fallback Page](#8-offline-fallback-page)
9. [PWA Install Prompt](#9-pwa-install-prompt)
10. [Mobile UX Enhancements](#10-mobile-ux-enhancements)
11. [Optimistic UI on Portal](#11-optimistic-ui-on-portal)
12. [HTTP Headers & Asset Caching](#12-http-headers--asset-caching)
13. [Background Sync for Forms](#13-background-sync-for-forms)

---

## 1. Image Optimization

### Problem
`logo.jpg`, `hhp-logo.jpeg`, and highlight images are uncompressed JPEGs. They are larger than needed.

### Fix
Convert all static images to `.webp` format. WebP is 25–35% smaller than JPEG at the same quality.

**How to convert (one-time):**
```bash
# Install sharp CLI (or use any online tool like squoosh.app)
npx @squoosh/cli --webp '{}' public/logo.jpg
npx @squoosh/cli --webp '{}' public/hhp-logo.jpeg
```

After converting, update all references in code from `.jpg` / `.jpeg` to `.webp`.

**Next.js already handles this automatically** for remote images via its built-in optimizer — but local static images are served as-is unless you convert them.

> **Impact:** Faster First Contentful Paint (FCP). Significant on slow mobile connections.

---

## 2. Priority Loading for Above-the-Fold Content

### Problem
Next.js `<Image>` lazy-loads all images by default. Images visible immediately on page load (navbar logo, hero section) still wait to load, causing a visual delay.

### Fix
Add the `priority` prop to images that appear above the fold (visible without scrolling).

**Example — Navbar logo:**
```tsx
// src/components/Navbar.tsx
<Image
  src="/logo.jpg"
  alt="The AI Bridge Logo"
  width={44}
  height={44}
  priority          // ← add this
  className="w-full h-full object-contain rounded-lg"
/>
```

Apply `priority` to:
- Navbar logo (`/logo.jpg`)
- Hero section banner (if any)
- First highlight carousel image

> **Impact:** Eliminates Largest Contentful Paint (LCP) delay for the logo/hero area.

---

## 3. Lazy-Load Heavy Components

### Problem
`HighlightsCarousel` and `SDGWheelScrollAnimation` are large, animation-heavy components. They are bundled and parsed on every page load even when not immediately visible.

### Fix
Use Next.js `dynamic()` to split them into separate JS chunks that only load when needed.

```tsx
// src/app/page.tsx (or wherever they are used)
import dynamic from 'next/dynamic';

const HighlightsCarousel = dynamic(
  () => import('@/components/HighlightsCarousel'),
  {
    ssr: false,           // runs only in browser (uses DOM APIs)
    loading: () => (
      <div className="h-64 bg-slate-100 animate-pulse rounded-xl" />
    ),
  }
);

const SDGWheelScrollAnimation = dynamic(
  () => import('@/components/SDGWheelScrollAnimation'),
  { ssr: false }
);
```

> **Impact:** Reduces initial JS bundle size. Page becomes interactive faster.

---

## 4. Font Optimization

### Problem
The app uses a system font stack defined in CSS. System fonts vary across devices and can cause a brief Flash of Unstyled Text (FOUT). There is no font preloading.

### Fix
Use `next/font` to self-host a Google Font. It:
- Automatically preloads the font file
- Eliminates layout shift (zero FOUT)
- Does **not** make a runtime request to Google Fonts

```tsx
// src/app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',    // show system font until Inter loads
  variable: '--font-inter',
});

// In <body>:
<body className={`${inter.variable} font-sans ...`}>
```

Then update `tailwind.config.ts`:
```ts
fontFamily: {
  sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
},
```

> **Impact:** Eliminates FOUT. Consistent typography across all devices.

---

## 5. API & Data Caching

### Problem
Supabase calls in server components (Team page, Footer, Portal) re-fetch on every request with no caching. Repeated calls within a single render are duplicated.

### Fix — A: `React.cache()` for deduplicated server-side fetches

Wrap shared Supabase fetch functions so they are called only once per render, even if multiple components use them.

```ts
// src/lib/supabase/queries.ts
import { cache } from 'react';
import { createClient } from './server';

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});
```

### Fix — B: Next.js `fetch` cache for API routes

In API route handlers, set revalidation time so the same data is not re-fetched from Supabase on every request:

```ts
// src/app/api/team/route.ts
export const revalidate = 300; // Cache team data for 5 minutes
```

> **Impact:** Fewer round-trips to Supabase. Faster server response times.

---

## 6. Loading Skeletons

### Problem
When navigating to Team, Portal, or Gallery, the page shows a blank white flash until data loads. This feels broken and slow even if it only takes 300ms.

### Fix
Create skeleton placeholder components that match the shape of the real content.

**Example — Team card skeleton:**
```tsx
// src/components/skeletons/TeamCardSkeleton.tsx
export function TeamCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-4 space-y-3 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-slate-200 mx-auto" />
      <div className="h-3 bg-slate-200 rounded w-3/4 mx-auto" />
      <div className="h-2 bg-slate-100 rounded w-1/2 mx-auto" />
    </div>
  );
}
```

Use inside a `<Suspense>` boundary (see next section).

> **Impact:** Eliminates blank flash. Page feels fast even on slow connections.

---

## 7. Suspense Boundaries

### Problem
Async server components block the entire page render until all data is fetched. The user sees nothing until everything is ready.

### Fix
Wrap slow async sections in `<Suspense>` with a skeleton fallback. Next.js streams the page shell instantly and fills in data as it arrives.

```tsx
// src/app/team/page.tsx
import { Suspense } from 'react';
import { TeamCardSkeleton } from '@/components/skeletons/TeamCardSkeleton';
import TeamGrid from '@/components/TeamGrid'; // async server component

export default function TeamPage() {
  return (
    <main>
      <h1>Team & Leadership</h1>
      <Suspense
        fallback={
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <TeamCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <TeamGrid />  {/* fetches from Supabase */}
      </Suspense>
    </main>
  );
}
```

> **Impact:** Page shell loads instantly. Data streams in progressively. Massive perceived speed improvement.

---

## 8. Offline Fallback Page

### Problem
When a user is offline and visits a page not in the Service Worker cache, the browser shows a generic "No internet" error screen. This breaks the PWA experience.

### Fix
Create a simple `/offline.html` and serve it from the Service Worker as a fallback.

**Step 1 — Create the fallback page:**
```html
<!-- public/offline.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>You're Offline – AI Bridge</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: sans-serif; display: flex; align-items: center;
           justify-content: center; min-height: 100vh; margin: 0;
           background: #f8fafc; color: #1e293b; text-align: center; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p  { color: #64748b; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div>
    <h1>📡 You're Offline</h1>
    <p>Please check your internet connection and try again.</p>
    <button onclick="location.reload()" style="margin-top:1rem;padding:0.5rem 1.5rem;
      border-radius:0.5rem;background:#065f46;color:#fff;border:none;cursor:pointer;">
      Try Again
    </button>
  </div>
</body>
</html>
```

**Step 2 — Update `public/sw.js` install & fetch:**
```js
// Add to STATIC_ASSETS in sw.js
const STATIC_ASSETS = [
  '/',
  '/offline.html',  // ← add this
  ...
];

// In the HTML page fetch handler, update the catch:
.catch(() => caches.match(request) || caches.match('/offline.html'))
```

> **Impact:** App never shows a blank browser error page. Professional offline experience.

---

## 9. PWA Install Prompt

### Problem
Users don't know they can install the app to their home screen. The browser's default prompt is easy to miss.

### Fix
Intercept the `beforeinstallprompt` event and show a custom in-app banner.

```tsx
// src/components/PWAInstallBanner.tsx
'use client';
import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!prompt) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 z-50 flex items-center
                    gap-3 bg-emerald-800 text-white rounded-2xl px-4 py-3 shadow-xl
                    max-w-sm mx-auto">
      <Download className="w-5 h-5 shrink-0" />
      <p className="text-sm flex-1 font-medium">Add AI Bridge to your home screen</p>
      <button
        onClick={() => { prompt.prompt(); setPrompt(null); }}
        className="text-xs font-bold bg-white text-emerald-800 px-3 py-1 rounded-lg"
      >
        Install
      </button>
      <button onClick={() => setPrompt(null)} className="text-white/60 text-lg leading-none">
        ×
      </button>
    </div>
  );
}
```

Add `<PWAInstallBanner />` inside `<body>` in `layout.tsx`.

> **Note:** `beforeinstallprompt` works on Android/Chrome. iOS users must manually use "Share → Add to Home Screen".

> **Impact:** Increases PWA install rate significantly.

---

## 10. Mobile UX Enhancements

### A — Haptic Feedback on Bottom Nav

Makes the tab bar feel native on Android devices.

```tsx
// src/components/BottomNav.tsx — inside the Link onClick
onClick={() => {
  if ('vibrate' in navigator) navigator.vibrate(8); // 8ms pulse
}}
```

### B — Swipe Navigation Between Tabs

Lets users swipe left/right to switch tabs, like a native app.

Use the `touch` events directly — no library needed:

```tsx
// Attach to <main> in layout.tsx
useEffect(() => {
  let startX = 0;
  const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
  const onTouchEnd = (e: TouchEvent) => {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 60) {
      // diff < 0 = swipe left = go forward in tab order
      // diff > 0 = swipe right = go back in tab order
    }
  };
  document.addEventListener('touchstart', onTouchStart);
  document.addEventListener('touchend', onTouchEnd);
  return () => {
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchend', onTouchEnd);
  };
}, []);
```

> **Impact:** App feels native on mobile. Reduces friction between sections.

---

## 11. Optimistic UI on Portal

### Problem
When a student submits the portal form, they wait 1–3 seconds for the server to respond before seeing any feedback. This feels slow and creates uncertainty.

### Fix
Show the success state immediately (optimistically) and only revert if the server returns an error.

```tsx
// Pattern inside portal form submit handler
const handleSubmit = async (data: FormData) => {
  setStatus('success');           // ← show success immediately
  try {
    await submitToSupabase(data); // actual server call
  } catch {
    setStatus('error');           // revert only on failure
    showToast('Submission failed. Please try again.');
  }
};
```

> **Impact:** Form submissions feel instant. Students don't think the app is broken while waiting.

---

## 12. HTTP Headers & Asset Caching

### Problem
Static assets (images, fonts, JS bundles) are re-fetched more often than necessary because no long-term cache headers are set.

### Fix
Add cache headers in `next.config.ts`:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Cache static assets for 1 year (they are content-hashed by Next.js)
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache public images for 30 days
        source: '/public/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
  // existing config...
};
```

> **Impact:** Repeat visitors load the app almost instantly. No unnecessary re-downloads.

---

## 13. Background Sync for Forms

### Problem
If a student loses connection mid-submission (common on mobile), their form data is lost and they have to start over.

### Fix
Use the Service Worker Background Sync API to queue failed submissions and retry them automatically when connectivity is restored.

**High-level flow:**
1. Student submits form → data is saved to IndexedDB locally
2. Service Worker registers a sync tag: `sw.sync.register('portal-submit')`
3. When the device comes back online, the SW fires a `sync` event
4. SW reads the queued data from IndexedDB and retries the POST to Supabase

```js
// In public/sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'portal-submit') {
    event.waitUntil(retrySavedSubmissions());
  }
});

async function retrySavedSubmissions() {
  // Read from IndexedDB, POST to /api/portal/..., clear on success
}
```

> **Note:** Background Sync is supported on Android Chrome. Not available on iOS Safari.

> **Impact:** Zero data loss on poor connections. Huge trust improvement for portal users.

---

## Priority Order

If you want to implement these one by one, here is the recommended order by **effort vs. impact**:

| Priority | Item | Effort | Impact |
|:---:|---|:---:|:---:|
| 1 | Suspense Boundaries | Low | 🔥 High |
| 2 | Loading Skeletons | Low | 🔥 High |
| 3 | `priority` on images | Very Low | High |
| 4 | Convert images to WebP | Low | High |
| 5 | Lazy-load heavy components | Low | High |
| 6 | Offline fallback page | Low | Medium |
| 7 | PWA Install Banner | Medium | Medium |
| 8 | Font optimization | Low | Medium |
| 9 | API caching / `revalidate` | Low | Medium |
| 10 | Optimistic UI on Portal | Medium | Medium |
| 11 | HTTP Cache headers | Low | Medium |
| 12 | Haptic feedback | Very Low | Low |
| 13 | Background Sync | High | Medium |

---

*Last updated: October 2026 — AI Bridge v1 · FMS IIUI*
