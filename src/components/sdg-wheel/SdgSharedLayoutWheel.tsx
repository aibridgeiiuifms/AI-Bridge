'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  motion,
  useMotionValue,
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
        loading="lazy"
        decoding="async"
        style={slice.num === 1 || slice.num === 17 ? { transform: 'scale(1.02)' } : undefined}
      />
    </motion.div>
  );
});

interface TargetSliceProps {
  slice: SdgSliceConfig;
  deltas: React.MutableRefObject<Record<number, { x: number; y: number; scale: number }>>;
  progress: MotionValue<number>;
}

const TargetSdgSlice = React.memo(function TargetSdgSlice({
  slice,
  deltas,
  progress,
}: TargetSliceProps) {
  const range = typingRangeByGoal[slice.num];
  const rangeProgress = useTransform(progress, (value) =>
    Math.max(0, Math.min(1, (value - range[0]) / (range[1] - range[0]))),
  );
  const x = useTransform(rangeProgress, (value) => value * (deltas.current[slice.num]?.x ?? 0));
  const y = useTransform(rangeProgress, (value) => value * (deltas.current[slice.num]?.y ?? 0));
  const rotate = useTransform(progress, range, [0, slice.targetRotation - wheelRotationDegrees], {
    clamp: true,
  });
  const scale = useTransform(
    rangeProgress,
    (value) => 1 + value * ((deltas.current[slice.num]?.scale ?? 1) - 1),
  );

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
        loading="lazy"
        decoding="async"
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
  const clipPath = useTransform(rawCharIndex, (index) => {
    const visibleCharacters = Math.floor(index);
    const hiddenPercent = 100 - (visibleCharacters / text.length) * 100;
    return `inset(0 ${hiddenPercent}% 0 0)`;
  });
  return (
    <span aria-label={text}>
      <span className="grid">
        <span aria-hidden="true" className="invisible col-start-1 row-start-1">
          {text}
        </span>
        <motion.span
          aria-hidden="true"
          className="col-start-1 row-start-1"
          style={{ clipPath }}
        >
          {text}
        </motion.span>
      </span>
    </span>
  );
}

interface AnimatedWheelLayersProps {
  scrollProgress: MotionValue<number>;
  deltas: React.MutableRefObject<Record<number, { x: number; y: number; scale: number }>>;
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
          deltas={deltas}
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
  const deltas = useRef<Record<number, { x: number; y: number; scale: number }>>({});
  const { scrollYProgress: smoothProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const dockingProgress = useMotionValue(0);
  useMotionValueEvent(smoothProgress, 'change', (progress) => {
    if (progress >= typingRangeByGoal[4][0]) {
      dockingProgress.set(1);
    } else if (progress <= typingRangeByGoal[4][0] - 0.05) {
      dockingProgress.set(0);
    }
  });
  const alignedOpacity = useTransform(dockingProgress, [0, 1], [1, 0]);
  const decoupledOpacity = useTransform(dockingProgress, [0, 1], [0, 1]);
  const statusColor = useTransform(dockingProgress, [0, 1], ['#0F4C3A', '#C88A2B']);
  const cardBorderColor = useTransform(dockingProgress, [0, 1], ['#E2DFD7', '#CBD5E1']);
  const cardShadow = useTransform(
    dockingProgress,
    [0, 1],
    ['0 1px 2px rgb(0 0 0 / 0.05)', '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'],
  );
  const guideBorderColor = useTransform(dockingProgress, [0, 1], ['#CBD5E1', 'rgba(203, 213, 225, 0)']);
  const watermarkOpacity = useTransform(dockingProgress, [0, 1], [0.4, 0]);

  const measureDeltas = useCallback(() => {
    if (!wheelRef.current) return;
    const wheelRect = wheelRef.current.getBoundingClientRect();

    TARGET_SLICES.forEach((slice) => {
      const cardEl = cardSlotRefs.current[slice.num];
      if (!cardEl) return;
      const cardRect = cardEl.getBoundingClientRect();

      const sliceLeft = wheelRect.left + (slice.leftPct / 100) * wheelRect.width;
      const sliceTop = wheelRect.top + (slice.topPct / 100) * wheelRect.height;
      const sliceWidth = (slice.widthPct / 100) * wheelRect.width;
      const sliceHeight = (slice.heightPct / 100) * wheelRect.height;

      const sliceCenterX = sliceLeft + (slice.localCenterXPct / 100) * sliceWidth;
      const sliceCenterY = sliceTop + (slice.localCenterYPct / 100) * sliceHeight;

      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;
      const targetX = cardCenterX - wheelRect.left - wheelRect.width / 2;
      const targetY = cardCenterY - wheelRect.top - wheelRect.height / 2;
      const radians = (-wheelRotationDegrees * Math.PI) / 180;
      const targetLocalX = targetX * Math.cos(radians) - targetY * Math.sin(radians);
      const targetLocalY = targetX * Math.sin(radians) + targetY * Math.cos(radians);
      const sourceLocalX = sliceCenterX - wheelRect.left - wheelRect.width / 2;
      const sourceLocalY = sliceCenterY - wheelRect.top - wheelRect.height / 2;

      const maxSliceDim = Math.max(sliceWidth, sliceHeight);
      const targetDim = cardRect.width * 0.95;
      const scale = Math.min(1.4, Math.max(0.6, targetDim / maxSliceDim));

      deltas.current[slice.num] = {
        x: targetLocalX - sourceLocalX,
        y: targetLocalY - sourceLocalY,
        scale,
      };
    });
  }, []);

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
  }, [smoothProgress]);

  return (
    <div
      id="sdg-alignment"
      ref={containerRef}
      className={`relative min-h-[175vh] w-full select-none ${className}`}
      aria-label="Interactive UN SDG Wheel Separation"
    >
      <div className="sticky top-0 flex min-h-screen w-full flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 max-w-2xl text-center sm:mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C3DCD2] bg-[#E6F0EC] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0F4C3A]">
            Interactive SDG Alignment
          </span>
          <h2 className="mt-2.5 text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl lg:text-4xl">
            United Nations Sustainable Development Goals
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#334155]">
            Scroll down (or tap any goal card) to separate target goals (SDG 4, 8, 10 &amp; 17) from the wheel and dock them into our initiatives.
          </p>
        </div>

        {/* Main Stage */}
        <div className="flex w-full max-w-6xl flex-col items-center justify-center gap-6 lg:flex-row lg:items-center lg:gap-12">
          {/* 1. The SDG Wheel */}
          <div className="relative z-30 flex flex-col items-center justify-center flex-shrink-0">
            <div
              ref={wheelRef}
              className="relative aspect-square w-[220px] transform-gpu will-change-transform sm:w-[320px] md:w-[360px] lg:w-[410px]"
              style={{
                contain: 'layout size',
                transform: 'translate3d(0, 0, 0)',
                backfaceVisibility: 'hidden',
                touchAction: 'pan-y',
              }}
            >
              <AnimatedWheelLayers
                scrollProgress={smoothProgress}
                deltas={deltas}
              />
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex aspect-square w-[38%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#E2DFD7] bg-white p-[2%] shadow-md">
                <Image
                  src="/sdg-logo-for-wheel.webp"
                  alt="Sustainable Development Goals"
                  width={160}
                  height={95}
                  sizes="160px"
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {/* Status indicator pill */}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[#64748B]">
              <motion.span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: statusColor }}
              />
              <span className="inline-grid">
                <motion.span className="col-start-1 row-start-1" style={{ opacity: alignedOpacity }}>
                  Full wheel aligned (scroll down to separate goals)
                </motion.span>
                <motion.span className="col-start-1 row-start-1" style={{ opacity: decoupledOpacity }}>
                  Goals 4, 8, 10, 17 decoupled (scroll up to re-dock)
                </motion.span>
              </span>
            </div>
          </div>

          {/* 2. The 4 Target Details Cards */}
          <div
            ref={cardsRef}
            className="relative z-0 grid w-full max-w-xl flex-1 grid-cols-2 items-stretch gap-2 sm:gap-4"
          >
            {TARGET_SDGS.map((target) => (
              <motion.button
                key={target.num}
                type="button"
                onClick={toggleGoalsDocking}
                aria-label={`Toggle SDG ${target.num} between the wheel and its card`}
                className="group relative flex h-full min-w-0 cursor-pointer flex-row items-start gap-2 rounded-xl border bg-[#F8F7F4] p-2 text-left shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C3A] focus-visible:ring-offset-2 sm:gap-3 sm:rounded-2xl sm:p-4"
                style={{ borderColor: cardBorderColor, boxShadow: cardShadow, borderTop: `4px solid ${target.color}` }}
              >
                <div
                  ref={(el) => {
                    cardSlotRefs.current[target.num] = el;
                  }}
                  className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md min-[360px]:h-7 min-[360px]:w-7 sm:h-16 sm:w-16 sm:rounded-xl"
                  style={{ backgroundColor: `${target.color}15` }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-md sm:rounded-xl border border-dashed transition-colors"
                    style={{ borderColor: guideBorderColor }}
                  />
                  <motion.span
                    className="text-[10px] sm:text-xs font-black transition-opacity"
                    style={{ color: target.color, opacity: watermarkOpacity }}
                  >
                    SDG {target.num}
                  </motion.span>
                </div>

                <div className="w-full min-w-0 flex-1">
                  <div className="mb-0.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 sm:gap-1.5">
                    <span
                      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[8px] font-extrabold text-white sm:px-2 sm:text-[9px]"
                      style={{ backgroundColor: target.color }}
                    >
                      SDG {target.num}
                    </span>
                    <span className="inline-grid text-[8px] font-semibold text-[#64748B] sm:text-[10px]">
                      <motion.span className="col-start-1 row-start-1" style={{ opacity: alignedOpacity }}>
                        In Wheel
                      </motion.span>
                      <motion.span className="col-start-1 row-start-1" style={{ opacity: decoupledOpacity }}>
                        Decoupled
                      </motion.span>
                    </span>
                  </div>

                  <h3 className="break-words text-[9.5px] font-bold leading-tight text-[#0F172A] sm:text-sm sm:leading-snug">
                    {target.title}
                  </h3>

                  <p className="mt-0.5 break-words text-[9px] leading-[1.3] text-[#334155] sm:mt-1 sm:text-[11px] sm:leading-relaxed">
                    <ScrollTypewriter
                      text={target.description}
                      progress={smoothProgress}
                      range={typingRangeByGoal[target.num]}
                    />
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
