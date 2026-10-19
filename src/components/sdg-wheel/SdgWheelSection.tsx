'use client';

/**
 * SdgWheelSection.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Scroll-driven SDG wheel layout animation using Framer Motion.
 *
 * Performance model
 * ─────────────────
 * • All animation is expressed as CSS `transform` (translate + scale).
 *   No top / left / margin / width / height ever changes during scroll.
 *   → Zero layout recalculation, zero paint, compositor-only work.
 *
 * • `useScroll` + `useTransform` with transformer functions that read from
 *   a `useRef` (not state) → zero React re-renders during scroll.
 *
 * • `willChange: 'transform'` on each `motion.div` promotes it to its own
 *   GPU compositor layer before the first frame.
 *
 * • Translation deltas are measured once in `useLayoutEffect` + `ResizeObserver`
 *   and stored in a ref.  The `useTransform` transformer functions read the
 *   latest ref value on every frame — never stale, never re-rendered.
 *
 * Animation timeline (all values are fractions of `animProgress` 0 → 1)
 * ─────────────────────────────────────────────────────────────────────
 *   0.00 → 0.18  Ghost sectors in background SVG fade out
 *   0.00 → 1.00  4 overlay slices translate from wheel → card slots
 *   0.00 → 0.40  Overlay slices scale from 1.0 → 1.05 (pop-out feel)
 *   0.40 → 1.00  Overlay slices scale from 1.05 → 1.15 (settle at card)
 *   0.50 → 1.00  Card text fades in and rises
 */

import React, { useRef, useLayoutEffect, useCallback } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';

import {
  SDG_COLOR,
  SDG_SHORT_LABEL,
  TARGET_SDGS,
  STATIC_SDG_NUMS,
  type TargetSdg,
} from './sdg-data';
import {
  sectorPath,
  sectorSvgCentre,
  sectorTransformOrigin,
  sectorPxCentre,
  OUTER_R,
  INNER_R,
  SVG_EXTENT,
  WHEEL_PX,
} from './sdg-math';

// ─── Constants ────────────────────────────────────────────────────────────────

const ANIM_START  = 0.08;  // scroll fraction at which animation begins
const ANIM_END    = 0.62;  // scroll fraction at which animation is complete
const GHOST_FADE  = 0.18;  // progress fraction over which ghost sectors fade

// ─── SliceOverlay ─────────────────────────────────────────────────────────────
//
// Renders ONE animated sector as a full-wheel-sized transparent overlay.
// Kept as a separate component so `useTransform` is called at the top level
// of a React function — satisfying the Rules of Hooks even inside a list.

interface SliceOverlayProps {
  sdg:          TargetSdg;
  animProgress: MotionValue<number>;
  x:            MotionValue<number>;
  y:            MotionValue<number>;
}

