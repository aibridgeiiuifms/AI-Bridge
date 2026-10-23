'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Sparkles,
} from 'lucide-react';
import { GalleryPictureWithTags } from '@/types/database';

interface GalleryLightboxProps {
  pictures: GalleryPictureWithTags[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  eventTitle?: string;
}

export default function GalleryLightbox({
  pictures,
  initialIndex = 0,
  isOpen,
  onClose,
  eventTitle,
}: GalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : pictures.length - 1));
  }, [pictures.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < pictures.length - 1 ? prev + 1 : 0));
  }, [pictures.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    setTouchStartX(null);
  };

  if (!isOpen || pictures.length === 0) return null;

  const currentPicture = pictures[currentIndex] || pictures[0];
  const taggedMembers = currentPicture?.tags || [];

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#0F172A]/95 backdrop-blur-xl flex flex-col justify-between select-none animate-fade-in"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label={eventTitle || 'Event Gallery Lightbox'}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 z-10 border-b border-white/10 bg-[#0F172A]">
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-bold tracking-wider text-[#EAD1A7] uppercase">
            {eventTitle || 'Event Gallery'}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white font-semibold">
            {currentIndex + 1} / {pictures.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          title="Close (Esc)"
          aria-label="Close lightbox"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        {pictures.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 sm:left-6 z-20 p-2 sm:p-3 rounded-full bg-[#0F172A]/80 hover:bg-[#0F4C3A] text-white border border-white/20 transition-all cursor-pointer"
            title="Previous (Left Arrow)"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}

        <div className="relative w-full h-full max-w-6xl max-h-[75vh] flex items-center justify-center">
          <Image
            src={currentPicture.image_url}
            alt={currentPicture.caption || eventTitle || 'Gallery photo'}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            className="object-contain transition-all duration-300"
            priority
          />
        </div>

        {pictures.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 sm:right-6 z-20 p-2 sm:p-3 rounded-full bg-[#0F172A]/80 hover:bg-[#0F4C3A] text-white border border-white/20 transition-all cursor-pointer"
            title="Next (Right Arrow)"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}
      </div>

      {/* Bottom Information Tray */}
      <div className="px-4 sm:px-8 py-4 bg-[#0F172A] border-t border-white/10 space-y-3 z-10 w-full">
        <div className="max-w-5xl mx-auto space-y-3">
          {currentPicture.caption && (
            <p className="text-sm sm:text-base text-white text-center font-medium leading-snug">
              {currentPicture.caption}
            </p>
          )}

          {taggedMembers.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-white/10">
              <span className="text-xs font-bold text-[#EAD1A7] uppercase tracking-wider flex items-center gap-1.5 mr-1">
                <Sparkles className="w-3.5 h-3.5" />
                In this photo:
              </span>

              {taggedMembers.map((t, idx) => {
                const mem = t.member;
                if (!mem) return null;
                return (
                  <Link
                    key={idx}
                    href="/#team"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 hover:bg-[#0F4C3A] border border-white/20 hover:border-[#C88A2B] text-white text-xs font-semibold transition-all"
                    title={`View ${mem.full_name} in Team Section`}
                  >
                    {mem.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mem.avatar_url}
                        alt={mem.full_name}
                        loading="lazy"
                        decoding="async"
                        className="w-4 h-4 rounded-full object-cover border border-white/40"
                      />
                    ) : (
                      <User className="w-3 h-3 text-[#EAD1A7]" />
                    )}
                    <span>{mem.full_name}</span>
                    {mem.team_tag && (
                      <span className="text-[10px] text-slate-300 font-normal">
                        • {mem.team_tag}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {pictures.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 max-w-full">
              {pictures.map((pic, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-12 h-10 sm:w-14 sm:h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    idx === currentIndex
                      ? 'border-[#C88A2B] scale-105'
                      : 'border-white/20 opacity-50 hover:opacity-90'
                  }`}
                >
                  <Image
                    src={pic.image_url}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
