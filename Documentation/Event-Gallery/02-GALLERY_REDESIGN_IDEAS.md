# Event Gallery — Redesign Ideas

**Status:** Ideas / Brainstorm  
**Created:** October 2026  
**Goal:** Make the event gallery visually exciting, modern, and unique

---

## Current Problem (in simple words)

Right now the gallery is a plain white card list — boring.
- Every event looks the same (same white card, same layout)
- No visual energy or personality
- Nothing makes the user feel "wow" when they land on the page
- Photos feel small and hidden inside the cards

---

## 10 Ideas to Make It Attractive

---

### 💡 Idea 1 — **Masonry Photo Grid (Pinterest Style)**
**Complexity: Easy | DB change: No**

Instead of showing 1 big cover photo + small thumbnails in a row, show ALL event photos in a Pinterest-style grid where photos are different sizes and fill the space naturally. Tall photos stay tall, wide photos stay wide. No cropping.

**What changes:**
- The photo showcase section inside each event card becomes a masonry grid
- No DB change needed — just UI layout change

**Why it's better:**
- Photos feel real and alive, not squeezed into boxes
- Users immediately see more content
- Looks like a real photography portfolio

---

### 💡 Idea 2 — **Full-Width Cinematic Cover Photo**
**Complexity: Easy | DB change: No**

When you open a folder/album, the first thing you see is a full-width cinematic cover photo (like a movie poster) with the event title and date overlaid on top with a dark gradient. Scroll down to see events.

**What changes:**
- Folder landing page (`[folderSlug]/page.tsx`) gets a full-width hero image banner instead of the plain white text header
- Use the folder's first event's cover photo as the banner image

**Why it's better:**
- First impression is dramatic and powerful
- Feels like a professional event showcase
- Zero DB changes

---

### 💡 Idea 3 — **Horizontal Scroll Film Strip**
**Complexity: Medium | DB change: No**

Inside each event card, instead of a grid, photos scroll **sideways** like a film strip. User swipes left/right on mobile, uses arrow buttons on desktop. A thin film-strip border decoration at top and bottom.

**What changes:**
- Replace the current grid with a horizontal scroll row per event
- Add left/right arrow buttons
- Add a subtle "film perforations" decoration (small square dots at edges)

**Why it's better:**
- Feels like a real photo gallery / film roll
- Fits ANY number of photos perfectly
- Very mobile-friendly (swipe naturally)

---

### 💡 Idea 4 — **Color-Themed Event Cards (Auto from Cover Photo)**
**Complexity: Medium | DB change: Optional**

Each event card automatically picks up the dominant color from its cover photo and uses that color as:
- A gradient strip at the top of the card
- The background tint of the metadata bar
- The tag badge color

Example: If the cover photo is mostly blue, the card has a blue gradient. If the photo is green, the card is green-tinted.

**What changes:**
- Extract dominant color using a `<canvas>` trick (no library needed) after image loads
- Apply it dynamically using CSS variables

**DB change (optional):**
- Add a `dominant_color hex` column to `gallery_events` table to cache the extracted color
- This avoids re-computing every page load

**Why it's better:**
- Every event card feels unique and different
- Visually breaks the monotony
- Looks alive and personalized

---

### 💡 Idea 5 — **"Moments Counter" Live Badge on Folder Cards**
**Complexity: Easy | DB change: No**

On the main `/events` page where you see all the folders (albums), each folder card shows a live animated badge like:

> 📸 **47 moments captured**  
> 🗓 **3 events documented**

The numbers count up with a small animation when the card appears on screen.

**What changes:**
- Add count-up animation to the folder listing cards
- Show total photo count (sum across all events in the folder)

**Why it's better:**
- Shows users the scale of content before they click
- Creates curiosity — "47 moments? Let me see!"
- Very easy to implement, big visual impact

---

### 💡 Idea 6 — **Polaroid Wall Layout (Landing Page)**
**Complexity: Medium | DB change: No**

On the `/events` landing page, instead of plain folder cards in a grid, show a **Polaroid wall** — each folder is represented as a slightly rotated polaroid-style photo card with a handwritten-style folder name written below the photo. Hover causes the polaroid to straighten and lift with a shadow.

