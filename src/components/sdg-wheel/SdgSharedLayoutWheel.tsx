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

import React, { useRef, useState, useEffect, useCallback, type RefObject } from 'react';
import Image from 'next/image';
import {
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { TARGET_SDGS } from './sdg-data';
import { STATIC_SLICES, TARGET_SLICES, type SdgSliceConfig } from './sdg-slices-config';

const desktopSpring = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 28,
  mass: 0.8,
  restDelta: 0.01,
  restSpeed: 0.01,
};

const typingRangeByGoal: Record<number, [number, number]> = {
  4: [0.35, 0.55],
  8: [0.45, 0.65],
  10: [0.55, 0.75],
  17: [0.65, 0.85],
};
const wheelRotationRange: [number, number] = [0, 0.2];
const wheelRotationDegrees = 45;
const dockMeasurementTrigger = typingRangeByGoal[4][0] - 0.05;
const dockMeasurementReset = dockMeasurementTrigger - 0.05;

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

interface StaticSliceProps {
  slice: SdgSliceConfig;
  progress: MotionValue<number>;
}

const StaticSdgSlice = React.memo(function StaticSdgSlice({
  slice,
  progress,
}: StaticSliceProps) {
  const rotation = useTransform(
    progress,
    [typingRangeByGoal[4][0], typingRangeByGoal[17][1]],
    [0, balancedRotationByNum[slice.num]],
    { clamp: true },
  );

  return (
    <motion.div
      initial={false}
      style={{
        left: `${slice.leftPct}%`,
        top: `${slice.topPct}%`,
        width: `${slice.widthPct}%`,
        height: `${slice.heightPct}%`,
        transformOrigin: `${((50 - slice.leftPct) / slice.widthPct) * 100}% ${((50 - slice.topPct) / slice.heightPct) * 100}%`,
        rotate: rotation,
        z: 0,
        backfaceVisibility: 'hidden',
        touchAction: 'pan-y',
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
});

interface TargetSliceProps {
  slice: SdgSliceConfig;
  delta: { x: number; y: number; scale: number } | undefined;
  progress: MotionValue<number>;
}

const TargetSdgSlice = React.memo(function TargetSdgSlice({
  slice,
  delta,
  progress,
}: TargetSliceProps) {
  const range = typingRangeByGoal[slice.num];
  const x = useTransform(progress, range, [0, delta?.x ?? 0], { clamp: true });
  const y = useTransform(progress, range, [0, delta?.y ?? 0], { clamp: true });
  const rotate = useTransform(progress, range, [0, slice.targetRotation - wheelRotationDegrees], {
    clamp: true,
  });
  const scale = useTransform(progress, range, [1, delta?.scale ?? 1], { clamp: true });

  return (
    <motion.div
      style={{
        left: `${slice.leftPct}%`,
        top: `${slice.topPct}%`,
        width: `${slice.widthPct}%`,
        height: `${slice.heightPct}%`,
        transformOrigin: `${slice.localCenterXPct}% ${slice.localCenterYPct}%`,
        x,
        y,
        rotate,
        scale,
        zIndex: 50,
        z: 0,
        backfaceVisibility: 'hidden',
        touchAction: 'pan-y',
      }}
      className="absolute transform-gpu will-change-transform pointer-events-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slice.src}
        alt={slice.title}
        className="pointer-events-none h-full w-full object-contain filter-none md:drop-shadow-md"
      />
    </motion.div>
  );
});

interface ScrollTypewriterProps {
  text: string;
  progress: MotionValue<number>;
  range: [number, number];
}

function ScrollTypewriter({ text, progress, range }: ScrollTypewriterProps) {
  const rawCharIndex = useTransform(progress, range, [0, text.length], { clamp: true });
  const charIndex = useTransform(rawCharIndex, (index) => Math.floor(index));
  const [visibleCharIndex, setVisibleCharIndex] = useState(() => charIndex.get());

  useMotionValueEvent(charIndex, 'change', (index) => {
    setVisibleCharIndex((current) => (current === index ? current : index));
  });

  const isComplete = visibleCharIndex >= text.length;

  return (
    <span aria-label={text}>
      <span className="grid">
        <span aria-hidden="true" className="invisible col-start-1 row-start-1">
          {text}
        </span>
        <span aria-hidden="true" className="col-start-1 row-start-1">
          {text.slice(0, visibleCharIndex)}
          <motion.span
            aria-hidden="true"
            animate={{ opacity: isComplete ? 0 : 1 }}
            transition={{ duration: 0.12 }}
            className={`ml-px inline-block ${isComplete ? '' : 'animate-pulse'}`}
          >
            |
          </motion.span>
        </span>
      </span>
    </span>
  );
}

interface AnimatedWheelLayersProps {
  scrollProgress: MotionValue<number>;
  deltas: Record<number, { x: number; y: number; scale: number }>;
}

function AnimatedWheelLayers({
  scrollProgress,
  deltas,
}: AnimatedWheelLayersProps) {
  const rotationTarget = useTransform(
    scrollProgress,
    wheelRotationRange,
    [0, wheelRotationDegrees],
    { clamp: true },
  );
  const wheelRotation = useSpring(rotationTarget, desktopSpring);

  return (
    <motion.div
      className="absolute inset-0 transform-gpu will-change-transform"
      style={{
        rotate: wheelRotation,
        transformOrigin: 'center',
        z: 0,
        zIndex: 20,
        backfaceVisibility: 'hidden',
        touchAction: 'pan-y',
      }}
    >
      {STATIC_SLICES.map((slice) => (
        <StaticSdgSlice key={slice.num} slice={slice} progress={scrollProgress} />
      ))}
      {TARGET_SLICES.map((slice) => (
        <TargetSdgSlice
          key={slice.num}
          slice={slice}
          delta={deltas[slice.num]}
          progress={scrollProgress}
        />
      ))}
    </motion.div>
  );
}

export default function SdgSharedLayoutWheel({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const cardSlotRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Dynamic screen offsets from wheel slots to card landing docks
  const [deltas, setDeltas] = useState<Record<number, { x: number; y: number; scale: number }>>({});
  const isWheelInView = useInView(wheelRef, { amount: 0.1 });
  const areCardsInView = useInView(cardsRef, { amount: 0.1 });
  const { scrollYProgress: smoothProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const [isScrolled, setIsScrolled] = useState(false);
  const shouldMeasureDeltasRef = useRef(true);

  // 2. Measure pinpoint screen translation vectors from wheel slots to card slots
  const measureDeltas = useCallback(() => {
    if (!wheelRef.current) return;
    const wheelRect = wheelRef.current.getBoundingClientRect();

    const newDeltas: Record<number, { x: number; y: number; scale: number }> = {};

    TARGET_SLICES.forEach((slice) => {
      const cardEl = cardSlotRefs.current[slice.num];
      if (!cardEl) return;
      const cardRect = cardEl.getBoundingClientRect();

      // Wheel coordinates of the slice center before the wheel's 45° rotation.
      const sliceLeft = wheelRect.left + (slice.leftPct / 100) * wheelRect.width;
      const sliceTop = wheelRect.top + (slice.topPct / 100) * wheelRect.height;
      const sliceWidth = (slice.widthPct / 100) * wheelRect.width;
      const sliceHeight = (slice.heightPct / 100) * wheelRect.height;

      const sliceCenterX = sliceLeft + (slice.localCenterXPct / 100) * sliceWidth;
      const sliceCenterY = sliceTop + (slice.localCenterYPct / 100) * sliceHeight;

      // Convert the card center into the rotated wheel layer's local coordinates.
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;
      const targetX = cardCenterX - wheelRect.left - wheelRect.width / 2;
      const targetY = cardCenterY - wheelRect.top - wheelRect.height / 2;
      const radians = (-wheelRotationDegrees * Math.PI) / 180;
      const targetLocalX = targetX * Math.cos(radians) - targetY * Math.sin(radians);
      const targetLocalY = targetX * Math.sin(radians) + targetY * Math.cos(radians);
      const sourceLocalX = sliceCenterX - wheelRect.left - wheelRect.width / 2;
      const sourceLocalY = sliceCenterY - wheelRect.top - wheelRect.height / 2;

      // Target scale factor: fit the slice comfortably into the card slot
      const maxSliceDim = Math.max(sliceWidth, sliceHeight);
      const targetDim = cardRect.width * 0.95;
      const scale = Math.min(1.4, Math.max(0.6, targetDim / maxSliceDim));

      newDeltas[slice.num] = {
        x: targetLocalX - sourceLocalX,
        y: targetLocalY - sourceLocalY,
        scale,
      };
    });

    setDeltas(newDeltas);
  }, []);

  // The wheel and its card docks share a sticky stage, so scrolling does not
  // change their relative positions; remeasure only when the layout resizes.
  useEffect(() => {
    measureDeltas();
    const resizeObserver = new ResizeObserver(measureDeltas);
    if (wheelRef.current) resizeObserver.observe(wheelRef.current);
    if (cardsRef.current) resizeObserver.observe(cardsRef.current);
    Object.values(cardSlotRefs.current).forEach((slot) => {
      if (slot) resizeObserver.observe(slot);
    });
    return () => {
      resizeObserver.disconnect();
    };
  }, [measureDeltas]);

  useMotionValueEvent(smoothProgress, 'change', (progress) => {
    if (progress >= dockMeasurementTrigger && shouldMeasureDeltasRef.current) {
      shouldMeasureDeltasRef.current = false;
      measureDeltas();
    } else if (progress <= dockMeasurementReset) {
      shouldMeasureDeltasRef.current = true;
    }

    setIsScrolled((current) => {
      if (progress >= typingRangeByGoal[4][0]) return true;
      if (progress <= typingRangeByGoal[4][0] - 0.05) return false;
      return current;
    });
  });

  const toggleGoalsDocking = useCallback(() => {
    const section = containerRef.current;
    if (!section) return;

    const shouldReturnToWheel = smoothProgress.get() >= typingRangeByGoal[4][0];
    const targetProgress = shouldReturnToWheel ? 0 : typingRangeByGoal[17][1];
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    const scrollDistance = section.offsetHeight - window.innerHeight;
    const targetScrollY = sectionTop + targetProgress * Math.max(0, scrollDistance);
    const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;

    window.scrollTo({
      top: Math.min(targetScrollY, maxScrollY),
      behavior: 'smooth',
    });
  }, []);

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
              style={{
                // Paint containment would clip target slices as they travel to the cards.
                contain: 'layout size',
                transform: 'translate3d(0, 0, 0)',
                backfaceVisibility: 'hidden',
                touchAction: 'pan-y',
              }}
            >
              {(isWheelInView || areCardsInView) && (
                <AnimatedWheelLayers
                  scrollProgress={smoothProgress}
                  deltas={deltas}
                />
              )}
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex aspect-square w-[38%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-white p-[2%] shadow-md ring-1 ring-slate-200/80">
                <Image
                  src="/sdg-logo-for-wheel.webp"
                  alt="Sustainable Development Goals"
                  width={1311}
                  height={776}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
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
          <div
            ref={cardsRef}
            className="relative z-0 grid w-full max-w-xl flex-1 grid-cols-2 items-stretch gap-1.5 sm:gap-4"
          >
            {TARGET_SDGS.map((target) => (
              <button
                key={target.num}
                type="button"
                onClick={toggleGoalsDocking}
                aria-label={
                  isScrolled
                    ? `Animate SDG ${target.num} back into the wheel`
                    : `Animate SDG ${target.num} out of the wheel and into its card`
                }
                className={`group relative flex h-full min-w-0 cursor-pointer flex-row items-start gap-1.5 rounded-xl border bg-white/95 p-1.5 text-left shadow-xs backdrop-blur-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 sm:gap-3 sm:rounded-2xl sm:p-4 ${
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
                    <ScrollTypewriter
                      text={target.description}
                      progress={smoothProgress}
                      range={typingRangeByGoal[target.num]}
                    />
                  </p>
                </div>
              </button>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
