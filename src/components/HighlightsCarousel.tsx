'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  title?: string;
  description: string;
  background: string;
  tag?: string;
  image?: string;
}

const slides: Slide[] = [
  {
    title: 'Campus Highlights & Workshops',
    description: 'A glimpse of the people, learning, and community behind AI Bridge.',
    background: 'from-emerald-950 via-emerald-800 to-teal-700',
    tag: 'Hands-on Sessions',
  },
  {
    title: 'Curriculum Transformation',
    description: 'Celebrating collaboration and new possibilities through education.',
    background: 'from-slate-950 via-slate-800 to-emerald-800',
    tag: 'Non-IT Empowerment',
  },
  {
    title: 'Youth Ambassador Network',
    description: 'Sharing the moments that move our community forward.',
    background: 'from-teal-950 via-emerald-900 to-amber-900',
    tag: 'Hum Hain Pakistan',
  },
];

interface HighlightsCarouselProps {
  className?: string;
}

export default function HighlightsCarousel({ className = '' }: HighlightsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const scrollToSlide = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clampedIndex = (index + slides.length) % slides.length;
    track.scrollTo({
      left: clampedIndex * track.clientWidth,
      behavior: 'smooth',
    });
    setActiveSlide(clampedIndex);
  }, []);

  const handlePrev = useCallback(() => {
    scrollToSlide(activeSlide - 1);
  }, [activeSlide, scrollToSlide]);

  const handleNext = useCallback(() => {
    scrollToSlide(activeSlide + 1);
  }, [activeSlide, scrollToSlide]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      scrollToSlide(activeSlide + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSlide, isPaused, scrollToSlide]);

  return (
    <div
      className={`flex flex-col w-full ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200 sm:text-xs">
          <Sparkles className="h-3 w-3 text-amber-300" />
          <span>Campaign Highlights</span>
        </span>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-200/80 sm:text-xs">
          <span className="font-bold text-white">{activeSlide + 1}</span>
          <span>/</span>
          <span>{slides.length}</span>
        </div>
      </div>

      <div className="relative group overflow-hidden rounded-2xl border border-white/15 bg-slate-900/40 shadow-2xl backdrop-blur-md">
        <div
          ref={trackRef}
          onScroll={(event) => {
            const track = event.currentTarget;
            if (track.clientWidth > 0) {
              const newIndex = Math.round(track.scrollLeft / track.clientWidth);
              if (newIndex !== activeSlide && newIndex >= 0 && newIndex < slides.length) {
                setActiveSlide(newIndex);
              }
            }
          }}
          className="flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Campaign highlights carousel"
        >
          {slides.map((slide, index) => (
            <article
              key={index}
              className={`relative aspect-[16/10] sm:aspect-[16/10] md:aspect-[4/3] lg:aspect-[16/11] w-full shrink-0 snap-center overflow-hidden bg-gradient-to-br ${slide.background} flex flex-col justify-between p-4 sm:p-6`}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
            >
              <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent pointer-events-none" />

              {/* Slide top badge */}
              <div className="relative z-10 flex items-center justify-between">
                {slide.tag && (
                  <span className="inline-block rounded-md border border-white/20 bg-black/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-200 backdrop-blur-sm sm:text-[10px]">
                    {slide.tag}
                  </span>
                )}
              </div>

              {/* Slide bottom text */}
              <div className="relative z-10 space-y-1 sm:space-y-1.5 text-left">
                {slide.title && (
                  <h3 className="text-base font-extrabold tracking-tight text-white sm:text-lg lg:text-xl">
                    {slide.title}
                  </h3>
                )}
                <p className="text-xs leading-relaxed text-slate-200/90 sm:text-sm line-clamp-2 sm:line-clamp-none">
                  {slide.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Previous & Next Arrows */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous slide"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-slate-950/60 text-white border border-white/20 backdrop-blur-sm opacity-70 hover:opacity-100 hover:bg-slate-900 transition-all shadow-md"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next slide"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-slate-950/60 text-white border border-white/20 backdrop-blur-sm opacity-70 hover:opacity-100 hover:bg-slate-900 transition-all shadow-md"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Dots */}
        <div className="absolute inset-x-0 bottom-2.5 z-20 flex items-center justify-center gap-1.5 pointer-events-auto">
          {slides.map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              aria-label={`Go to slide ${dotIndex + 1}`}
              aria-current={activeSlide === dotIndex ? 'true' : undefined}
              onClick={() => scrollToSlide(dotIndex)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeSlide === dotIndex
                  ? 'w-6 bg-white shadow-sm'
                  : 'w-1.5 bg-white/45 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