**What changes:**
- Replace the current folder grid cards on `EventsPage.tsx`
- Each folder card becomes a polaroid shape (white border, shadow, slight rotation)
- Random rotate angle per card (`-3deg`, `+2deg`, etc.)
- Hover = rotate to 0, shadow grows

**Why it's better:**
- Instantly feels like a photo memory wall
- Unique — nobody expects this on an NGO/club website
- No DB change needed

---

### 💡 Idea 7 — **Timeline / Story Mode View**
**Complexity: Medium | DB change: Small**

Events inside a folder are shown as a vertical timeline — like a story of the year. A vertical center line connects all events. Each event "node" alternates left/right. The event date, title, and cover photo appear on each node.

**What changes:**
- Replace the current vertical card list with an alternating left-right timeline layout
- Add a vertical line in the center
- Event nodes have a small circle dot on the timeline

**DB change (small):**
- `event_date` column already exists — just needs to be sorted and displayed prominently

**Why it's better:**
- Tells the story of the year chronologically
- Feels like a memory scrapbook / yearbook
- Very different from anything they've seen

---

### 💡 Idea 8 — **Spotlight Mode (Click-to-Focus)**
**Complexity: Medium | DB change: No**

When you click an event title or its cover photo, the page dims and the event card zooms/expands into focus (like spotlight). Other cards fade to 30% opacity. All photos of that event show in a beautiful full-card view. Click outside or press Escape to go back.

**What changes:**
- Add a click handler that sets `activeEventId` in state
- When an event is active: it gets `scale-105 z-50`, all others get `opacity-30`
- Dark overlay behind the active card
- Smooth CSS transition — no library needed

**Why it's better:**
- No separate page navigation — stays on the same page
- Very smooth and modern feel
- Works great on both mobile and desktop

---

### 💡 Idea 9 — **Animated Intro — Photos "Fall Into Place"**
**Complexity: Easy | DB change: No**

When the events page loads, each event card slides in from below with a slight delay (staggered). As you scroll down, new cards fade + slide in from below. Simple CSS animation — no library.

**What changes:**
- Add `@keyframes slideUpFade` in CSS
- Apply with `animation-delay` based on card index
- Use `IntersectionObserver` for scroll-triggered animation

**Why it's better:**
- The page feels alive and energetic on first load
- Directs the eye downward naturally
- Takes 30 minutes to implement

---

### 💡 Idea 10 — **Featured Event Hero + Grid Below**
**Complexity: Easy | DB change: Small**

The FIRST event in a folder gets a massive "featured" treatment at the top:
- Full-width card with a large cover photo on the LEFT and text on the RIGHT (desktop)
- All other events below in a 2-column card grid

**DB change (small):**
- Add `is_featured boolean DEFAULT false` column to `gallery_events`
- Admin can toggle which event is "featured" from the dashboard

**Why it's better:**
- Highlights the most important event prominently
- Creates visual hierarchy — not all cards look the same weight
- 2-column grid below is more space-efficient than 1-column

---

## Recommendation: Best Combo (Quick Win + Big Impact)

If you want to implement 2–3 ideas together that create the biggest visual change with the least risk:

| Priority | Idea | Why |
|---|---|---|
| ✅ **#1 First** | Idea 6 — Polaroid Wall | Changes the boring landing page immediately, no DB change |
| ✅ **#2 Second** | Idea 3 — Film Strip | Changes event photo view, much better on mobile |
| ✅ **#3 Third** | Idea 9 — Animated Intro | Adds life and energy, 30-minute job |

These three together will make the gallery look completely different and much more exciting.

---

## DB Changes Summary (if all ideas implemented)

| Column | Table | Idea | Type |
|---|---|---|---|
| `dominant_color` | `gallery_events` | Idea 4 | `text` (hex) |
| `is_featured` | `gallery_events` | Idea 10 | `boolean DEFAULT false` |

> Ideas 4 and 10 need new columns. All other 8 ideas need **zero DB changes**.

---

## Next Step

Pick which ideas you like (1–3 recommended). Then say "implement idea X + Y" and the full code will be built.
