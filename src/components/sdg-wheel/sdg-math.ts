/**
 * sdg-math.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * All pure geometry for the 17-sector UN SDG donut wheel.
 *
 * Coordinate conventions
 * ──────────────────────
 * • SVG space: origin at wheel centre, +x right, +y down.
 *   ViewBox = `-${OUTER_R} -${OUTER_R} ${SVG_EXTENT} ${SVG_EXTENT}`.
 * • Pixel space (px): measured from the TOP-LEFT corner of the rendered
 *   wheel container.  Convert via `SVG → px` functions below.
 * • SDG 1 sits at the top (-90°) and sectors advance clockwise.
 */

// ─── Wheel geometry constants ─────────────────────────────────────────────────

export const OUTER_R   = 220;                     // SVG units — outer radius
export const INNER_R   = 102;                     // SVG units — inner (hub) radius
export const N         = 17;                      // number of sectors
export const SECTOR_DEG = 360 / N;               // ≈ 21.176° per sector
export const MID_R     = (OUTER_R + INNER_R) / 2; // ≈ 161 — label/centre radius
export const SVG_EXTENT = OUTER_R * 2;            // 440 — full SVG side length
export const WHEEL_PX  = 340;                     // default rendered size in CSS px

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Centre angle of sector `n` (1-indexed), in degrees, measured from the SVG
 * +x axis (right).  SDG 1 starts at -90° (top of wheel).
 */
export function sectorCentreAngleDeg(n: number): number {
  return -90 + (n - 0.5) * SECTOR_DEG;
}

// ─── SVG path generation ──────────────────────────────────────────────────────

/**
 * Returns the SVG arc `<path d="…">` for one donut sector.
 * The path is centred on the SVG origin — use with the canonical viewBox.
 */
export function sectorPath(n: number): string {
  const startDeg = -90 + (n - 1) * SECTOR_DEG;
  const endDeg   = -90 + n       * SECTOR_DEG;
  const sa = toRad(startDeg);
  const ea = toRad(endDeg);

  const pt = (angle: number, r: number) =>
    [Math.cos(angle) * r, Math.sin(angle) * r] as [number, number];

  const [osx, osy] = pt(sa, OUTER_R);
  const [oex, oey] = pt(ea, OUTER_R);
  const [isx, isy] = pt(sa, INNER_R);
  const [iex, iey] = pt(ea, INNER_R);

  return [
    `M ${isx} ${isy}`,
    `L ${osx} ${osy}`,
    `A ${OUTER_R} ${OUTER_R} 0 0 1 ${oex} ${oey}`,
    `L ${iex} ${iey}`,
    `A ${INNER_R} ${INNER_R} 0 0 0 ${isx} ${isy}`,
    'Z',
  ].join(' ');
}

// ─── Coordinate helpers ───────────────────────────────────────────────────────

/**
 * Visual centre of sector `n` in **SVG space** (origin at wheel centre).
 * Use these coordinates for placing text labels inside the sector.
 */
export function sectorSvgCentre(n: number): { x: number; y: number } {
  const rad = toRad(sectorCentreAngleDeg(n));
  return {
    x: Math.cos(rad) * MID_R,
    y: Math.sin(rad) * MID_R,
  };
}

/**
 * Visual centre of sector `n` in **pixel space**, measured from the
 * TOP-LEFT corner of the rendered wheel container.
 *
 * Pass the actual container width if the wheel is rendered at a different size
 * than the default WHEEL_PX.  The formula automatically scales.
 */
export function sectorPxCentre(
  n: number,
  containerPx = WHEEL_PX,
): { x: number; y: number } {
  const scale = containerPx / SVG_EXTENT;
  const { x, y } = sectorSvgCentre(n);
  // OUTER_R converts from origin-centred SVG coords to top-left-relative px
  return {
    x: (OUTER_R + x) * scale,
    y: (OUTER_R + y) * scale,
  };
}

/**
 * Framer Motion `originX / originY` values (0–1 fractions) for a sector,
 * so that `scale` transforms expand from the sector's own visual centre
 * regardless of the overall `motion.div` size.
 */
export function sectorTransformOrigin(n: number): { originX: number; originY: number } {
  // sectorPxCentre gives px from top-left; divide by total size to get 0–1
  const { x, y } = sectorPxCentre(n); // uses default WHEEL_PX
  return {
    originX: x / WHEEL_PX,
    originY: y / WHEEL_PX,
  };
}
