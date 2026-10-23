'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  GraduationCap,
  ArrowRight,
} from 'lucide-react';

const slides = [
  {
    src: '/highlights/p5.webp',
    alt: 'IIUI Faculty of Management Sciences AI Bridge Workshop Session',
    caption: 'Faculty & Ambassador Training Session at FMS IIUI',
  },
  {
    src: '/highlights/p1.webp',
    alt: 'AI Bridge Campaign Highlight 1',
    caption: 'Hum Hain Pakistan SDG Youth Campaign Launch',
  },
  {
    src: '/highlights/p2.webp',
    alt: 'AI Bridge Campaign Highlight 2',
    caption: 'Interactive Source-Grounded AI Walkthrough',
  },
  {
    src: '/highlights/p3.webp',
    alt: 'AI Bridge Campaign Highlight 3',
    caption: 'Academic Leadership & SDG Ambassadors Briefing',
  },
  {
    src: '/highlights/p4.webp',
    alt: 'AI Bridge Campaign Highlight 4',
    caption: 'Hands-on NotebookLM Curriculum Synthesis',
  },
  {
    src: '/highlights/p6.webp',
    alt: 'AI Bridge Campaign Highlight 6',
    caption: 'Cross-Departmental Scholar Engagement',
  },
  {
    src: '/highlights/p7.webp',
    alt: 'AI Bridge Campaign Highlight 7',
    caption: 'Student Evaluation & Verification Orientation',
  },
  {
    src: '/highlights/p8.webp',
    alt: 'AI Bridge Campaign Highlight 8',
    caption: 'FMS SDG Functional Teams in Action',
  },
  {
    src: '/highlights/p9.webp',
    alt: 'AI Bridge Campaign Highlight 9',
    caption: 'Bridging the Digital Divide in Non-IT Disciplines',
  },
  {
    src: '/highlights/p10.webp',
    alt: 'AI Bridge Campaign Highlight 10',
    caption: 'Collaborative Research & Audio Overviews Demo',
  },
  {
    src: '/highlights/p11.webp',
    alt: 'AI Bridge Campaign Highlight 11',
    caption: 'IIUI Islamabad Campus Awareness Drive',
  },
];

