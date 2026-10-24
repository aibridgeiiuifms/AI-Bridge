# 08 — User Analytics, Tracking & Like System

**Project:** The AI Bridge | FMS IIUI  
**Stack:** Next.js 14 (App Router) · Supabase (PostgreSQL) · TypeScript  
**Last Updated:** October 2026  
**Schema Source:** `Sql-Updated-Code.sql` (verified against live DB)

---

## Table of Contents

1. [What This System Does](#1-what-this-system-does)
2. [Pages We Track](#2-pages-we-track)
3. [Events We Track](#3-events-we-track)
4. [Like System](#4-like-system)
5. [Database Schema & ERD](#5-database-schema--erd)
6. [SQL Migrations](#6-sql-migrations)
7. [System Architecture](#7-system-architecture)
8. [File Structure](#8-file-structure)
9. [Core Code — Tracking](#9-core-code--tracking)
10. [Core Code — Like System](#10-core-code--like-system)
11. [Where to Add Tracking Calls](#11-where-to-add-tracking-calls)
12. [Admin Analytics Dashboard](#12-admin-analytics-dashboard)
13. [Privacy & Safety Rules](#13-privacy--safety-rules)
14. [Implementation Checklist](#14-implementation-checklist)

---

## 1. What This System Does

Two systems working together:

### 🔍 Tracking System
Records **who visits which pages** and **what they do** — no third-party tools, everything stored in our own Supabase database.

**What we capture:**
- Every page visit (automatic, zero extra code per page)
- Key user actions: opening events, viewing photos, completing surveys, downloading certificates
- Device type, browser, country, referrer per event
- Logged-in users identified by their existing auth session; anonymous visitors by a localStorage UUID

### ❤️ Like System
Lets any **logged-in user** like individual event cards in the gallery — toggle like/unlike, Instagram-style avatar display, and like counts feed the analytics dashboard.

---

## 2. Pages We Track

Every time a user loads any of these routes, a `page_view` event is recorded **automatically** by `AnalyticsProvider`.

| Route | Page |
|---|---|
| `/` | Home / Landing |
| `/events` | Event Gallery (folder list) |
| `/events/[folderSlug]` | Specific Event Album |
| `/team` | Team Page |
| `/login` | Login Page |
| `/portal` | Student Portal Home |
| `/portal/pre-survey` | Pre-Survey Form |
| `/portal/quiz` | MCQ Quiz |
| `/portal/post-survey` | Post-Survey Form |
| `/dashboard` | Admin Dashboard |
| `/dashboard/gallery` | Gallery Manager |
| `/dashboard/analytics` | Analytics Dashboard *(new page)* |
| `/verify/[id]` | Certificate Verifier |

---

## 3. Events We Track

### 3.1 Automatic (no per-page code needed)

| Event | When |
|---|---|
| `page_view` | Any route loads (fired by `usePageTracking` hook inside `AnalyticsProvider`) |
| `scroll_depth` | User scrolls past 25%, 50%, 75%, 100% of page height (requires `IntersectionObserver` — **NOT automatic**, see Section 9) |

### 3.2 Gallery & Event Album

| Event | When | Properties |
|---|---|---|
| `event_folder_opened` | Folder data loads successfully | `folder_slug`, `folder_title`, `events_count` |
| `event_time_on_page` | User leaves the folder page (hook unmounts) | `folder_slug`, `duration_seconds` |
| `lightbox_opened` | User clicks a photo | `folder_slug`, `event_title`, `photo_index` |
| `lightbox_photo_navigated` | User moves to next/prev photo | `from_index`, `to_index`, `event_title` |
| `lightbox_closed` | User closes the photo viewer | `total_photos_viewed`, `duration_seconds` |
| `event_description_expanded` | "see more" clicked | `event_title` |
| `external_link_clicked` | External chip link clicked | `url`, `label`, `event_title` |
| `event_liked` | User likes an event | `event_id`, `event_title` |
| `event_unliked` | User removes their like | `event_id`, `event_title` |

### 3.3 Student Portal Funnel

> **Important:** `survey_started` fires when the user **first interacts** with a form field — NOT on page load. Firing on page load counts browser refreshes and accidental visits as starts, which inflates the funnel data.

| Event | When | Properties |
|---|---|---|
| `survey_started` | User interacts with the first form field | `survey_type: 'pre' \| 'post'` |
| `survey_submitted` | Survey submitted successfully | `survey_type`, `question_count` |
| `quiz_started` | User clicks the "Start Quiz" button | `question_count: 30` |
| `quiz_completed` | Quiz submitted | `score`, `total_questions`, `passed: true\|false` |
| `certificate_downloaded` | PDF/PNG downloaded via `handleDownloadCertificate()` in `portal/page.tsx` | `certificate_id`, `format: 'pdf'\|'png'` |
| `certificate_verified` | Page `/verify/[id]` loads | `certificate_id` |

### 3.4 Auth

| Event | When |
|---|---|
| `login_attempted` | Login form submitted |
| `login_success` | Supabase auth callback fires (`/auth/callback`) |

---

## 4. Like System

### Rules
- Only **logged-in users** (any role) can like — `student`, `teacher`, `team-member`, `admin`
- Toggle — clicking again **unlikes**
- **Everyone** (logged in or not) can see who liked
- Likes do **not** affect display order — decoration only
- Debounced: toggle is disabled for 500ms after each click to prevent spam

### UI States on Each Event Card

```
NOT logged in:
  🤍 (greyed out)  [Login to like]  ·  12 Likes  [👤][👤][👤] +9

Logged in, not liked:
  🤍  ·  12 Likes  [👤][👤][👤] +9

Logged in, already liked:
  ❤️  ·  13 Likes  [YOUR AVATAR][👤][👤] +9
```

Avatars show the **first 4 likers** in chronological order. If a user has no `avatar_url`, show their initials in a coloured circle (same pattern already used in the `team` page).

---

## 5. Database Schema & ERD

> All table structures verified against `Sql-Updated-Code.sql`.

### Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                         profiles                             │
│──────────────────────────────────────────────────────────────│
│ id           UUID  PK  (= auth.users.id)                     │
│ email        TEXT  UNIQUE NOT NULL                           │
│ full_name    TEXT  NOT NULL                                  │
│ role         TEXT  CHECK IN ('admin','team-member',          │
│                              'student','teacher','guest')    │
│ avatar_url   TEXT  (nullable)                                │
│ student_id   TEXT  (nullable)                                │
│ department   TEXT                                            │
│ created_at   TIMESTAMPTZ                                     │
└──────┬──────────────────────────────────────────────────────┘
       │
       ├──────────────────────────────────────────────────────────────────────────┐
       │  1 ──── 0..*                                                             │
       ▼                                                                          │
┌─────────────────────────────────────────┐                                      │
│           analytics_events  (NEW)       │                                      │
│─────────────────────────────────────────│                                      │
│ id           UUID  PK                   │                                      │
│ user_id      UUID  FK → profiles  NULL  │ ← NULL means anonymous visitor       │
│ session_id   TEXT  NOT NULL             │ ← localStorage UUID                  │
│ user_role    TEXT  CHECK IN             │                                      │
│   ('admin','team-member','student',     │                                      │
│    'teacher','guest')                   │ ← mirrors profiles.role exactly      │
│ event_name   TEXT  NOT NULL             │                                      │
│ page_path    TEXT  NOT NULL             │                                      │
│ properties   JSONB DEFAULT '{}'         │                                      │
│ referrer     TEXT                       │                                      │
│ device_type  TEXT  CHECK IN             │                                      │
│   ('mobile','tablet','desktop')         │                                      │
│ browser      TEXT                       │                                      │
│ country      TEXT                       │                                      │
│ user_agent   TEXT                       │                                      │
│ created_at   TIMESTAMPTZ DEFAULT now()  │                                      │
└─────────────────────────────────────────┘                                      │
                                                                                 │
       ├──────────────────────────────────────────────────────────────────────────┘
       │  1 ──── 0..1
       ▼
┌─────────────────────────────────────────┐
│    analytics_access_control  (NEW)      │
│─────────────────────────────────────────│
│ member_id          UUID  PK             │
│   FK → profiles.id ON DELETE CASCADE   │
│ can_view_analytics BOOLEAN DEFAULT false│
│ granted_by         UUID  FK → profiles  │
│ granted_at         TIMESTAMPTZ          │
└─────────────────────────────────────────┘

       │  1 ──── 0..*  (via profile_id)
       ▼
┌─────────────────────────────────────────┐     ┌────────────────────────────────────────────┐
│         members  (existing)             │     │         gallery_events  (existing)         │
│─────────────────────────────────────────│     │────────────────────────────────────────────│
│ id              UUID  PK                │     │ id               UUID  PK                  │
│ profile_id      UUID  FK → profiles     │     │ folder_id        UUID  FK → gallery_folders│
│ team_role       TEXT  CHECK IN          │     │ title            TEXT  NOT NULL             │
│   ('admin','team-member')               │     │ slug             TEXT  NOT NULL             │
│ can_manage_gallery  BOOLEAN             │     │ location         TEXT  NOT NULL             │
│ can_manage_team     BOOLEAN             │     │ event_date       DATE  (nullable)           │
│ mcq_access_level TEXT                   │     │ is_date_visible  BOOLEAN                   │
│ ...                                     │     │ description_markdown TEXT                  │
└─────────────────────────────────────────┘     │ external_links   JSONB DEFAULT '[]'        │
                                                │ is_published     BOOLEAN DEFAULT true       │
                                                │ is_archived      BOOLEAN DEFAULT false      │
                                                └─────────────────┬──────────────────────────┘
                                                                  │
                                                                  │  1 ──── 0..*
                                                                  ▼
                                                ┌────────────────────────────────────────────┐
                                                │          event_likes  (NEW)                │
                                                │────────────────────────────────────────────│
                                                │ id         UUID  PK                        │
                                                │ event_id   UUID  FK → gallery_events       │
                                                │             ON DELETE CASCADE              │
                                                │ user_id    UUID  FK → profiles             │
                                                │             ON DELETE CASCADE              │
                                                │ created_at TIMESTAMPTZ DEFAULT now()       │
                                                │                                            │
                                                │ UNIQUE (event_id, user_id)                 │
                                                └────────────────────────────────────────────┘
```

### Relationship Summary

| From | To | Cardinality | Note |
|---|---|---|---|
| `profiles` | `analytics_events` | 1 → Many | `user_id` nullable → anonymous visitors |
| `profiles` | `analytics_access_control` | 1 → 0..1 | Admin grants access |
| `profiles` | `members` | 1 → 0..1 | Via `members.profile_id` |
| `gallery_events` | `event_likes` | 1 → Many | One event, many likes |
| `profiles` | `event_likes` | 1 → Many | One user, many likes across events |

---

## 6. SQL Migrations

### Migration 020 — Analytics Tracking
**File:** `supabase/020_analytics_tracking.sql`

```sql
-- ============================================================
-- AI BRIDGE: Analytics & Page Tracking
-- Verified against: Sql-Updated-Code.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who
    -- user_id is nullable: NULL means the visitor is not logged in (anonymous)
    user_id      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id   TEXT        NOT NULL,   -- localStorage UUID, never null

    -- Role mirrors profiles.role CHECK exactly (verified from Sql-Updated-Code.sql line 8)
    user_role    TEXT        NOT NULL DEFAULT 'guest'
                             CHECK (user_role = ANY (ARRAY[
                               'admin', 'team-member', 'student', 'teacher', 'guest'
                             ])),

    -- What
    event_name   TEXT        NOT NULL,   -- e.g. 'page_view', 'lightbox_opened'
    page_path    TEXT        NOT NULL,   -- e.g. '/events/sdg-walk-2024'
    properties   JSONB       NOT NULL DEFAULT '{}',

    -- Context
    referrer     TEXT,
    device_type  TEXT        CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
    browser      TEXT,
    country      TEXT,
    user_agent   TEXT,

    -- When
    created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for fast admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_ae_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_ae_page_path  ON public.analytics_events(page_path);
CREATE INDEX IF NOT EXISTS idx_ae_user_id    ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ae_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_ae_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_country    ON public.analytics_events(country);

-- Access control: admin grants specific team members read access to analytics
CREATE TABLE IF NOT EXISTS public.analytics_access_control (
    member_id          UUID        PRIMARY KEY
                                   REFERENCES public.profiles(id) ON DELETE CASCADE,
    can_view_analytics BOOLEAN     NOT NULL DEFAULT false,
    granted_by         UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
    granted_at         TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_access_control ENABLE ROW LEVEL SECURITY;

-- Admins can read all events
CREATE POLICY "admins_read_analytics"
    ON public.analytics_events FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Granted team members can read
CREATE POLICY "granted_members_read_analytics"
    ON public.analytics_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.analytics_access_control
            WHERE member_id = auth.uid() AND can_view_analytics = true
        )
    );

-- Only admins manage who has access
CREATE POLICY "admins_manage_access"
    ON public.analytics_access_control FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- NOTE: All INSERTs go through /api/track using SERVICE_ROLE_KEY (bypasses RLS entirely)
-- No direct INSERT policy is needed for anonymous or logged-in users.
```

---

### Migration 021 — Event Likes
**File:** `supabase/021_event_likes.sql`

```sql
-- ============================================================
-- AI BRIDGE: Event Like System
-- FK references public.gallery_events (confirmed in Sql-Updated-Code.sql line 200)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.event_likes (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- FK to the correct existing table name: gallery_events (not 'events')
    event_id   UUID        NOT NULL
                           REFERENCES public.gallery_events(id) ON DELETE CASCADE,

    user_id    UUID        NOT NULL
                           REFERENCES public.profiles(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    CONSTRAINT unique_event_like UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_el_event_id ON public.event_likes(event_id);
CREATE INDEX IF NOT EXISTS idx_el_user_id  ON public.event_likes(user_id);

-- RLS
ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;

-- Anyone (logged in or not) can read likes — public, like Instagram
CREATE POLICY "anyone_can_read_likes"
    ON public.event_likes FOR SELECT
    USING (true);

-- Only logged-in users can insert their own like
CREATE POLICY "users_can_like"
    ON public.event_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Only the same user can remove their own like
CREATE POLICY "users_can_unlike"
    ON public.event_likes FOR DELETE
    USING (auth.uid() = user_id);

-- ─── Safe summary view ────────────────────────────────────────────────────
-- Exposes only full_name + avatar_url (NOT user_id / email) to protect privacy
-- while still allowing the avatar row to render for all visitors.
CREATE OR REPLACE VIEW public.event_like_summary AS
SELECT
    el.event_id,
    COUNT(*)::int                       AS like_count,
    json_agg(
        json_build_object(
            'full_name',  p.full_name,
            'avatar_url', p.avatar_url
        )
        ORDER BY el.created_at ASC
    )                                   AS likers
FROM public.event_likes el
JOIN public.profiles p ON p.id = el.user_id
GROUP BY el.event_id;
-- NOTE: No RLS on views in Postgres — privacy handled by only selecting safe columns above.
```

---

## 7. System Architecture

### Tracking Data Flow

```
User does something (page load / click / scroll)
            │
            ├── AnalyticsProvider  →  fires page_view on every pathname change
            └── Manual track() call inside a component
            │
            ▼
  trackEvent(eventName, pagePath, properties)
  [lib/tracking/trackEvent.ts]
  Fire-and-forget fetch() — never awaited, never blocks UI
            │
            ▼
  POST /api/track
  [app/api/track/route.ts]
            │
            ├── Read Supabase auth cookie → user_id, user_role
            │   (uses createClient from lib/supabase/server.ts — already in project)
            │
            ├── Normalize role: if 'member' found → write 'team-member'
            │   (guards against old data that pre-dates migration 014)
            │
            ├── User-Agent header → device_type, browser name
            │
            ├── Referer header → referrer
            │
            ├── Geo-lookup (ONCE per session, cached in localStorage)
            │   → country name from ip  (ipapi.co free: 1,000 req/day)
            │   → On subsequent events: read from localStorage 'aib_country'
            │
            ▼
  createAdminClient() from lib/supabase/admin.ts  ← already in project
  INSERT into analytics_events (bypasses RLS via SERVICE_ROLE_KEY)
            │
            ▼
  /dashboard/analytics page reads data via admin client
```

### Like Data Flow

```
User clicks ❤️ on an event card
            │
            ├── Not logged in?
            │   → Show "Login to like" tooltip. Stop.
            │
            ▼
  useLike(eventId, currentUserId) hook
            │
            ├── Already liked?
            │   → Optimistic: count-1, heart empties immediately
            │   → DELETE from event_likes WHERE event_id=? AND user_id=?
            │   → On error: rollback to previous state (re-fill heart, count+1)
            │   → track('event_unliked', path, { event_id, event_title })
            │
            └── Not liked?
                → Optimistic: count+1, heart fills immediately
                → INSERT into event_likes (event_id, user_id)
                → On error: rollback (empty heart, count-1)
                → track('event_liked', path, { event_id, event_title })
            │
            ▼
  EventLikeButton re-renders with new state
  Avatar row refreshes from event_like_summary view
```

---

## 8. File Structure

```
src/
├── lib/
│   ├── tracking/
│   │   ├── trackEvent.ts        ← fire-and-forget POST utility
│   │   └── session.ts           ← localStorage session_id + country cache
│   │
│   └── supabase/
│       ├── admin.ts             ← createAdminClient() — ALREADY EXISTS, reuse it
│       ├── client.ts            ← createClient() — ALREADY EXISTS
│       └── server.ts            ← createClient() server — ALREADY EXISTS
│
├── hooks/                       ← CREATE this directory (does not exist yet)
│   ├── usePageTracking.ts       ← fires page_view on every pathname change
│   ├── useTracking.ts           ← returns { track } for manual calls in components
│   ├── useTimeOnPage.ts         ← records time on page, fires on unmount
│   └── useLike.ts               ← like/unlike toggle with optimistic UI + rollback
│
├── components/
│   ├── AnalyticsProvider.tsx    ← 'use client', added ONCE to layout.tsx
│   └── gallery/
│       └── EventLikeButton.tsx  ← ❤️ button + avatar stack component
│
└── app/
    ├── layout.tsx               ← add <AnalyticsProvider /> here (one line)
    ├── api/
    │   └── track/
    │       └── route.ts         ← POST handler (uses createAdminClient)
    └── dashboard/
        └── analytics/
            └── page.tsx         ← admin analytics dashboard (NEW)
```

---

## 9. Core Code — Tracking

### `session.ts` — Session ID + Country Cache

```ts
// Returns a stable anonymous UUID from localStorage.
// Same visitor keeps the same session_id across refreshes.
// Also caches country lookup to avoid hitting ipapi.co on every event.

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem('aib_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('aib_session_id', id);
  }
  return id;
}

// Call ONCE at session start (in AnalyticsProvider).
// Saves country to localStorage so /api/track can read it from the request body
// instead of doing a geo-lookup on every single event.
export async function fetchAndCacheCountry(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem('aib_country')) return; // already cached
  try {
    const res = await fetch('https://ipapi.co/country_name/', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const country = (await res.text()).trim();
      localStorage.setItem('aib_country', country);
    }
  } catch {
    // geo lookup failed — country stays empty, no crash
  }
}

export function getCachedCountry(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('aib_country') || '';
}
```

---

### `trackEvent.ts` — Core Utility

```ts
import { getSessionId, getCachedCountry } from './session';

// Fire-and-forget. Never throws. Never blocks the UI.
export function trackEvent(
  eventName: string,
  pagePath: string,
  properties: Record<string, unknown> = {}
): void {
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        pagePath,
        properties,
        sessionId: getSessionId(),
        country: getCachedCountry(), // sent from client, not looked up server-side
      }),
    });
    // Intentionally NOT awaited
  } catch {
    // silently swallowed — tracking must never crash the app
  }
}
```

---

### `/api/track/route.ts` — Server Handler

```
This route uses createAdminClient() (already in src/lib/supabase/admin.ts).
No new Supabase client setup needed.

Steps:
1. Parse body: { eventName, pagePath, properties, sessionId, country }
2. Read Supabase auth from cookie using createClient() (server)
   → get user_id, user_role from profiles table
   → if no session: user_id = null, user_role = 'guest'
3. IMPORTANT: Normalize role before inserting:
   if (userRole === 'member') userRole = 'team-member'
   (Protects against pre-migration 014 edge cases)
4. Parse User-Agent header:
   → device_type: 'mobile' | 'tablet' | 'desktop'
   → browser: e.g. 'Chrome 120'
5. Read Referer header → referrer
6. country comes from the request body (already resolved client-side)
7. INSERT into analytics_events via createAdminClient()
8. Return Response with status 200
```

---

### `AnalyticsProvider.tsx` — One-Time Setup

```tsx
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/tracking/trackEvent';
import { fetchAndCacheCountry } from '@/lib/tracking/session';

export default function AnalyticsProvider() {
  const pathname = usePathname();

  // Cache country ONCE per session (not on every event)
  useEffect(() => {
    fetchAndCacheCountry();
  }, []);

  // Fire page_view on every route change
  useEffect(() => {
    if (pathname) trackEvent('page_view', pathname);
  }, [pathname]);

  return null; // renders nothing
}
```

**One line added to `layout.tsx`:**

```tsx
<body>
  <AnalyticsProvider />   {/* ← add here, above everything */}
  <PWAInit />
  <MobileSwipeNav />
  ...
```

---

### Scroll Depth (requires explicit code — NOT automatic)

`scroll_depth` requires an `IntersectionObserver`. Add this inside `usePageTracking.ts` or as a standalone hook:

```ts
// Place sentinel divs at 25%, 50%, 75%, 100% of page,
// observe them, fire trackEvent('scroll_depth', path, { percent: 25 }) etc.
// Disconnect observer on pathname change.
```

---

## 10. Core Code — Like System

### `useLike.ts` Hook — Signature & Contract

```ts
interface LikeState {
  liked: boolean;              // has the current user liked this event?
  likeCount: number;           // total likes
  likers: Liker[];             // first 4 likers (full_name + avatar_url)
  toggleLike: () => void;      // call on heart button click
  loading: boolean;            // true while DB call in flight
}

interface Liker {
  full_name: string;
  avatar_url: string | null;
}

// useLike(eventId, currentUserId)
//   eventId: the gallery_events.id UUID
//   currentUserId: from Supabase client session (null if not logged in)
//
// Optimistic UI with rollback:
//   → On like:   set liked=true, count+1 immediately
//                INSERT to event_likes
//                On error: revert liked=false, count-1
//   → On unlike: set liked=false, count-1 immediately
//                DELETE from event_likes
//                On error: revert liked=true, count+1
//
// Debounce: 500ms lock after each toggle to prevent spam clicks
```

---

### `EventLikeButton.tsx` — Component

```tsx
// Props:
//   eventId: string
//   eventTitle: string        (for tracking properties)
//   currentUserId: string | null

// Reads from event_like_summary view on mount.
// Uses useLike() hook for toggle behaviour.

// Avatar fallback: if avatar_url is null, show initials in a coloured circle
// (consistent with the existing team page avatar pattern in the codebase).

// Disabled state when not logged in:
//   heart icon is greyed (text-slate-300)
//   wrapped in a <span title="Login to like"> for tooltip
```

**Where it goes — add at the bottom of each event card in `/events/[folderSlug]/page.tsx`:**

```tsx
<article key={evt.id}>
  {/* ... existing card content unchanged ... */}

  {/* ── Like Bar ─────────────────────────────── */}
  <div className="px-6 pb-6 pt-3 border-t border-slate-100 mt-4">
    <EventLikeButton
      eventId={evt.id}
      eventTitle={evt.title}
      currentUserId={currentUserId}   // fetched once at top of FolderGalleryPage
    />
  </div>
</article>
```

**Fetching `currentUserId` in the folder page** (it's a `'use client'` component — use browser Supabase client):

```ts
// Inside FolderGalleryPage, add:
const [currentUserId, setCurrentUserId] = useState<string | null>(null);

useEffect(() => {
  const supabase = createClient(); // from @/lib/supabase/client
  supabase.auth.getUser().then(({ data }) => {
    setCurrentUserId(data.user?.id ?? null);
  });
}, []);
```

---

## 11. Where to Add Tracking Calls

### `/events/[folderSlug]/page.tsx`

```ts
// When folder data loads:
track('event_folder_opened', pathname, {
  folder_slug: folderSlug,
  folder_title: data.title,
  events_count: data.events?.length ?? 0,
});

// When lightbox opens (inside openLightbox()):
track('lightbox_opened', pathname, {
  folder_slug: folderSlug,
  event_title: eventTitle,
  photo_index: index,
});

// When photo changes inside lightbox:
track('lightbox_photo_navigated', pathname, {
  from_index: prevIndex,
  to_index: newIndex,
  event_title: lightboxEventTitle,
});

// When lightbox closes:
track('lightbox_closed', pathname, {
  total_photos_viewed: photosViewed,
  duration_seconds: elapsed,
});

// When an external link chip is clicked:
track('external_link_clicked', pathname, {
  url: link.url,
  label: link.label,
  event_title: evt.title,
});

// When "see more" is expanded (inside ExpandableEventDescription):
track('event_description_expanded', pathname, {
  event_title: evt.title,
});
```

> **Time-on-page** is handled by `useTimeOnPage` hook — fires `event_time_on_page` automatically on unmount. No manual call needed.

---

### Portal Pages

```ts
// /portal/pre-survey — on FIRST FIELD INTERACTION (not page load):
track('survey_started', '/portal/pre-survey', { survey_type: 'pre' });

// /portal/pre-survey — on successful submit:
track('survey_submitted', '/portal/pre-survey', { survey_type: 'pre' });

// /portal/quiz — when user clicks "Start Quiz":
track('quiz_started', '/portal/quiz', { question_count: 30 });

// /portal/quiz — on submit:
track('quiz_completed', '/portal/quiz', { score, total_questions, passed });

// /portal/post-survey — on submit:
track('survey_submitted', '/portal/post-survey', { survey_type: 'post' });
```

### Certificate Download — `portal/page.tsx`

Certificate download lives inside `handleDownloadCertificate()` at **line 128** of `src/app/portal/page.tsx`. Add tracking after the successful fetch:

```ts
// Inside handleDownloadCertificate(), after the blob URL is created:
track('certificate_downloaded', '/portal', {
  certificate_id: certificate?.certificate_id,
  format,   // 'pdf' or 'png'
});
```

### `/verify/[id]/page.tsx`

```ts
// On page load (useEffect):
track('certificate_verified', `/verify/${id}`, { certificate_id: id });
```

---

## 12. Admin Analytics Dashboard

**Route:** `/dashboard/analytics`  
**Access:** Admin always · Team members only if `analytics_access_control.can_view_analytics = true`

> **Route guard required:** Add a server-side check at the top of `page.tsx` using `getCurrentUser()` + `getCurrentUserProfile()` from `src/lib/supabase/queries.ts` (already in project). Redirect to `/dashboard` if neither condition is met.

### Dashboard Widgets

| Widget | Data Source |
|---|---|
| **Total Page Views (7d / 30d)** | `COUNT(*) WHERE event_name='page_view'` |
| **Unique Sessions** | `COUNT(DISTINCT session_id)` |
| **Logged-in vs Anonymous** | `GROUP BY (user_id IS NULL)` |
| **Top Pages** | `GROUP BY page_path ORDER BY count DESC LIMIT 10` |
| **Most Opened Event Folders** | Filter `event_folder_opened` → group by `properties->>'folder_slug'` |
| **Most Liked Events** | `event_like_summary` view → order by `like_count DESC` |
| **Likes Per Folder** | Join `event_likes` → `gallery_events` → `gallery_folders` → sum per folder |
| **Portal Funnel** | Count each funnel event → show step-by-step conversion % |
| **Quiz Pass Rate** | Filter `quiz_completed` → `AVG((properties->>'score')::int)` |
| **Device Split** | `GROUP BY device_type` |
| **Country Distribution** | `GROUP BY country ORDER BY count DESC LIMIT 15` |
| **Live Feed (24h)** | Last 50 rows ordered by `created_at DESC` |

### Portal Funnel Example Output

```
Pre-Survey Started:     142  (100%)
Pre-Survey Submitted:   138  (97%)  ← 3% drop-off
Quiz Started:           120  (85%)  ← 12% drop-off
Quiz Completed:         118  (83%)
  └ Passed:              95  (67%)
Post-Survey Submitted:   90  (63%)  ← 20% drop-off
Certificate Downloaded:  88  (62%)
```

---

## 13. Privacy & Safety Rules

| Rule | Detail |
|---|---|
| **No raw IP stored** | IP resolves to country name once per session, then discarded |
| **Country cached client-side** | `aib_country` in localStorage — `ipapi.co` hit max once per session, not per event |
| **No tracking cookies** | Anonymous ID stored in `localStorage` only |
| **Fire-and-forget** | `trackEvent()` never blocks or throws — safe to call anywhere |
| **RLS on analytics** | Only admin or explicitly granted members can SELECT from `analytics_events` |
| **Likes are public by design** | `event_likes` SELECT is open — same as Instagram |
| **Like view hides user_id** | `event_like_summary` exposes only `full_name` + `avatar_url` — no email or user_id leaked |
| **Like write is protected** | INSERT/DELETE on `event_likes` requires `auth.uid() = user_id` |
| **Like spam guard** | 500ms debounce on toggle button in `useLike` hook |
| **Optimistic rollback** | If like/unlike DB call fails, UI reverts to previous state automatically |
| **Service key isolated** | `createAdminClient()` used server-side only (API route) — never in browser |
| **Role normalization** | API route normalizes `'member'` → `'team-member'` before inserting to guard against pre-migration data |

---

## 14. Implementation Checklist

### Phase 1 — Database
- [ ] Run `020_analytics_tracking.sql` in Supabase SQL Editor
- [ ] Run `021_event_likes.sql` in Supabase SQL Editor
- [ ] Verify `analytics_events`, `analytics_access_control`, `event_likes` tables exist
- [ ] Verify `event_like_summary` view is created
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`

### Phase 2 — Create `src/hooks/` Directory + Core Files
- [ ] Create `src/hooks/` directory (does not exist in project)
- [ ] Create `src/lib/tracking/session.ts`
- [ ] Create `src/lib/tracking/trackEvent.ts`
- [ ] Create `src/app/api/track/route.ts` (reuses `createAdminClient` + `createClient` from existing lib)
- [ ] Create `src/hooks/usePageTracking.ts`
- [ ] Create `src/hooks/useTracking.ts`
- [ ] Create `src/hooks/useTimeOnPage.ts`
- [ ] Create `src/components/AnalyticsProvider.tsx`
- [ ] Add `<AnalyticsProvider />` to `src/app/layout.tsx` (above `<PWAInit />`)

### Phase 3 — Inline Tracking Calls
- [ ] `/events/[folderSlug]/page.tsx` — folder open, lightbox open/navigate/close, external links, description expand
- [ ] `/events/[folderSlug]/page.tsx` — add `useTimeOnPage` for `event_time_on_page`
- [ ] `/portal/pre-survey/page.tsx` — survey started (on field interaction), survey submitted
- [ ] `/portal/quiz/page.tsx` — quiz started, quiz completed
- [ ] `/portal/post-survey/page.tsx` — survey submitted
- [ ] `portal/page.tsx` `handleDownloadCertificate()` — certificate downloaded (line ~128)
- [ ] `/verify/[id]/page.tsx` — certificate verified

### Phase 4 — Like System
- [ ] Create `src/hooks/useLike.ts`
- [ ] Create `src/components/gallery/EventLikeButton.tsx`
- [ ] In `/events/[folderSlug]/page.tsx`: fetch `currentUserId` from `createClient().auth.getUser()`
- [ ] Add `<EventLikeButton>` at the bottom of each event card in the folder page
- [ ] Test: like, unlike, optimistic update, rollback on error, avatar row, debounce

### Phase 5 — Admin Dashboard
- [ ] Create `src/app/dashboard/analytics/page.tsx`
- [ ] Add server-side route guard using `getCurrentUser()` + `getCurrentUserProfile()` from `queries.ts`
- [ ] Add analytics access toggle in the existing Member Management panel
- [ ] Implement all 12 dashboard widgets
- [ ] Test with real data
