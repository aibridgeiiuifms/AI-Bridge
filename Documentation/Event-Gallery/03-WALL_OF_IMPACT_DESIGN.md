# AI Bridge — The Wall of Impact (Exhibition Gallery Design)

**Design Version:** v2.0  
**Status:** Implemented & Active  
**Theme:** Fine-Art Impact Exhibition Wall  
**Target Routes:** `/events` (Albums Wall) and `/events/[folderSlug]` (The Wall of Impact)

---

## 1. Concept & Vision

"The Wall of Impact" transforms the standard digital photo gallery into a physical, exhibition-style storytelling board. Instead of cold, plain white digital cards, events and moments are presented as physical artifacts: fine-art prints mounted on warm archival paper, subtly pinned to an organic gallery wall with realistic 3D metallic pushpins.

---

## 2. Core Design Elements

### 2.1 Subtle Pin & Paper Physicality
- **Realistic 3D Metallic Pushpins:** Dual-tone brass/gold and emerald enamel pins featuring specular highlights, metallic bevels, and angled needle drop shadows cast directly onto the paper.
- **Warm Archival Paper Mounts:** Photographs and story cards use warm ivory/cotton cardstock tones (`#FDFBF7`, `#FAF7F2`, `#F7F5E9`) with fine border definitions (`#E8E2D5`), completely eliminating harsh, sterile blank white boxes.
- **Organic Ambient Lighting:** Soft emerald and amber ambient wallpaper glows evoke a warm exhibition gallery feel.

### 2.2 Asymmetric Pinterest-Inspired Layout
- **Rhythmic Dimensions:** Photographs alternate dynamically between portrait (`h-96+`), wide landscape (`h-72+`), and classic 4:3 exhibition formats, breaking visual monotony.
- **Alternating Storytelling Columns (Desktop):**
  - **Even items:** Pinned photograph on the Left (`54%`), Storytelling dispatch on the Right (`46%`).
  - **Odd items:** Storytelling dispatch on the Left (`46%`), Pinned photograph on the Right (`54%`).
- **Mobile Graceful Stacking:** Automatically stacks vertically with the **Image First** on top and the **Storytelling Dispatch Underneath** on mobile viewports.

### 2.3 Single Primary Photo & Interactive Photo Reel
- **Hero Presentation:** Only the single primary / cover photograph is displayed on the wall to maintain visual focus and avoid thumbnail clutter.
- **Stacked Photo Deck Explorer:** If an event contains multiple photos, a playful, compact floating reel pill (`[✦ X Moments • Explore →]`) features fanned miniature cards peeking out from behind the icon. 
- **Direct Interaction:** Hovering fans the mini cards; clicking either the photo or the reel pill opens the full-screen immersive lightbox immediately.

### 2.4 Hover & Physics Animations
- **Resting Tilt:** Each photograph card rests with an authentic hand-pinned tilt (`-2.5°` to `+2.6°`).
- **Interactive Lift:** On hover, the photograph gently lifts (`-8px`), rotates straight (`0°`), and scales subtly (`1.015x`) while casting a deep, soft emerald drop shadow.
- **Silky Transitions:** Managed via cubic-bezier easing curves (`cubic-bezier(0.16, 1, 0.3, 1)`).

### 2.5 Light Thematic Color Palette
Matches AI Bridge's sustainability & SDG brand palette:
- **Wall Canvas:** `#F7F5E9` (Warm Sand / Exhibition Ivory)
- **Even Story Card:** `#F1F6F3` (Soft Sage / Mint gradient) with `#064E3B` emerald accents
- **Odd Story Card:** `#FAF5ED` (Warm Linen / Tea gradient) with `#78350F` amber accents
- **Photo Mounts:** `#FDFBF7` (Archival Cotton Matte) with `#E8E2D5` border

---

## 3. Implemented Components

| Component / File | Role |
|---|---|
| [`src/app/events/[folderSlug]/page.tsx`](file:///d:/000627-BSBA-S24/Other%20Material/web%20development/AI-Bridge/src/app/events/%5BfolderSlug%5D/page.tsx) | The Wall of Impact album events display with alternating storytelling, stacked reel explorer, and pushpins |
| [`src/components/site-pages/EventsPage.tsx`](file:///d:/000627-BSBA-S24/Other%20Material/web%20development/AI-Bridge/src/components/site-pages/EventsPage.tsx) | Landing gallery wall with pinned archival album polaroids, warm theme tones, and live filters |
| [`src/components/gallery/GalleryLightbox.tsx`](file:///d:/000627-BSBA-S24/Other%20Material/web%20development/AI-Bridge/src/components/gallery/GalleryLightbox.tsx) | Fullscreen immersive viewer for multi-photo event reels |