export default function HighlightsCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Mark hydrated after initial paint so only slide 0 is fetched during initial paint
  useEffect(() => {
    const timer = setTimeout(() => setHasHydrated(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setHasHydrated(true);
    setActiveSlide((index + slides.length) % slides.length);
  }, []);

  const handleNext = useCallback(() => goToSlide(activeSlide + 1), [activeSlide, goToSlide]);
  const handlePrev = useCallback(() => goToSlide(activeSlide - 1), [activeSlide, goToSlide]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHasHydrated(true);
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    setTouchStartX(null);
  };

  return (
    <section
      id="hero"
      aria-label="The AI Bridge Hero"
      className="relative w-full min-h-[100svh] flex flex-col justify-between overflow-hidden bg-[#07231A] text-white select-none pt-20 sm:pt-24"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Full-Viewport Background Image Slider (GPU-Optimized Crossfade) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {slides.map((slide, index) => {
          const isCurrent = index === activeSlide;
          const isNext = index === (activeSlide + 1) % slides.length;
          const shouldRender = index === 0 || (hasHydrated && (isCurrent || isNext));

          if (!shouldRender) return null;

          return (
            <div
              key={slide.src}
              aria-hidden={!isCurrent}
              className={`absolute inset-0 transition-opacity duration-700 ease-out will-change-[opacity] ${
                isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={index === 0}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  sizes="100vw"
                  quality={75}
                  className="object-cover object-center"
                />
              </div>
            </div>
          );
        })}

        {/* Restrained Solid Dark Overlay for Reliable Text Contrast */}
        <div className="absolute inset-0 z-20 bg-[#0A1F17]/75 pointer-events-none" />
      </div>

      {/* Main Hero Content Container */}
      <div className="relative z-30 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 my-auto">
        <div className="max-w-3xl space-y-6">
          {/* Sleek Redesigned Campaign Pill */}
          <div className="inline-flex items-center gap-2.5 rounded-full bg-[#0F172A]/75 border border-white/20 backdrop-blur-md px-3.5 py-1.5 shadow-sm">
            <div className="flex items-center gap-2 pr-2.5 border-r border-white/20">
              <Image
                src="/iiui-logo.webp"
                alt="IIUI Logo"
                width={20}
                height={20}
                priority
                className="h-5 w-5 rounded-full bg-white p-0.5 object-contain"
              />
              <span className="text-[11px] sm:text-xs font-bold tracking-wide text-white">
                FMS • IIUI Islamabad
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#EAD1A7]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#C88A2B] animate-pulse" />
              <span>Hum Hain Pakistan • UN SDG Youth Campaign</span>
            </div>
          </div>

          {/* Concise, Distinctive Heading */}
          <div className="space-y-4">
            <h1 className="text-balance text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Source-Grounded AI for{' '}
              <span className="text-[#EAD1A7] underline decoration-[#C88A2B] decoration-2 underline-offset-8">
                Non-IT Educators &amp; Scholars
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-slate-200 max-w-2xl leading-relaxed font-normal">
              Pioneered at the Faculty of Management Sciences (IIUI) under the mentorship of{' '}
              <strong className="font-semibold text-white">Dr. Abdul Zahid Khan</strong>. Transforming classical curricula into verified, interactive study guides and audio overviews with zero hallucinations.
            </p>
          </div>

          {/* Primary CTA (Gallery button removed per request) */}
          <div className="pt-2">
            <Link
              href="/portal"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#C88A2B] hover:bg-[#B0761E] text-[#0F172A] font-extrabold text-sm sm:text-base px-7 py-3.5 shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#07231A]"
            >
              <GraduationCap className="h-5 w-5 shrink-0" />
              <span>Enter Student &amp; Educator Portal</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar: 100% Transparent with crisp white text */}
      <div className="relative z-30 border-t border-white/15 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Metrics Strip */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 w-full md:w-auto">
            <div>
              <div className="text-sm sm:text-lg font-extrabold text-white">3-Step Verified</div>
              <div className="text-[11px] sm:text-xs text-white/80">QR Credential System</div>
            </div>
            <div className="border-l border-white/20 pl-4 sm:pl-8">
              <div className="text-sm sm:text-lg font-extrabold text-white">11 Ambassadors</div>
              <div className="text-[11px] sm:text-xs text-white/80">FMS SDG Core Team</div>
            </div>
            <div className="border-l border-white/20 pl-4 sm:pl-8">
              <div className="text-sm sm:text-lg font-extrabold text-white">100% Free</div>
              <div className="text-[11px] sm:text-xs text-white/80">Zero-Cost Scaling</div>
            </div>
          </div>

          {/* Clean Caption & Slide Indicators */}
          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-2 md:pt-0 border-t border-white/10 md:border-t-0">
            <span className="text-xs text-white font-medium truncate max-w-[200px] sm:max-w-xs">
              {slides[activeSlide].caption}
            </span>

            {/* Slide Indicator Dots */}
            <div className="flex items-center gap-1.5 px-1">
              {slides.map((_, dotIndex) => (
                <button
                  key={dotIndex}
                  type="button"
                  aria-label={`Go to slide ${dotIndex + 1}`}
                  aria-current={activeSlide === dotIndex ? 'true' : undefined}
                  onClick={() => goToSlide(dotIndex)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeSlide === dotIndex
                      ? 'w-6 bg-white shadow-xs'
                      : 'w-1.5 bg-white/40 hover:bg-white/90'
                  }`}
                />
              ))}
            </div>

            <span className="text-xs font-mono font-bold text-white shrink-0 pl-1">
              {String(activeSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
