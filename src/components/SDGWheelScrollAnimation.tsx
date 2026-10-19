'use client';

/**
 * SDGWheelScrollAnimation
 *
 * Performance approach
 * ─────────────────────
 * • Single static SVG replaces the multi-image sequence that caused frame drops.
 * • Rotation is driven by GSAP ScrollTrigger via a direct DOM ref, so zero React
 *   state/re-renders fire during scroll.
 * • `will-change: transform` + `transform: rotate()` keeps the animation on the
 *   GPU compositor thread (no layout/paint steps).
 * • The wheel <img> uses `fetchpriority="high"` (LCP-equivalent for non-next/image
 *   SVGs) so the browser prioritises it in the resource waterfall.
 * • SVGs are served as-is from /public – next/image cannot optimise vector assets,
 *   so a plain <img> with explicit dimensions is correct and avoids an unnecessary
 *   optimisation pass.
 */

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Register GSAP plugins once (safe to call multiple times)
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

// ─── SDG campaign data ────────────────────────────────────────────────────────

const TARGET_SDGS = [
  {
    num: 4,
    title: 'Goal 4: Quality Education',
    color: '#C5192D',
    description:
      'Empowers non-IT humanities classrooms (Sharia, Arabic, Urdu, Usuluddin) with source-grounded Audio Overviews and study guides.',
  },
  {
    num: 8,
    title: 'Goal 8: Decent Work & Economic Growth',
    color: '#A21942',
    description:
      'Directly combats educator burnout by reducing repetitive manual lecture preparation and administrative formatting by 3–5 hours weekly.',
  },
  {
    num: 10,
    title: 'Goal 10: Reduced Inequalities',
    color: '#DD1367',
    description:
      'Democratizes AI tools beyond computer science labs, ensuring religious, legal, and linguistic scholars have equal modern capabilities.',
  },
  {
    num: 17,
    title: 'Goal 17: Partnerships for the Goals',
    color: '#19486A',
    description:
      'Builds institutional bridges connecting FMS ambassadors, participating faculties, and national youth campaign platforms.',
  },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SDGWheelScrollAnimationProps {
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SDGWheelScrollAnimation({
  className = '',
}: SDGWheelScrollAnimationProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  /** Direct ref to the wheel image — GSAP mutates its transform, never React state */
  const wheelImgRef = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      const container = componentRef.current;
      const wheelImg = wheelImgRef.current;
      if (!container || !wheelImg) return;

      /**
       * Scroll-driven rotation
       * ──────────────────────
       * scrub: true  → animation progress is tied 1-to-1 with scroll position;
       *               no JS timer fires between frames — GSAP hands the value
       *               straight to the compositor via transform, so it stays on
       *               the GPU thread with no layout/paint cost.
       *
       * We animate `rotate` (GSAP shorthand for CSS transform rotate) from 0° to
       * 360° as the section scrolls from top to bottom of the viewport.  The
       * `will-change: transform` set inline below promotes the element to its own
       * compositor layer before the first paint.
       */
      gsap.fromTo(
        wheelImg,
        { rotate: 0 },
        {
          rotate: 360,
          ease: 'none', // linear so rotation tracks scroll perfectly
          scrollTrigger: {
            trigger: container,
            start: 'top bottom',   // begin when section top enters viewport bottom
            end: 'bottom top',     // end when section bottom leaves viewport top
            scrub: 1,              // smooth scrub (1s lag gives inertia feel)
            invalidateOnRefresh: true,
          },
        }
      );

      // Stagger-reveal the SDG cards as the section scrolls into view
      gsap.fromTo(
        '.sdg-card',
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    },
    { scope: componentRef }
  );

  return (
    <div
      ref={componentRef}
      className={`relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden py-8 px-3 sm:min-h-screen sm:py-12 sm:px-6 lg:px-8 ${className}`}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 mb-6 max-w-2xl px-1 text-center sm:mb-10 sm:px-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 sm:px-3 sm:py-1 sm:text-[11px]">
          Interactive SDG Alignment
        </span>
        <h2 className="mt-2 text-xl font-extrabold leading-tight tracking-tight text-slate-900 sm:mt-3 sm:text-3xl lg:text-4xl">
          United Nations Sustainable Development Goals
        </h2>
        <p className="mt-1.5 text-[11px] leading-snug text-slate-600 sm:text-sm sm:leading-relaxed">
          Scroll to explore how The AI Bridge addresses regional educational challenges under
          the Hum Hain Pakistan campaign.
        </p>
      </div>

      {/* ── Stage: wheel + cards ────────────────────────────────────────────── */}
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-8 sm:gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-12">

        {/* SDG Wheel — single GPU-animated image */}
        <div className="flex-shrink-0">
          {/*
           * Plain <img> is intentional for SVG:
           *   - next/image skips SVG optimisation anyway
           *   - fetchpriority="high" signals LCP priority to the browser
           *   - will-change + transform are applied inline so GSAP can
           *     animate without triggering layout recalculations
           */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={wheelImgRef}
            src="/sdg-logo-wheel.svg"
            alt="United Nations Sustainable Development Goals wheel"
            width={340}
            height={340}
            // fetchpriority is a valid HTML attribute; TypeScript's JSX types
            // lag behind the spec, so we cast to suppress the false-positive.
            {...({ fetchpriority: 'high' } as React.ImgHTMLAttributes<HTMLImageElement>)}
            className={[
              'h-[clamp(200px,40vw,340px)] w-[clamp(200px,40vw,340px)]',
              'select-none drop-shadow-xl',
            ].join(' ')}
            style={{
              // Promote to compositor layer before first frame so GSAP's
              // transform changes never trigger paint or layout.
              willChange: 'transform',
              // Ensure rotation pivots from the wheel's visual centre.
              transformOrigin: 'center center',
            }}
          />
        </div>

        {/* ── SDG Cards grid ────────────────────────────────────────────────── */}
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:max-w-lg lg:gap-5">
          {TARGET_SDGS.map((sdg) => (
            <div
              key={sdg.num}
              className="sdg-card group flex flex-col rounded-2xl border border-slate-200/90 bg-white/85 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-slate-300 hover:shadow-md sm:p-5"
            >
              {/* Colour-coded goal badge */}
              <span
                className="mb-2 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm sm:text-[11px]"
                style={{ backgroundColor: sdg.color }}
              >
                SDG {sdg.num}
              </span>

              <h3 className="mb-1 text-[11px] font-bold leading-snug text-slate-900 sm:text-sm">
                {sdg.title}
              </h3>
              <p className="text-[9.5px] leading-relaxed text-slate-600 sm:text-xs">
                {sdg.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
