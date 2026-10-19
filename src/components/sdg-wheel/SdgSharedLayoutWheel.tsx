'use client';

/**
 * SdgSharedLayoutWheel.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Authentic United Nations SDG Wheel scroll-driven layout animation.
 *
 * Requirements:
 * 1. The full wheel displays ALL 17 SDGs accurately aligned in a circular wheel
 *    using pure vector SVG assets (matching sdg-logo-wheel).
 * 2. When the user scrolls, the wheel STAYS on screen, and ONLY SDGs 4, 8, 10,
 *    and 17 separate and detach from the wheel, gliding smoothly into their
 *    respective Details cards.
 * 3. The 13 remaining SDGs rebalance evenly around the wheel when targets detach.
 * 4. Scrolling back restores all slices to their original positions.
 * 5. Pure SVG files (no raster .webp images).
 * 6. Hardware-accelerated GPU transforms (x, y, scale, rotate) with spring physics.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { TARGET_SDGS } from './sdg-data';
import { STATIC_SLICES, TARGET_SLICES } from './sdg-slices-config';

// Natural spring physics configuration for detachment and return
const springTransition = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 28,
  mass: 0.8,
  restDelta: 0.01,
  restSpeed: 0.01,
};

const orderedStaticSlices = [...STATIC_SLICES].sort((a, b) => a.thetaMid - b.thetaMid);
const balancedRotationByNum = orderedStaticSlices.reduce<Record<number, number>>(
  (rotations, slice, index) => {
    const targetAngle =
      orderedStaticSlices[0].thetaMid + (index * 360) / orderedStaticSlices.length;
    const angleOffset = targetAngle - slice.thetaMid;
    rotations[slice.num] = ((angleOffset + 180) % 360 + 360) % 360 - 180;

    return rotations;
  },
  {},
);

export default function SdgSharedLayoutWheel({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const detailsTriggerRef = useRef<HTMLDivElement>(null);
  const cardSlotRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Dynamic screen offsets from wheel slots to card landing docks
  const [deltas, setDeltas] = useState<Record<number, { x: number; y: number; scale: number }>>({});

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const trigger = detailsTriggerRef.current;
    if (!trigger) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.5) {
          setIsScrolled(true);
        } else if (entry.intersectionRatio <= 0.1) {
          setIsScrolled(false);
        }
      },
      {
        rootMargin: '0px 0px -10% 0px',
        threshold: [0, 0.1, 0.5],
      },
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  const rotationTarget = useTransform(
    scrollYProgress,
    [0, 0.75],
    isScrolled ? [0, 0] : [0, 45],
    { clamp: true },
  );
  const wheelRotation = useSpring(rotationTarget, {
    stiffness: 220,
    damping: 28,
    mass: 0.8,
    restDelta: 0.01,
    restSpeed: 0.01,
  });

  // 2. Measure pinpoint screen translation vectors from wheel slots to card slots
  const measureDeltas = useCallback(() => {
    if (!wheelRef.current) return;
    const wheelRect = wheelRef.current.getBoundingClientRect();

    const newDeltas: Record<number, { x: number; y: number; scale: number }> = {};

    TARGET_SLICES.forEach((slice) => {
      const cardEl = cardSlotRefs.current[slice.num];
      if (!cardEl) return;
      const cardRect = cardEl.getBoundingClientRect();

      // Screen coordinates of this slice's visual center in the wheel
      const sliceLeft = wheelRect.left + (slice.leftPct / 100) * wheelRect.width;
      const sliceTop = wheelRect.top + (slice.topPct / 100) * wheelRect.height;
      const sliceWidth = (slice.widthPct / 100) * wheelRect.width;
      const sliceHeight = (slice.heightPct / 100) * wheelRect.height;

      const sliceCenterX = sliceLeft + (slice.localCenterXPct / 100) * sliceWidth;
      const sliceCenterY = sliceTop + (slice.localCenterYPct / 100) * sliceHeight;

      // Screen coordinates of the destination card dock's center
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;

      // Target scale factor: fit the slice comfortably into the card slot
      const maxSliceDim = Math.max(sliceWidth, sliceHeight);
      const targetDim = cardRect.width * 0.95;
      const scale = Math.min(1.4, Math.max(0.6, targetDim / maxSliceDim));

      newDeltas[slice.num] = {
        x: cardCenterX - sliceCenterX,
        y: cardCenterY - sliceCenterY,
        scale,
      };
    });

    setDeltas(newDeltas);
  }, []);

  // Compute on mount and recompute on window resize/scroll
  useEffect(() => {
    measureDeltas();
    const handleResize = () => measureDeltas();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [measureDeltas]);

  return (
    <div
      ref={containerRef}
      className={`relative min-h-[175vh] w-full select-none ${className}`}
      aria-label="Interactive UN SDG Wheel Separation"
    >
      {/* ──────────────────────────────────────────────────────────────────
          Sticky Viewport Stage: Keeps Wheel & Cards in view during scroll
      ────────────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 flex min-h-screen w-full flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-4 max-w-2xl text-center sm:mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
            Interactive SDG Alignment
          </span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            United Nations Sustainable Development Goals
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Scroll down to separate target goals (SDG 4, 8, 10 & 17) from the wheel and dock them into our initiatives.
          </p>
        </div>

        {/* ── Main Stage: Wheel on Left / Cards on Right (responsive flex) ──── */}
        <div className="flex w-full max-w-6xl flex-col items-center justify-center gap-6 lg:flex-row lg:items-center lg:gap-12">
          
          {/* ── 1. The SDG Wheel (STAYS ON SCREEN!) ──────────────────────── */}
          <div className="relative z-30 flex flex-col items-center justify-center flex-shrink-0">
            <div
              ref={wheelRef}
              className="relative aspect-square w-[220px] transform-gpu will-change-transform sm:w-[320px] md:w-[360px] lg:w-[410px]"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <motion.div
                className="absolute inset-0 transform-gpu will-change-transform"
                style={{
                  rotate: wheelRotation,
                  transformOrigin: 'center',
                  zIndex: 20,
                  backfaceVisibility: 'hidden',
                }}
              >
              {/*
               * ── 1A. The 13 Remaining SDG Slices (SVGs) ──────────────────
               * Their offsets close the gaps while the four target slices dock.
               */}
              {STATIC_SLICES.map((slice) => {
                const transformOriginX =
                  ((50 - slice.leftPct) / slice.widthPct) * 100;
                const transformOriginY =
                  ((50 - slice.topPct) / slice.heightPct) * 100;

                return (
                  <motion.div
                    key={slice.num}
                    initial={false}
                    animate={{
                      rotate: isScrolled ? balancedRotationByNum[slice.num] : 0,
                    }}
                    transition={springTransition}
                    style={{
                      left: `${slice.leftPct}%`,
                      top: `${slice.topPct}%`,
                      width: `${slice.widthPct}%`,
                      height: `${slice.heightPct}%`,
                      transformOrigin: `${transformOriginX}% ${transformOriginY}%`,
                      backfaceVisibility: 'hidden',
                    }}
                    className="absolute transform-gpu will-change-transform pointer-events-none select-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slice.src}
                      alt={slice.title}
                      className="h-full w-full object-contain pointer-events-none select-none filter-none md:drop-shadow-md"
                      loading="eager"
                      style={slice.num === 1 || slice.num === 17 ? { transform: 'scale(1.02)' } : undefined}
                    />
                  </motion.div>
                );
              })}

              {/*
               * ── 1D. The 4 Separable Slices (SVGs: SDGs 4, 8, 10, 17) ─────────
               * Sits pixel-perfectly in the wheel when !isScrolled (offset 0).
               * Smoothly separates, scales, and rotates upright into the cards when isScrolled!
               */}
              {TARGET_SLICES.map((slice) => {
                const delta = deltas[slice.num];

                return (
                  <motion.div
                    key={`slice-${slice.num}`}
                    initial={false}
                    animate={
                      isScrolled && delta
                        ? {
                            x: delta.x,
                            y: delta.y,
                            rotate: slice.targetRotation,
                            scale: delta.scale,
                            zIndex: 50,
                          }
                        : {
                            x: 0,
                            y: 0,
                            rotate: 0,
                            scale: 1,
                            zIndex: 30,
                          }
                    }
                    transition={springTransition}
                    style={{
                      left: `${slice.leftPct}%`,
                      top: `${slice.topPct}%`,
                      width: `${slice.widthPct}%`,
                      height: `${slice.heightPct}%`,
                      transformOrigin: `${slice.localCenterXPct}% ${slice.localCenterYPct}%`,
                      backfaceVisibility: 'hidden',
                    }}
                    className="absolute transform-gpu will-change-transform pointer-events-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slice.src}
                      alt={slice.title}
                      className="pointer-events-auto h-full w-full cursor-pointer object-contain filter-none transition-transform hover:scale-[1.03] active:scale-95 md:drop-shadow-md"
                      onClick={() => setIsScrolled(!isScrolled)}
                      title={`Click to ${isScrolled ? 'return' : 'separate'} SDG ${slice.num}`}
                    />
                  </motion.div>
                );
              })}
              </motion.div>
            </div>

            {/* Status indicator pill */}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isScrolled ? 'bg-teal-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              <span>
                {isScrolled
                  ? 'Goals 4, 8, 10, 17 decoupled (scroll up to re-dock)'
                  : 'Full wheel aligned (scroll down to separate goals)'}
              </span>
            </div>
          </div>

          {/* ── 2. The 4 Target Details Cards (2x2 grid on mobile and desktop) ─ */}
          <div className="relative z-0 grid w-full max-w-xl flex-1 grid-cols-2 items-stretch gap-1.5 sm:gap-4">
            {TARGET_SDGS.map((target) => (
              <div
                key={target.num}
                onClick={() => setIsScrolled(!isScrolled)}
                className={`group relative flex h-full min-w-0 cursor-pointer flex-row items-start gap-1.5 rounded-xl border bg-white/95 p-1.5 text-left shadow-xs backdrop-blur-sm transition-all sm:gap-3 sm:rounded-2xl sm:p-4 ${
                  isScrolled
                    ? 'border-slate-300 shadow-md ring-1 ring-slate-200'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
                style={{ borderTop: `4px solid ${target.color}` }}
              >
                {/*
                 * Target Landing Dock:
                 * The SVG slice translates, scales, and rotates upright to dock into this slot!
                 */}
                <div
                  ref={(el) => {
                    cardSlotRefs.current[target.num] = el;
                  }}
                  className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md min-[360px]:h-7 min-[360px]:w-7 sm:h-16 sm:w-16 sm:rounded-xl"
                  style={{ backgroundColor: `${target.color}15` }}
                >
                  {/* Visual dashed slot guide */}
                  <div
                    className={`absolute inset-0 rounded-md sm:rounded-xl border border-dashed transition-colors ${
                      isScrolled ? 'border-transparent' : 'border-slate-300 group-hover:border-slate-400'
                    }`}
                  />

                  {/* Faint goal number watermark before slice docks */}
                  <span
                    className={`text-[10px] sm:text-xs font-black transition-opacity ${
                      isScrolled ? 'opacity-0' : 'opacity-40'
                    }`}
                    style={{ color: target.color }}
                  >
                    SDG {target.num}
                  </span>
                </div>

                {/* Card Text Content */}
                <div className="w-full min-w-0 flex-1">
                  <div className="mb-0.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 sm:gap-1.5">
                    <span
                      className="inline-flex items-center rounded-full px-1 py-0.5 text-[8px] font-extrabold text-white sm:px-2 sm:text-[9px]"
                      style={{ backgroundColor: target.color }}
                    >
                      SDG {target.num}
                    </span>
                    <span className="text-[8px] font-semibold text-slate-500 sm:text-[10px]">
                      {isScrolled ? 'Decoupled' : 'In Wheel'}
                    </span>
                  </div>

                  <h3 className="break-words text-[9px] font-bold leading-tight text-slate-900 sm:text-sm sm:leading-snug">
                    {target.title}
                  </h3>

                  <p className="mt-0.5 break-words text-[9px] leading-[1.25] text-slate-600 sm:mt-1 sm:text-[11px] sm:leading-relaxed">
                    {target.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* ──────────────────────────────────────────────────────────────────
          Scroll Trigger Sentinel: Placed down the runway to toggle separation
      ────────────────────────────────────────────────────────────────── */}
      <div
        ref={detailsTriggerRef}
        className="absolute bottom-24 h-10 w-full pointer-events-none opacity-0"
        aria-hidden="true"
      />
    </div>
  );
}
