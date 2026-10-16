'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Sparkles, ChevronLeft, ChevronRight, X } from 'lucide-react';

const slides = [
  { src: '/highlights/p1.webp', alt: 'AI Bridge Campaign Highlight 1' },
  { src: '/highlights/p2.webp', alt: 'AI Bridge Campaign Highlight 2' },
  { src: '/highlights/p3.webp', alt: 'AI Bridge Campaign Highlight 3' },
  { src: '/highlights/p4.webp', alt: 'AI Bridge Campaign Highlight 4' },
  { src: '/highlights/p5.webp', alt: 'AI Bridge Campaign Highlight 5' },
  { src: '/highlights/p6.webp', alt: 'AI Bridge Campaign Highlight 6' },
  { src: '/highlights/p7.webp', alt: 'AI Bridge Campaign Highlight 7' },
  { src: '/highlights/p8.webp', alt: 'AI Bridge Campaign Highlight 8' },
  { src: '/highlights/p9.webp', alt: 'AI Bridge Campaign Highlight 9' },
  { src: '/highlights/p10.webp', alt: 'AI Bridge Campaign Highlight 10' },
  { src: '/highlights/p11.webp', alt: 'AI Bridge Campaign Highlight 11' },
];

interface HighlightsCarouselProps {
  className?: string;
}

export default function HighlightsCarousel({ className = '' }: HighlightsCarouselProps) {
  // ── Main carousel state ──────────────────────────────────────────────────
  const [activeSlide, setActiveSlide] = useState(4);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // ── Lightbox preview state ────────────────────────────────────────────────
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewTouchStartX, setPreviewTouchStartX] = useState<number | null>(null);

  // ── Preview helpers ───────────────────────────────────────────────────────
  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  const closePreview = () => setPreviewOpen(false);

  const handlePrevPreview = () =>
    setPreviewIndex((prev) => (prev - 1 + slides.length) % slides.length);

  const handleNextPreview = () =>
    setPreviewIndex((prev) => (prev + 1) % slides.length);

  // ── Preview swipe handlers ────────────────────────────────────────────────
  const handlePreviewTouchStart = (e: React.TouchEvent) =>
    setPreviewTouchStartX(e.touches[0].clientX);

  const handlePreviewTouchEnd = (e: React.TouchEvent) => {
    if (previewTouchStartX === null) return;
    const diff = previewTouchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNextPreview();
      else handlePrevPreview();
    }
    setPreviewTouchStartX(null);
  };

  // ── Keyboard + scroll lock ────────────────────────────────────────────────
  useEffect(() => {
    if (!previewOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePreview();
      if (e.key === 'ArrowLeft') handlePrevPreview();
      if (e.key === 'ArrowRight') handleNextPreview();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewOpen, previewIndex]);

  // ── Main carousel helpers ─────────────────────────────────────────────────
  const goToSlide = useCallback((index: number) => {
    setActiveSlide((index + slides.length) % slides.length);
  }, []);

  const handlePrev = useCallback(() => goToSlide(activeSlide - 1), [activeSlide, goToSlide]);
  const handleNext = useCallback(() => goToSlide(activeSlide + 1), [activeSlide, goToSlide]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => goToSlide(activeSlide + 1), 3200);
    return () => clearInterval(interval);
  }, [activeSlide, isPaused, goToSlide]);

  // ── Main carousel swipe ───────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    setTouchStartX(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={`flex flex-col w-full ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200 sm:text-xs">
          <Sparkles className="h-3 w-3 text-amber-300" />
          <span>Week 2 Highlights</span>
        </span>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-200/80 sm:text-xs">
          <span className="font-bold text-white">{activeSlide + 1}</span>
          <span>/</span>
          <span>{slides.length}</span>
        </div>
      </div>

      {/* Carousel track */}
      <div className="relative group overflow-hidden rounded-2xl border border-white/20 bg-slate-950/80 shadow-2xl backdrop-blur-md">
        <div
          className="flex transition-transform duration-500 ease-out will-change-transform"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <article
              key={slide.src}
              className="relative aspect-video w-full shrink-0 overflow-hidden bg-slate-950 flex items-center justify-center"
              aria-label={`Highlight ${index + 1} of ${slides.length}`}
            >
              <Image
                src={slide.src}
                alt=""
                fill
                aria-hidden="true"
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover blur-2xl scale-110 opacity-30 pointer-events-none"
              />
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                onClick={() => openPreview(index)}
                className="object-cover w-full h-full z-10 cursor-pointer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20 pointer-events-none z-10" />
            </article>
          ))}
        </div>

        {/* Prev / Next arrows */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous highlight"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-slate-950/70 text-white border border-white/20 backdrop-blur-sm opacity-80 hover:opacity-100 hover:bg-slate-900 transition-all shadow-md active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next highlight"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-slate-950/70 text-white border border-white/20 backdrop-blur-sm opacity-80 hover:opacity-100 hover:bg-slate-900 transition-all shadow-md active:scale-95"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Indicator dots */}
        <div className="absolute inset-x-0 bottom-2.5 z-20 flex items-center justify-center gap-1 sm:gap-1.5 pointer-events-auto px-4">
          {slides.map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              aria-label={`Go to highlight ${dotIndex + 1}`}
              aria-current={activeSlide === dotIndex ? 'true' : undefined}
              onClick={() => goToSlide(dotIndex)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeSlide === dotIndex
                  ? 'w-5 sm:w-6 bg-white shadow-sm'
                  : 'w-1.5 bg-white/45 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Lightbox overlay ─────────────────────────────────────────────────
          All images are pre-rendered in a CSS translateX strip so navigating
          is pure CSS — zero network latency between images.
      ──────────────────────────────────────────────────────────────────────── */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Highlight preview"
          onTouchStart={handlePreviewTouchStart}
          onTouchEnd={handlePreviewTouchEnd}
        >
          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white border border-white/20 pointer-events-none">
            {previewIndex + 1} / {slides.length}
          </div>

          {/* Close (X) */}
          <button
            type="button"
            onClick={closePreview}
            aria-label="Close preview"
            className="absolute right-4 top-4 z-30 rounded-full border border-white/25 bg-slate-900/90 p-2 text-white shadow-lg hover:bg-slate-800 hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Image strip — translateX moves between pre-loaded images instantly */}
          <div
            className="absolute inset-x-12 top-16 bottom-20 sm:inset-x-16"
            onClick={closePreview}
          >
            <div
              className="flex h-full transition-transform duration-200 ease-out will-change-transform"
              style={{ transform: `translateX(-${previewIndex * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div
                  key={slide.src}
                  className="relative h-full w-full shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    sizes="100vw"
                    priority={index === previewIndex}
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Prev arrow */}
          <button
            type="button"
            onClick={handlePrevPreview}
            aria-label="Previous highlight"
            className="absolute left-2 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/25 bg-slate-900/80 p-2 text-white shadow-lg hover:bg-slate-800 hover:text-emerald-200 sm:left-4"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          {/* Next arrow */}
          <button
            type="button"
            onClick={handleNextPreview}
            aria-label="Next highlight"
            className="absolute right-2 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/25 bg-slate-900/80 p-2 text-white shadow-lg hover:bg-slate-800 hover:text-emerald-200 sm:right-4"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          {/* Go Back */}
          <button
            type="button"
            onClick={closePreview}
            className="absolute bottom-6 left-6 z-30 flex items-center gap-2 rounded-full border border-white/30 bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-xl hover:bg-slate-800 hover:text-emerald-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 sm:left-16"
          >
            ← Go Back
          </button>
        </div>
      )}
    </div>
  );
}