function SliceOverlay({ sdg, animProgress, x, y }: SliceOverlayProps) {
  // Transform origin: sector's own visual centre (as 0–1 fraction of the div)
  const { originX, originY } = sectorTransformOrigin(sdg.num);
  // SVG-space label position (origin at SVG centre)
  const svgC = sectorSvgCentre(sdg.num);

  // Scale: subtle pop-out as slice leaves the wheel, settles slightly larger
  const scale = useTransform(animProgress, [0, 0.4, 1], [1, 1.06, 1.14]);

  // Elevation illusion: drop shadow grows as the slice "lifts off" the wheel
  const filter = useTransform(
    animProgress,
    [0, 0.25, 1],
    [
      'drop-shadow(0 0px 0px rgba(0,0,0,0))',
      'drop-shadow(0 8px 16px rgba(0,0,0,0.28))',
      'drop-shadow(0 6px 18px rgba(0,0,0,0.20))',
    ],
  );

  return (
    <motion.div
      aria-hidden
      style={{
        position:   'absolute',
        inset:      0,
        // GPU layer — all changes stay on the compositor thread
        willChange: 'transform',
        x,
        y,
        scale,
        originX,
        originY,
        filter,
        pointerEvents: 'none',
      }}
    >
      {/*
       * The SVG is the same size as the wheel container and uses the same
       * viewBox.  Only this sector's path is drawn; everywhere else is
       * transparent.  At x=0, y=0 it overlays the ghost sector in the
       * background SVG pixel-perfectly.
       */}
      <svg
        viewBox={`-${OUTER_R} -${OUTER_R} ${SVG_EXTENT} ${SVG_EXTENT}`}
        width={WHEEL_PX}
        height={WHEEL_PX}
        className="h-full w-full"
        aria-hidden
      >
        <path d={sectorPath(sdg.num)} fill={sdg.color} />
        {/* Sector number label */}
        <text
          x={svgC.x}
          y={svgC.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={22}
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
          fill="white"
          style={{ userSelect: 'none' }}
        >
          {sdg.num}
        </text>
      </svg>
    </motion.div>
  );
}

// ─── SdgCard ──────────────────────────────────────────────────────────────────
//
// The card that each slice animates toward.  The `slotRef` div is the
// measurement anchor — it must be the SAME element whose bounding rect we
// measure to compute the translation delta.

interface SdgCardProps {
  sdg:          TargetSdg;
  /** Callback ref so parent can store a reference to the slot anchor element */
  onSlotMount:  (el: HTMLDivElement | null) => void;
  animProgress: MotionValue<number>;
}

function SdgCard({ sdg, onSlotMount, animProgress }: SdgCardProps) {
  // Text content fades in and rises once the slice has mostly docked
  const textOpacity = useTransform(animProgress, [0.55, 1.0], [0, 1], { clamp: true });
  const textY       = useTransform(animProgress, [0.55, 1.0], [12, 0],  { clamp: true });

  return (
    <div
      className="flex flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-lg sm:p-4 lg:p-5"
      style={{ borderTop: `3px solid ${sdg.color}` }}
    >
      {/*
       * Slot anchor — invisible but perfectly positioned.
       * The animated overlay sector must land centred on this div.
       * background tint gives a subtle "landing pad" effect.
       */}
      <div
        ref={onSlotMount}
        className="mx-auto mb-3 h-[72px] w-[72px] flex-shrink-0 rounded-xl sm:h-20 sm:w-20"
        style={{ backgroundColor: `${sdg.color}18` }}
        aria-hidden
      />

      {/* Descriptive text — deferred reveal */}
      <motion.div style={{ opacity: textOpacity, y: textY }}>
        <span
          className="mb-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white sm:text-[11px]"
          style={{ backgroundColor: sdg.color }}
        >
          SDG {sdg.num}
        </span>

        <h3 className="mb-1 text-[11px] font-bold leading-snug text-slate-900 sm:text-xs lg:text-[13px]">
          {/* Strip the "Goal N: " prefix — the badge already identifies it */}
          {sdg.title.replace(/^Goal \d+:\s*/, '')}
        </h3>

        <p className="text-[9.5px] leading-relaxed text-slate-500 sm:text-[10.5px] lg:text-xs">
          {sdg.description}
        </p>
      </motion.div>
    </div>
  );
}

// ─── SdgWheelSection ─────────────────────────────────────────────────────────

export default function SdgWheelSection({ className = '' }: { className?: string }) {
  // ── Refs ──────────────────────────────────────────────────────────────────

  /** Outer scroll runway — `useScroll` tracks this */
  const outerRef  = useRef<HTMLDivElement>(null);
  /** The wheel container div — measured to find each sector's screen position */
  const wheelRef  = useRef<HTMLDivElement>(null);
  /**
   * Per-SDG translation deltas (wheel sector centre → card slot centre).
   * Stored in a ref, NOT state, so no re-renders fire when updated.
   */
  const deltasRef = useRef<Record<number, { x: number; y: number }>>({
    4: { x: 0, y: 0 }, 8: { x: 0, y: 0 }, 10: { x: 0, y: 0 }, 17: { x: 0, y: 0 },
  });
  /**
   * Slot anchor elements (one per target SDG), populated via callback refs.
   * Same ref object is used in measureDeltas — no re-render required.
   */
  const slotEls = useRef<Partial<Record<number, HTMLDivElement>>>({});

  // ── Scroll progress ───────────────────────────────────────────────────────

  const { scrollYProgress } = useScroll({
    target:  outerRef,
    /**
     * 'start start' → progress=0 when the section's TOP hits the viewport TOP.
     * 'end end'     → progress=1 when the section's BOTTOM hits viewport BOTTOM.
     * With min-height: 280vh, this gives ~180 vh of actual scroll to work with.
     */
    offset: ['start start', 'end end'],
  });

  /**
   * Normalised animation progress: 0 at ANIM_START, 1 at ANIM_END.
   * All subsequent transforms derive from this single value.
   */
  const animProgress = useTransform(
    scrollYProgress,
    [ANIM_START, ANIM_END],
    [0, 1],
    { clamp: true },
  );

  // ── Derived motion values ─────────────────────────────────────────────────

  /** Ghost sectors in the background SVG fade out early in the animation */
  const ghostOpacity = useTransform(
    animProgress, [0, GHOST_FADE], [1, 0], { clamp: true },
  );

  /**
   * Per-slice X / Y translation motion values.
   *
   * WHY transformer functions (not input/output arrays)?
   * The delta values in `deltasRef` are measured after mount and may be
   * updated on resize.  Using transformer functions means each frame the
   * latest ref value is read — never stale — without requiring state updates
   * or hook re-runs.
   *
   * WHY 8 separate variables (not a loop)?
   * React's Rules of Hooks forbid calling hooks inside loops.  These 8 calls
   * are at the function component's top level, which is the only valid site.
   */
  const sdg4X  = useTransform(animProgress, (p) => p * deltasRef.current[4].x);
  const sdg4Y  = useTransform(animProgress, (p) => p * deltasRef.current[4].y);
  const sdg8X  = useTransform(animProgress, (p) => p * deltasRef.current[8].x);
  const sdg8Y  = useTransform(animProgress, (p) => p * deltasRef.current[8].y);
  const sdg10X = useTransform(animProgress, (p) => p * deltasRef.current[10].x);
  const sdg10Y = useTransform(animProgress, (p) => p * deltasRef.current[10].y);
  const sdg17X = useTransform(animProgress, (p) => p * deltasRef.current[17].x);
  const sdg17Y = useTransform(animProgress, (p) => p * deltasRef.current[17].y);

  const sliceMotions: Record<number, { x: MotionValue<number>; y: MotionValue<number> }> = {
    4:  { x: sdg4X,  y: sdg4Y  },
    8:  { x: sdg8X,  y: sdg8Y  },
    10: { x: sdg10X, y: sdg10Y },
    17: { x: sdg17X, y: sdg17Y },
  };

  // ── Measurement ───────────────────────────────────────────────────────────

  /**
   * For each target SDG computes:
   *   delta.x = slotCentreX(screen) − sectorCentreX(screen)
   *   delta.y = slotCentreY(screen) − sectorCentreY(screen)
   *
   * When applied as the `x` / `y` on the overlay motion.div, the sector SVG
   * path (which is at its geometric position within the full-wheel SVG) will
   * appear centred exactly on the card slot anchor.
   *
   * Both elements are inside the same sticky div so their relative offset is
   * viewport-position-independent — correct at any scroll depth.
   */
  const measureDeltas = useCallback(() => {
    const wheelEl = wheelRef.current;
    if (!wheelEl) return;

    const wheelRect     = wheelEl.getBoundingClientRect();
    const actualWheelPx = wheelEl.offsetWidth; // CSS-computed size (responsive)

    for (const { num } of TARGET_SDGS) {
      const slotEl = slotEls.current[num];
      if (!slotEl) continue;

      const slotRect = slotEl.getBoundingClientRect();

      // Sector visual centre in px from wheel container top-left
      const { x: secX, y: secY } = sectorPxCentre(num, actualWheelPx);

      deltasRef.current[num] = {
        x: (slotRect.left + slotRect.width  / 2) - (wheelRect.left + secX),
        y: (slotRect.top  + slotRect.height / 2) - (wheelRect.top  + secY),
      };
    }
  }, []); // refs are stable — no deps needed

  useLayoutEffect(() => {
    // Initial measurement (synchronous with first browser paint)
    measureDeltas();

    // Re-measure on resize (handles viewport rotation, window resize)
    const ro = new ResizeObserver(measureDeltas);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [measureDeltas]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section
      ref={outerRef}
      aria-label="Interactive SDG alignment section — scroll to explore"
      className={`relative min-h-[280vh] ${className}`}
    >
      {/* ──────────────────────────────────────────────────────────────────
          Sticky stage — locked to viewport top while user scrolls through
          the 280 vh runway above.
      ────────────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 flex h-dvh flex-col items-center justify-center gap-4 overflow-hidden px-4 py-6 sm:gap-6 sm:px-6 sm:py-8 lg:flex-row lg:items-center lg:gap-12 lg:px-10">

        {/* ── Wheel column ─────────────────────────────────────────────── */}
        <div className="flex shrink-0 flex-col items-center gap-3">

          {/* Mobile / tablet label (desktop label is in the cards column) */}
          <div className="text-center lg:hidden">
            <span className="mb-0.5 inline-flex items-center gap-1 rounded-full border border-emerald-600/25 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              ↓ Scroll to explore
            </span>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              SDG Alignment
            </h2>
          </div>

          {/*
           * Wheel container
           * ───────────────
           * `position: relative` so the overlay motion.divs (position: absolute)
           * stack directly on top of the background SVG.
           * Responsive width via Tailwind; actual px read via `offsetWidth`.
           */}
          <div
            ref={wheelRef}
            className="relative aspect-square w-[200px] sm:w-[270px] lg:w-[330px]"
          >
            {/* ── Background SVG ─────────────────────────────────────────
             * Contains the 13 static sectors + ghost copies of the 4 target
             * sectors (faded to 0 as the overlays depart).
             * Also renders the UN hub in the centre.
            ────────────────────────────────────────────────────────────── */}
            <svg
              viewBox={`-${OUTER_R} -${OUTER_R} ${SVG_EXTENT} ${SVG_EXTENT}`}
              className="h-full w-full"
              role="img"
              aria-label="United Nations Sustainable Development Goals wheel"
            >
              {/* Static sectors — never animated */}
              {STATIC_SDG_NUMS.map((n) => (
                <path
                  key={n}
                  d={sectorPath(n)}
                  fill={SDG_COLOR[n]}
                  aria-label={SDG_SHORT_LABEL[n]}
                />
              ))}

              {/*
               * Ghost target sectors.
               * motion.g applies the opacity MotionValue to an SVG <g> element.
               * This is a compositor-only opacity change — no layout/paint.
               */}
              <motion.g style={{ opacity: ghostOpacity }}>
                {TARGET_SDGS.map(({ num, color }) => (
                  <path key={num} d={sectorPath(num)} fill={color} aria-hidden />
                ))}
              </motion.g>

              {/* Hub */}
              <circle cx="0" cy="0" r={INNER_R}     fill="#ffffff" />
              <circle cx="0" cy="0" r={INNER_R - 6} fill="#009EDB" />
              <text
                textAnchor="middle"
                fontSize={10}
                fontWeight="bold"
                fontFamily="system-ui, sans-serif"
                fill="white"
                style={{ userSelect: 'none' }}
              >
                <tspan x="0" dy="-11">SUSTAINABLE</tspan>
                <tspan x="0" dy="13">DEVELOPMENT</tspan>
                <tspan x="0" dy="13">GOALS</tspan>
              </text>
            </svg>

            {/* ── Animated slice overlays ───────────────────────────────
             * Each is a full-wheel-sized transparent div containing a single-
             * sector SVG.  At (x=0, y=0) it aligns with the background sector.
             * As scroll progresses, x/y translate it to the card slot.
            ─────────────────────────────────────────────────────────────── */}
            {TARGET_SDGS.map((sdg) => (
              <SliceOverlay
                key={sdg.num}
                sdg={sdg}
                animProgress={animProgress}
                x={sliceMotions[sdg.num].x}
                y={sliceMotions[sdg.num].y}
              />
            ))}
          </div>
        </div>

        {/* ── Cards column ─────────────────────────────────────────────── */}
        <div className="flex w-full min-w-0 max-w-md flex-1 flex-col gap-3 lg:max-w-none lg:gap-4">

          {/* Desktop-only section label */}
          <div className="hidden lg:block">
            <span className="mb-1 inline-flex items-center rounded-full border border-emerald-600/25 bg-emerald-50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Interactive SDG Alignment
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 xl:text-3xl">
              United Nations SDG Alignment
            </h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Scroll down to see how The AI Bridge maps to four global development goals.
            </p>
          </div>

          {/*
           * 2 × 2 card grid.
           * Each SdgCard exposes an `onSlotMount` callback ref that stores the
           * slot anchor element in `slotEls.current`.  These are then measured
           * in `measureDeltas` to compute the translation targets.
           *
           * The animated overlay sectors are NOT inside these cards — they are
           * absolutely positioned overlays on the wheel container that visually
           * travel across the page to the card slot positions.
           */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
            {TARGET_SDGS.map((sdg) => (
              <SdgCard
                key={sdg.num}
                sdg={sdg}
                animProgress={animProgress}
                onSlotMount={(el) => {
                  slotEls.current[sdg.num] = el ?? undefined;
                }}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
