'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Folder, 
  Sparkles, 
  Search, 
  ImageIcon
} from 'lucide-react';
import { fetchPublishedFolders } from '@/lib/gallery';
import { GalleryFolderWithEvents } from '@/types/database';
import EventsSkeleton from '@/components/skeletons/EventsSkeleton';
import { readClientCache, writeClientCache } from '@/lib/clientCache';

const GALLERY_CACHE_KEY = 'ai-bridge:public-gallery:v1';
const PUBLIC_GALLERY_CACHE_TTL = 30 * 60 * 1000;

// Polaroid rotation angles — cycled by index
const POLAROID_ROTATIONS = [-2.8, 2.5, -1.8, 3.1, -2.2, 1.9, -2.6, 2.8];

export default function EventsGalleryPageContent() {
  const [folders, setFolders] = useState<GalleryFolderWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Polaroid wall — hover and scroll-reveal state
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const cachedFolders = readClientCache<GalleryFolderWithEvents[]>(GALLERY_CACHE_KEY);
    if (cachedFolders) {
      setFolders(cachedFolders);
      setLoading(false);
    }

    async function loadFolders() {
      if (!cachedFolders) setLoading(true);
      try {
        const data = await fetchPublishedFolders();
        setFolders(data);
        writeClientCache(GALLERY_CACHE_KEY, data, PUBLIC_GALLERY_CACHE_TTL);
        setLoadError(false);
      } catch (err) {
        console.error('Failed to load folders:', err);
        if (!cachedFolders) setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
    loadFolders();
  }, []);

  const filteredFolders = folders.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.title.toLowerCase().includes(q) ||
      (f.description && f.description.toLowerCase().includes(q))
    );
  });

  // IntersectionObserver — slide-in from left/right
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    cardRefs.current.forEach((el, id) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleItems((prev) => new Set([...prev, id]));
            obs.unobserve(el);
          }
        },
        { threshold: 0.1 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [filteredFolders]);

  return (
    <div className="min-h-screen bg-[#F7F5E9] text-slate-900 py-12 px-4 sm:px-6 lg:px-8 space-y-12 relative overflow-x-hidden">
      {/* Warm ambient wallpaper glows */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 -ml-28 w-96 h-96 bg-amber-300/25 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto relative z-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-950 bg-emerald-100/90 px-3.5 py-1.5 rounded-full border border-emerald-300/80 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          AI Bridge — The Wall of Impact
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
          Events &amp; Impact Archive
        </h1>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-2xl mx-auto font-sans">
          Explore photographic archives, campaigns, and documented operational evidence from workshops, campus awareness sessions, and SDG initiatives at IIUI Islamabad.
        </p>

        {/* Search Bar */}
        <div className="pt-4 max-w-md mx-auto relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search albums by title or topic..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#D8CDBB] bg-[#EAE2D2] text-xs sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent shadow-xs transition-all"
          />
        </div>
      </div>

      {/* Polaroid Wall */}
      <div className="max-w-7xl mx-auto relative z-10">
        {loading ? (
          <EventsSkeleton />
        ) : loadError ? (
          <div className="bg-[#EBDDC8] rounded-3xl border border-[#D6C5AB] p-12 text-center space-y-3 max-w-lg mx-auto shadow-sm">
            <Folder className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 font-serif">Gallery Temporarily Unavailable</h3>
            <p className="text-xs text-slate-600">
              Albums could not be loaded. Please try again later.
            </p>
          </div>
        ) : filteredFolders.length === 0 ? (
          <div className="bg-[#EBDDC8] rounded-3xl border border-[#D6C5AB] p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
            <Folder className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 font-serif">No Albums Found</h3>
            <p className="text-xs text-slate-600">
              {searchQuery ? 'No event folders matched your search term.' : 'No event albums have been published yet.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer uppercase tracking-wider"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-10 sm:gap-14 pt-4">
            {filteredFolders.map((folder, idx) => {
              const eventCount = folder.events_count ?? (folder.events?.length || 0);
              const rotation = POLAROID_ROTATIONS[idx % POLAROID_ROTATIONS.length];
              const isVisible = visibleItems.has(folder.id);
              const isHovered = hoveredId === folder.id;
              const isEven = idx % 2 === 0;

              // DISTINCT COLOR FRAMES (NOT WHITE):
              // Even: Botanical Sage Green Mount (#D9E6DB)
              // Odd: Warm Heritage Sandstone / Kraft Mount (#EBDDC8)
              const frameBgClass = isEven
                ? 'bg-[#D9E6DB] border-[#BFD5C3]'
                : 'bg-[#EBDDC8] border-[#D6C5AB]';

              const slideX = isEven ? -28 : 28;

              return (
                <div
                  key={folder.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(folder.id, el);
                    else cardRefs.current.delete(folder.id);
                  }}
                  onMouseEnter={() => setHoveredId(folder.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isHovered
                      ? 'translateY(-8px) rotate(0deg) scale(1.02)'
                      : `translateX(${isVisible ? 0 : slideX}px) translateY(${isVisible ? 0 : 24}px) rotate(${rotation}deg)`,
                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease',
                    boxShadow: isHovered
                      ? '0 25px 45px -10px rgba(6, 78, 59, 0.25), 0 8px 18px rgba(0,0,0,0.08)'
                      : '0 12px 28px -6px rgba(25, 35, 30, 0.14), 0 3px 8px rgba(0,0,0,0.06)',
                  }}
                  className="cursor-pointer relative group"
                >
                  {/* Color Aura Glow behind each album print on the wall */}
                  <div
                    className="absolute -inset-2 rounded-2xl blur-xl opacity-40 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: isEven
                        ? 'radial-gradient(circle, rgba(5, 150, 105, 0.3) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(217, 119, 6, 0.28) 0%, transparent 70%)',
                    }}
                  />

                  {/* ── Two Corner Pushpins (Top-Left & Top-Right) ── */}
                  <div className="absolute -top-3 left-4 z-20 pointer-events-none select-none -rotate-12">
                    <AlbumPushpin isEven={isEven} />
                  </div>
                  <div className="absolute -top-3 right-4 z-20 pointer-events-none select-none rotate-12">
                    <AlbumPushpin isEven={isEven} />
                  </div>

                  {/* ── Peeking Card Stack behind album polaroid ── */}
                  {eventCount > 1 && (
                    <div 
                      className={`absolute inset-0 rounded-2xl border ${frameBgClass} opacity-50 pointer-events-none transition-transform duration-400 -z-10`}
                      style={{
                        transform: isHovered
                          ? 'rotate(3.5deg) translate(5px, 4px) scale(0.99)'
                          : 'rotate(1.5deg) translate(3px, 2px) scale(0.995)',
                      }}
                    />
                  )}

                  <Link
                    href={`/events/${folder.slug}`}
                    className={`block p-3.5 pb-7 rounded-2xl border ${frameBgClass} shadow-md relative z-10`}
                    style={{ textDecoration: 'none' }}
                  >
                    {/* Colored mount image area */}
                    <div className="relative w-56 h-52 sm:w-64 sm:h-60 overflow-hidden rounded-xl bg-slate-900 shadow-inner">
                      <Image
                        src={folder.thumbnail_url}
                        alt={folder.title}
                        fill
                        sizes="(max-width: 640px) 224px, 256px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                      {/* Event Count Pill */}
                      <div className="absolute top-2.5 right-2.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-white shadow-md border border-white/20">
                          <ImageIcon className="w-3 h-3 text-emerald-300" />
                          <span>{eventCount} {eventCount === 1 ? 'Story' : 'Stories'}</span>
                        </span>
                      </div>

                      {/* Album Badge */}
                      <div className="absolute bottom-2.5 left-2.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-950/85 backdrop-blur-md text-emerald-200 border border-emerald-400/30">
                          <Folder className="w-3 h-3 text-emerald-400" />
                          <span>Archive</span>
                        </span>
                      </div>
                    </div>

                    {/* Magazine Style Label */}
                    <p className="font-serif font-bold text-slate-900 text-base text-center mt-3.5 px-1 leading-snug truncate max-w-[224px] sm:max-w-[256px]">
                      {folder.title}
                    </p>
                    <p className="text-xs text-slate-600 text-center mt-1 font-sans">
                      {eventCount} {eventCount === 1 ? 'documented event' : 'documented events'}
                    </p>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AlbumPushpin({ isEven }: { isEven: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      <div 
        className="absolute w-1 h-3.5 bg-black/35 blur-[0.8px] rotate-25 origin-top-left"
        style={{ top: '11px', left: '12px' }}
      />
      <div 
        className={`w-5 h-5 rounded-full flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(255,255,255,0.7)] border ${
          isEven 
            ? 'bg-gradient-to-br from-emerald-300 via-emerald-600 to-emerald-950 border-emerald-700/60' 
            : 'bg-gradient-to-br from-amber-200 via-amber-500 to-amber-900 border-amber-600/60'
        }`}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-white/85 blur-[0.3px] -mt-1 -ml-1" />
        <div className={`absolute w-2 h-2 rounded-full opacity-60 ${isEven ? 'bg-emerald-950' : 'bg-amber-950'}`} />
      </div>
    </div>
  );
}
