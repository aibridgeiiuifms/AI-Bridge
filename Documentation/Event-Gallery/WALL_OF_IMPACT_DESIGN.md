# AI Bridge — The Wall of Impact (Exhibition Gallery Design)

**Design Version:** v2.3  
**Status:** Implemented & Active  
**Theme:** Fine-Art Editorial Magazine & Impact Exhibition Wall  
**Target Routes:** `/events` (Albums Wall) and `/events/[folderSlug]` (The Wall of Impact)

---

## 1. Concept & Vision

"The Wall of Impact" is an exhibition-style storytelling gallery. Instead of cold, plain white boxes, events and moments are presented as physical artifacts: fine-art prints mounted on **distinctly colored archival cardstock**, pinned to an organic gallery wall with **two authentic corner metallic pushpins**, paired with **unboxed editorial magazine typography**, an **interactive peeking deck**, an **unboxed beacon pinpoint dateline**, and a **prominent multi-photo action bar**.

---

## 2. Core Implemented Features

### 2.1 Unboxed Editorial Pinpoint Dateline
- **No Box / Border:** Completely removed the generic small pill boxes around location and date.
- **Editorial Beacon Emblem:** Location features an organic soft circular emblem with a subtle pulsing radar beacon and map pin icon (`MapPin`) that gently scales on hover.
- **Tracked Editorial Typography:** Location is rendered in crisp, tracked uppercase typography (`font-extrabold uppercase tracking-[0.16em] text-slate-900 text-xs`).
- **Clean Masthead Flow:** Seamlessly connects to the Date via an editorial separator bullet (`•`).

### 2.2 Authentic Two-Corner Pushpins
- Each colored cardstock mount is secured with **two realistic 3D metallic pushpins** pinned down at the top-left and top-right corners (with specular sheen, bevels, and angled needle drop shadows).
- Replaces the generic single center pin with physically convincing notice-board mount physics.

### 2.3 Left / Right Slide-In Entry Physics
- On scroll entry:
  - **Even items (Photo Left, Text Right):** The photo slides in smoothly from the **left** (`-40px`), while the story text slides in from the **right** (`+40px`).
  - **Odd items (Photo Right, Text Left):** The photo slides in smoothly from the **right** (`+40px`), while the story text slides in from the **left** (`-40px`).
- Reinforces the alternating zigzag editorial layout.

### 2.4 Visual Peeking Photo Stack
- When an event contains multiple photos, **secondary card layers subtly peek out** from behind the primary mount at slight angles.
- When hovered, the stacked cards gently fan out, signaling to the user that there is a physical deck of prints behind the cover.

### 2.5 Prominent "Open Reel" Bottom Action Strip
- Replaced the tiny cramped pill with a **full-width action bar** at the base of the photo mount:
  - Displays **2–3 mini round thumbnail avatars** previewing the actual upcoming photos.
  - Displays clear text: `+X More Photos in Story`.
  - Prominent `Open Reel →` button that launches the immersive full-screen `GalleryLightbox`.

### 2.6 Mobile Optimization
- **Edge-to-Edge Framing:** Full width on mobile screens with clean touch paddings.
- **Touch Swipe Navigation:** Swiping left or right on the photo immediately opens the fullscreen gallery viewer.
- **Reading Progress Indicator:** Top of mobile text shows `Story #X of Y` reading progress.
- **Text Unboxed:** Story text flows naturally below the photo without rigid box borders.

### 2.7 Distinct Color Mounts (NOT White)
- **Botanical Sage Green Mount:** `#D9E6DB` with `#BFD5C3` edge.
- **Heritage Sandstone / Kraft Mount:** `#EBDDC8` with `#D6C5AB` edge.
- **Color Aura:** Ambient radial gradient glowing softly behind each photo mount on the wall.

---

## 3. Implemented Files

| File | Updates |
|---|---|
| [`src/app/events/[folderSlug]/page.tsx`](file:///d:/000627-BSBA-S24/Other%20Material/web%20development/AI-Bridge/src/app/events/%5BfolderSlug%5D/page.tsx) | Unboxed beacon pinpoint dateline, two corner pins, left/right slide-in, peeking stack, thumbnail avatar action bar, mobile touch swipe. |
| [`src/components/site-pages/EventsPage.tsx`](file:///d:/000627-BSBA-S24/Other%20Material/web%20development/AI-Bridge/src/components/site-pages/EventsPage.tsx) | Two corner pins on polaroids, peeking stack, left/right slide entry, and colored mounts. |
