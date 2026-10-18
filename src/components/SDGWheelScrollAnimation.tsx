'use client';

import React, { useId, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

// Highlighted campaign target SDGs with authentic metadata, colors, and geometric alignments
const TARGET_SDGS = [
  {
    num: 4,
    title: 'Goal 4: Quality Education',
    color: '#C5192D',
    centerPos: { x: 143.312, y: -40.775 },
    targetRotation: -74.12,
    description: 'Empowers non-IT humanities classrooms (Sharia, Arabic, Urdu, Usuluddin) with source-grounded Audio Overviews and study guides.'
  },
  {
    num: 8,
    title: 'Goal 8: Decent Work & Economic Growth',
    color: '#A21942',
    centerPos: { x: 53.824, y: 138.939 },
    targetRotation: 21.18,
    description: 'Directly combats educator burnout by reducing repetitive manual lecture preparation and administrative formatting by 3–5 hours weekly.'
  },
  {
    num: 10,
    title: 'Goal 10: Reduced Inequalities',
    color: '#DD1367',
    centerPos: { x: -53.824, y: 138.939 },
    targetRotation: -21.18,
    description: 'Democratizes AI tools beyond computer science labs, ensuring religious, legal, and linguistic scholars have equal modern capabilities.'
  },
  {
    num: 17,
    title: 'Goal 17: Partnerships for the Goals',
    color: '#19486A',
    centerPos: { x: -27.378, y: -146.463 },
    targetRotation: 10.59,
    description: 'Builds institutional bridges connecting FMS ambassadors, participating faculties, and national youth campaign platforms.'
  }
];

const TARGET_SDG_NUMBERS = new Set(TARGET_SDGS.map(({ num }) => num));
const REMAINING_SDGS = Array.from({ length: 17 }, (_, index) => index + 1).filter(
  (num) => !TARGET_SDG_NUMBERS.has(num)
);
const ORIGINAL_SECTOR_WIDTH = 360 / 17;
const REFLOWED_SECTOR_WIDTH = 360 / REMAINING_SDGS.length;
const REFLOWED_SECTOR_SCALE = REFLOWED_SECTOR_WIDTH / ORIGINAL_SECTOR_WIDTH;

function getSectorPath(centerAngle: number, width: number, radius = 220, innerRadius = 102) {
  const startAngle = ((centerAngle - width / 2) * Math.PI) / 180;
  const endAngle = ((centerAngle + width / 2) * Math.PI) / 180;
  const startX = Math.cos(startAngle) * radius;
  const startY = Math.sin(startAngle) * radius;
  const endX = Math.cos(endAngle) * radius;
  const endY = Math.sin(endAngle) * radius;
  const innerStartX = Math.cos(startAngle) * innerRadius;
  const innerStartY = Math.sin(startAngle) * innerRadius;
  const innerEndX = Math.cos(endAngle) * innerRadius;
  const innerEndY = Math.sin(endAngle) * innerRadius;

  return `M ${innerStartX} ${innerStartY} L ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY} L ${innerEndX} ${innerEndY} A ${innerRadius} ${innerRadius} 0 0 0 ${innerStartX} ${innerStartY} Z`;
}

function getAnchorTranslation(
  svg: SVGSVGElement,
  target: (typeof TARGET_SDGS)[number],
  anchor: HTMLElement
) {
  const screenMatrix = svg.getScreenCTM();
  if (!screenMatrix) return { x: 0, y: 0 };

  const screenToSvg = screenMatrix.inverse();
  const sourcePoint = new DOMPoint(target.centerPos.x, target.centerPos.y);
  const anchorRect = anchor.getBoundingClientRect();
  const anchorPoint = new DOMPoint(
    anchorRect.left + anchorRect.width / 2,
    anchorRect.top + anchorRect.height / 2
  ).matrixTransform(screenToSvg);

  return {
    x: anchorPoint.x - sourcePoint.x,
    y: anchorPoint.y - sourcePoint.y
  };
}

interface SDGWheelScrollAnimationProps {
  className?: string;
}

export default function SDGWheelScrollAnimation({ className = '' }: SDGWheelScrollAnimationProps) {
  const wheelMaskId = useId().replace(/:/g, '');
  const componentRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const baseWheelRef = useRef<HTMLDivElement>(null);
  const reflowWheelRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const groupRefs = useRef<Record<number, SVGGElement | null>>({});

  useGSAP(
    () => {
      const container = componentRef.current;
      const svg = svgRef.current;
      const baseWheel = baseWheelRef.current;
      const reflowWheel = reflowWheelRef.current;
      if (!container || !svg || !baseWheel || !reflowWheel) return;

      // Keep scroll progress and visual progress in sync to avoid scrub lag.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: '+=420',
          scrub: true,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      // Crossfade to a complete wheel assembled from the original SDG artwork.
      tl.to(
        baseWheel,
        {
          opacity: 0,
          duration: 0.5,
          ease: 'none'
        },
        0
      );
      tl.to(
        reflowWheel,
        {
          opacity: 1,
          duration: 0.5,
          ease: 'none'
        },
        0
      );

      // 2. Seamlessly detach and glide the 4 target segments (with authentic UN logos) into their cards
      TARGET_SDGS.forEach((target) => {
        const groupEl = groupRefs.current[target.num];
        const cellEl = cellRefs.current[target.num];
        if (!groupEl || !cellEl) return;

        tl.to(
          groupEl,
          {
            x: () => (cellEl && svg ? getAnchorTranslation(svg, target, cellEl).x : 0),
            y: () => (cellEl && svg ? getAnchorTranslation(svg, target, cellEl).y : 0),
            rotation: target.targetRotation,
            svgOrigin: `${target.centerPos.x} ${target.centerPos.y}`,
            scale: 1.42,
            duration: 1,
            ease: 'none'
          },
          0
        );
      });

      // 3. Smoothly fade in descriptive cards right as the segments dock
      tl.to(
        '.sdg-cell-desc',
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.04,
          ease: 'none'
        },
        0.6
      );
    },
    { scope: componentRef }
  );

  return (
    <div
      ref={componentRef}
      className={`relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden py-2 px-3 sm:min-h-screen sm:py-8 sm:px-6 lg:px-8 ${className}`}
    >
      {/* Header */}
      <div className="relative z-10 mb-2 max-w-2xl px-1 text-center sm:mb-6 sm:px-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 sm:px-3 sm:py-1 sm:text-[11px]">
          Interactive SDG Alignment
        </span>
        <h2 className="mt-1 text-xl font-extrabold leading-tight tracking-tight text-slate-900 sm:mt-2 sm:text-3xl lg:text-4xl">
          United Nations Sustainable Development Goals
        </h2>
        <p className="mt-1 text-[11px] leading-snug text-slate-600 sm:text-sm sm:leading-relaxed">
          Scroll to explore how The AI Bridge addresses regional educational challenges under the Hum Hain Pakistan campaign.
        </p>
      </div>

      {/* Interactive Stage */}
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center justify-center">
        {/* Wheel Container with Authenticated Background-Removed SDG Wheel */}
        <div className="relative z-20 flex h-[clamp(150px,22svh,190px)] w-[clamp(150px,22svh,190px)] items-center justify-center sm:h-[280px] sm:w-[280px] md:h-[340px] md:w-[340px]">
          {/* Mask the animated target wedges out of the static wheel to prevent doubled logos and borders. */}
          <div
            ref={baseWheelRef}
            className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
          >
            <svg
              viewBox="0 0 2048 2048"
              className="h-full w-full"
              role="img"
              aria-label="Sustainable Development Goals UN Wheel"
            >
              <defs>
                <mask
                  id={wheelMaskId}
                  x="0"
                  y="0"
                  width="2048"
                  height="2048"
                  maskUnits="userSpaceOnUse"
                  style={{ maskType: 'luminance' }}
                >
                  <rect width="2048" height="2048" fill="white" />
                  {TARGET_SDGS.map((target) => (
                    <image
                      key={target.num}
                      href={`/sdg-segment-${target.num}.webp`}
                      width="2048"
                      height="2048"
                      filter="brightness(0)"
                    />
                  ))}
                </mask>
              </defs>
              <image
                href="/sdg-wheel-transparent.webp"
                width="2048"
                height="2048"
                mask={`url(#${wheelMaskId})`}
              />
            </svg>
          </div>

          {/* Interactive animated segments overlaying the wheel with authentic logos */}
          <div
            ref={reflowWheelRef}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 select-none"
            aria-hidden="true"
          >
            <svg viewBox="-200 -200 400 400" className="h-full w-full">
              <defs>
                {REMAINING_SDGS.map((num, index) => {
                  const sourceCenter = -90 + (num - 0.5) * ORIGINAL_SECTOR_WIDTH;
                  const targetCenter = -90 + (index + 0.5) * REFLOWED_SECTOR_WIDTH;
                  const targetClipWidth = REFLOWED_SECTOR_WIDTH + 0.3;

                  return (
                    <React.Fragment key={num}>
                      <clipPath id={`${wheelMaskId}-source-${num}`} clipPathUnits="userSpaceOnUse">
                        <path d={getSectorPath(sourceCenter, ORIGINAL_SECTOR_WIDTH)} />
                      </clipPath>
                      <clipPath id={`${wheelMaskId}-target-${num}`} clipPathUnits="userSpaceOnUse">
                        <path d={getSectorPath(targetCenter, targetClipWidth)} />
                      </clipPath>
                    </React.Fragment>
                  );
                })}
              </defs>
              {REMAINING_SDGS.map((num, index) => {
                const sourceCenter = -90 + (num - 0.5) * ORIGINAL_SECTOR_WIDTH;
                const targetCenter = -90 + (index + 0.5) * REFLOWED_SECTOR_WIDTH;

                return (
                  <g key={num} clipPath={`url(#${wheelMaskId}-target-${num})`}>
                    <g
                      transform={`rotate(${targetCenter})`}
                    >
                      <g transform={`scale(1 ${REFLOWED_SECTOR_SCALE})`}>
                        <g transform={`rotate(${-sourceCenter})`}>
                          <image
                            href="/sdg-wheel-transparent.webp"
                            x="-207.42"
                            y="-207.42"
                            width="414.84"
                            height="414.84"
                            clipPath={`url(#${wheelMaskId}-source-${num})`}
                          />
                        </g>
                      </g>
                    </g>
                  </g>
                );
              })}
              <image
                href="/sdg-wheel-center-emblem.webp"
                x="-207.42"
                y="-207.42"
                width="414.84"
                height="414.84"
              />
            </svg>
          </div>

          <svg
            ref={svgRef}
            viewBox="-200 -200 400 400"
            className="h-full w-full overflow-visible drop-shadow-md select-none relative z-20 pointer-events-none"
            aria-label="Sustainable Development Goals Interactive Wheel"
            suppressHydrationWarning
          >
            {TARGET_SDGS.map((target) => (
              <g
                key={target.num}
                ref={(el) => {
                  groupRefs.current[target.num] = el;
                }}
                className="cursor-pointer pointer-events-auto"
                style={{ willChange: 'transform, opacity' }}
              >
                {/* Authentic extracted segment from sdg-logo-wheel containing its official logo icon and number */}
                <image
                  href={`/sdg-segment-${target.num}.webp`}
                  x="-207.42"
                  y="-207.42"
                  width="414.84"
                  height="414.84"
                  preserveAspectRatio="xMidYMid meet"
                  className="transition-opacity hover:opacity-95"
                  suppressHydrationWarning
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Target Landing Grid: 2x2 on mobile (grid-cols-2), single row of 4 on desktop (lg:grid-cols-4) */}
        <div className="relative z-10 mt-2 grid w-full grid-cols-2 gap-2 sm:mt-8 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {TARGET_SDGS.map((target) => (
            <div
              key={target.num}
              className="group flex flex-col items-center rounded-xl border border-slate-200/90 bg-white/80 p-1.5 text-center shadow-xs backdrop-blur-xs transition-all hover:border-slate-300 hover:shadow-md min-[375px]:px-2 min-[375px]:py-1.5 sm:rounded-2xl sm:p-5"
            >
              {/* Target landing anchor for the SVG segment */}
              <div
                ref={(el) => {
                  cellRefs.current[target.num] = el;
                }}
                className="relative mb-1 flex h-12 w-12 items-center justify-center min-[375px]:h-[52px] min-[375px]:w-[52px] sm:mb-3 sm:h-24 sm:w-24"
                aria-hidden="true"
              >
                {/* Visual docking guide slot */}
                <div className="absolute inset-1 rounded-2xl border border-dashed border-slate-300/70 bg-slate-50/50 -z-10 group-hover:border-slate-400/80 transition-colors" />
              </div>

              {/* Explanatory text revealed as segment settles */}
              <div className="sdg-cell-desc translate-y-2 space-y-1 opacity-0 sm:translate-y-3 sm:space-y-2">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs sm:px-2.5 sm:text-[11px]"
                  style={{ backgroundColor: target.color }}
                >
                  SDG {target.num}
                </span>
                <h3 className="text-[10px] font-bold leading-tight text-slate-900 min-[375px]:text-[11px] sm:text-sm sm:leading-snug">
                  {target.title}
                </h3>
                <p className="text-[9px] leading-[1.15] text-slate-600 min-[375px]:text-[9px] sm:text-xs sm:leading-relaxed">
                  {target.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
