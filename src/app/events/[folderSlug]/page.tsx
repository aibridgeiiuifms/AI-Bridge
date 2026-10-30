'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SdgLoading from '@/components/SdgLoading';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { 
  Calendar, 
  MapPin, 
  ExternalLink, 
  ArrowLeft, 
  Sparkles, 
  Folder,
  Images,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Maximize2
} from 'lucide-react';
import { fetchFolderWithEventsBySlug } from '@/lib/gallery';
import { GalleryFolderWithEvents, GalleryEventWithPictures, GalleryPictureWithTags } from '@/types/database';
import MarkdownView from '@/components/MarkdownView';
import GalleryLightbox from '@/components/gallery/GalleryLightbox';
import EventLikeButton from '@/components/gallery/EventLikeButton';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/tracking/trackEvent';
import { useTimeOnPage } from '@/hooks/useTimeOnPage';

// Subtle natural tilt angles for pinned photo prints
const WALL_TILTS = [-2.2, 2.4, -1.8, 2.6, -2.5, 1.9];

export default function FolderGalleryPage() {
  const params = useParams();
  const folderSlug = params?.folderSlug as string;

  const [folder, setFolder] = useState<GalleryFolderWithEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Time on album page tracking
  useTimeOnPage(`/events/${folderSlug}`, { folder_slug: folderSlug });

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPictures, setLightboxPictures] = useState<GalleryPictureWithTags[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxEventTitle, setLightboxEventTitle] = useState('');

  // Scroll-reveal state
  const [visibleEvents, setVisibleEvents] = useState<Set<string>>(new Set());
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Fetch current user auth state for Like functionality
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!folderSlug) return;
    async function loadFolder() {
      setLoading(true);
      try {
        const data = await fetchFolderWithEventsBySlug(folderSlug);
        setFolder(data);
        if (data) {
          trackEvent('event_folder_opened', `/events/${folderSlug}`, {
            folder_slug: folderSlug,
            folder_title: data.title,
            events_count: data.events?.length || 0,
          });
        }
      } catch (err) {
        console.error('Failed to load folder:', err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
    loadFolder();
  }, [folderSlug]);

  // Scroll reveal with IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    itemRefs.current.forEach((el, id) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleEvents((prev) => new Set([...prev, id]));
            obs.unobserve(el);
          }
        },
        { threshold: 0.1 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [folder]);

  const openLightbox = (pictures: GalleryPictureWithTags[], index: number, eventTitle: string) => {
    setLightboxPictures(pictures);
    setLightboxIndex(index);
    setLightboxEventTitle(eventTitle);
    setLightboxOpen(true);
    trackEvent('lightbox_opened', `/events/${folderSlug}`, {
      folder_slug: folderSlug,
      event_title: eventTitle,
      photo_index: index,
      total_photos: pictures.length,
    });
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 bg-[#F7F5E9]">
        <SdgLoading size={40} label="Opening Wall of Impact" />
        <p className="text-sm font-semibold text-emerald-950/70 animate-pulse font-serif">
          Curating The Wall of Impact...
        </p>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen bg-[#F7F5E9] py-20 px-4">
        <div className="max-w-md mx-auto text-center space-y-6 bg-[#EBDDC8] p-8 rounded-3xl border border-[#D6C5AB] shadow-lg">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100/80 text-amber-900 flex items-center justify-center">
            <Folder className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-serif">
            {loadError ? 'Gallery Temporarily Unavailable' : 'Album Not Found'}
          </h1>
          <p className="text-sm text-slate-700">
            {loadError
              ? 'The album could not be loaded. Please try again later.'
              : 'The requested event folder does not exist, is unpublished, or may have been archived.'}
          </p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all shadow-sm uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Albums
          </Link>
        </div>
      </div>
    );
  }

  const events = folder.events || [];
  const totalMoments = events.reduce((acc, evt) => acc + (evt.pictures?.length || 0), 0);

  return (
    <div className="min-h-screen bg-[#F7F5E9] text-slate-900 relative pb-36 overflow-x-clip">
      {/* Subtle organic ambient wallpaper lighting */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-0 -ml-28 w-96 h-96 bg-amber-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 -mr-32 w-96 h-96 bg-teal-200/25 rounded-full blur-3xl pointer-events-none" />

      {/* Top Breadcrumb & Return Bar (Sticky under main navbar) */}
      <div className="border-b border-[#E4DDD0] bg-[#F7F5E9]/95 backdrop-blur-md sticky top-16 sm:top-[68px] z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium overflow-hidden">
            <Link 
              href="/events" 
              className="hover:text-emerald-900 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Folder className="w-3.5 h-3.5 text-emerald-700" />
              <span>Events Gallery</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-bold text-slate-900 font-serif">
              {folder.title}
            </span>
          </div>

          <Link
            href="/events"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EAE2D2] hover:bg-emerald-100 hover:text-emerald-900 text-slate-800 font-bold transition-all text-[11px] shrink-0 border border-[#D8CDBB]"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>All Albums</span>
          </Link>
        </div>
      </div>

      {/* Header Banner: Magazine Exhibition Title */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">
        <div className="relative space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-emerald-950 bg-emerald-100/90 px-3.5 py-1 rounded-full border border-emerald-300/80 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              AI Bridge — The Wall of Impact
            </span>
            <span className="text-xs font-bold text-emerald-900 bg-[#E6EFE8] px-3 py-1 rounded-full border border-emerald-200/70">
              {events.length} {events.length === 1 ? 'Impact Story' : 'Impact Stories'}
            </span>
            {totalMoments > 0 && (
              <span className="text-xs font-semibold text-slate-700 bg-[#EFE9DC] px-3 py-1 rounded-full border border-[#DFD6C5]">
                {totalMoments} Total Moments Captured
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            {folder.title}
          </h1>

          {folder.description && (
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-sans max-w-2xl">
              {folder.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Pinterest-Inspired Asymmetric Wall of Impact ─────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {events.length === 0 ? (
          <div className="bg-[#EBDDC8] rounded-3xl border border-[#D8C7B0] p-12 text-center space-y-3 max-w-lg mx-auto shadow-sm">
            <Images className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 font-serif">No Events Added Yet</h3>
            <p className="text-xs text-slate-600">
              Photographs and field dispatches for this exhibition will be pinned here soon.
            </p>
          </div>
        ) : (
          <div className="space-y-20 sm:space-y-32">
            {events.map((evt, idx) => {
              const pictures = evt.pictures || [];
              const coverPic = pictures.find((p) => p.is_cover) || pictures[0];
              const cardId = evt.id || String(idx);
              const isVisible = visibleEvents.has(cardId);
              const isOdd = idx % 2 === 1;

              return (
                <div
                  key={cardId}
                  ref={(el) => {
                    if (el) itemRefs.current.set(cardId, el);
                    else itemRefs.current.delete(cardId);
                  }}
                  className="w-full"
                >
                  <WallImpactItem
                    evt={evt}
                    idx={idx}
                    totalEvents={events.length}
                    isOdd={isOdd}
                    isVisible={isVisible}
                    pictures={pictures}
                    coverPic={coverPic}
                    folderSlug={folderSlug}
                    currentUserId={currentUserId}
                    openLightbox={openLightbox}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Interactive Lightbox */}
      <GalleryLightbox
        pictures={lightboxPictures}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        eventTitle={lightboxEventTitle}
      />
    </div>
  );
}

/* ── Realistic Subtle Pushpin ────────────────────────────────────────────── */
function SubtlePushpin({ color = 'brass', className = '' }: { color?: 'brass' | 'emerald'; className?: string }) {
  const isEmerald = color === 'emerald';
  return (
    <div className={`relative flex items-center justify-center pointer-events-none select-none z-30 ${className}`}>
      {/* Needle shadow angled onto paper */}
      <div 
        className="absolute w-1 h-3.5 bg-black/35 blur-[0.8px] rotate-25 origin-top-left"
        style={{ top: '11px', left: '12px' }}
      />
      {/* 3D Round Pushpin Head with metallic gradient & bevel */}
      <div 
        className={`relative w-5 h-5 rounded-full flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(255,255,255,0.7)] border ${
          isEmerald 
            ? 'bg-gradient-to-br from-emerald-300 via-emerald-600 to-emerald-950 border-emerald-700/60' 
            : 'bg-gradient-to-br from-amber-200 via-amber-500 to-amber-900 border-amber-600/60'
        }`}
      >
        {/* Specular highlight */}
        <div className="w-1.5 h-1.5 rounded-full bg-white/85 blur-[0.3px] -mt-1 -ml-1" />
        {/* Center metallic dimple */}
        <div 
          className={`absolute w-2 h-2 rounded-full opacity-60 ${
            isEmerald ? 'bg-emerald-950' : 'bg-amber-950'
          }`} 
        />
      </div>
    </div>
  );
}

/* ── WallImpactItem: Editorial Magazine Layout ───────────────────────────── */
interface WallImpactItemProps {
  evt: GalleryEventWithPictures;
  idx: number;
  totalEvents: number;
  isOdd: boolean;
  isVisible: boolean;
  pictures: GalleryPictureWithTags[];
  coverPic: GalleryPictureWithTags | undefined;
  folderSlug: string;
  currentUserId: string | null;
  openLightbox: (pictures: GalleryPictureWithTags[], index: number, eventTitle: string) => void;
}

function WallImpactItem({
  evt,
  idx,
  totalEvents,
  isOdd,
  isVisible,
  pictures,
  coverPic,
  folderSlug,
  currentUserId,
  openLightbox,
}: WallImpactItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Cycle tilt angles naturally
  const tilt = WALL_TILTS[idx % WALL_TILTS.length];

  // Alternating portrait / landscape / editorial aspect ratios
  const aspectClass =
    idx % 3 === 0
      ? 'h-[330px] sm:h-[450px]'
      : idx % 3 === 1
      ? 'h-[250px] sm:h-[330px]'
      : 'h-[290px] sm:h-[390px]';

  // DISTINCT COLOR FRAMES (NOT WHITE):
  // Even: Botanical Sage Green Mount (#D9E6DB)
  // Odd: Warm Heritage Sandstone / Kraft Mount (#EBDDC8)
  const frameBgClass = isOdd
    ? 'bg-[#EBDDC8] border-[#D6C5AB]'
    : 'bg-[#D9E6DB] border-[#BFD5C3]';

  const pushpinColor = isOdd ? 'brass' : 'emerald';

  // Mobile Touch Swipe support (swipe left or right to open fullscreen gallery)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;
    if (Math.abs(diffX) > 40 && pictures.length > 0) {
      openLightbox(pictures, 0, evt.title);
    }
    setTouchStartX(null);
  };

  // Sliding in from left/right:
  // Even: photo is on Left, text on Right
  // Odd: photo is on Right, text on Left
  const photoSlideStyle = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible
      ? 'translateX(0) translateY(0)'
      : isOdd
      ? 'translateX(40px) translateY(0)'
      : 'translateX(-40px) translateY(0)',
    transition: `opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 80}ms, transform 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 80}ms`,
  };

  const textSlideStyle = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible
      ? 'translateX(0) translateY(0)'
      : isOdd
      ? 'translateX(-40px) translateY(0)'
      : 'translateX(40px) translateY(0)',
    transition: `opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 80 + 50}ms, transform 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 80 + 50}ms`,
  };

  return (
    <div
      className={`flex flex-col ${
        isOdd ? 'md:flex-row-reverse' : 'md:flex-row'
      } items-center gap-8 lg:gap-16 w-full`}
    >
      {/* ── 1. The Pinned Photograph (Two Corner Pins, Peeking Stack & Color Aura) ── */}
      <div 
        style={photoSlideStyle}
        className="w-full md:w-[52%] flex justify-center relative"
      >
        {/* Ambient Color Aura glowing softly onto the wall behind photo */}
        <div
          className="absolute -inset-3 rounded-3xl blur-2xl opacity-45 group-hover:opacity-90 transition-all duration-500 pointer-events-none"
          style={{
            background: isOdd
              ? 'radial-gradient(circle, rgba(217, 119, 6, 0.3) 0%, rgba(180, 83, 9, 0.12) 50%, transparent 75%)'
              : 'radial-gradient(circle, rgba(5, 150, 105, 0.32) 0%, rgba(4, 120, 87, 0.14) 50%, transparent 75%)',
          }}
        />

        {/* Outer Card with Hover Lift and Peeking Stack */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (pictures.length > 0) {
              openLightbox(pictures, 0, evt.title);
            }
          }}
          style={{
            transform: isHovered
              ? 'translateY(-8px) rotate(0deg) scale(1.015)'
              : `translateY(0) rotate(${tilt}deg)`,
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: isHovered
              ? '0 25px 50px -10px rgba(6, 78, 59, 0.25), 0 10px 20px -5px rgba(0, 0, 0, 0.1)'
              : '0 12px 28px -6px rgba(25, 35, 30, 0.15), 0 3px 8px rgba(0, 0, 0, 0.06)',
          }}
          className={`relative w-full max-w-lg cursor-pointer p-3 pb-4 sm:p-4.5 sm:pb-5 rounded-2xl border ${frameBgClass} select-none group shadow-md`}
        >
          {/* ── Two Authentic Corner Pushpins ── */}
          {/* Top-Left Pin */}
          <div className="absolute -top-3 left-4 sm:left-6 z-20 pointer-events-none select-none -rotate-12">
            <SubtlePushpin color={pushpinColor} />
          </div>

          {/* Top-Right Pin */}
          <div className="absolute -top-3 right-4 sm:right-6 z-20 pointer-events-none select-none rotate-12">
            <SubtlePushpin color={pushpinColor} />
          </div>

          {/* ── Peeking Stacked Cards Effect behind the mount ── */}
          {pictures.length > 1 && (
            <>
              {/* Underneath layer 2 */}
              {pictures.length > 2 && (
                <div 
                  className={`absolute inset-0 rounded-2xl border ${frameBgClass} opacity-35 pointer-events-none transition-transform duration-500 -z-10`}
                  style={{
                    transform: isHovered 
                      ? 'rotate(4.5deg) translate(8px, 6px) scale(0.98)' 
                      : 'rotate(2deg) translate(4px, 3px) scale(0.99)',
                  }}
                />
              )}
              {/* Underneath layer 1 */}
              <div 
                className={`absolute inset-0 rounded-2xl border ${frameBgClass} opacity-60 pointer-events-none transition-transform duration-500 -z-10`}
                style={{
                  transform: isHovered 
                    ? 'rotate(-3.5deg) translate(-6px, 4px) scale(0.99)' 
                    : 'rotate(-1.5deg) translate(-3px, 2px) scale(0.995)',
                }}
              />
            </>
          )}

          {/* Photograph Container */}
          <div className={`relative w-full ${aspectClass} overflow-hidden rounded-xl bg-slate-900 shadow-inner`}>
            {coverPic ? (
              <>
                <Image
                  src={coverPic.image_url}
                  alt={coverPic.caption || evt.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                {/* Subtle dark gradient overlay on bottom of image for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-75 group-hover:opacity-85 transition-opacity" />

                {/* Top-Right Fullscreen Badge */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-white border border-white/20 shadow-md">
                    <Maximize2 className="w-3 h-3 text-emerald-300" />
                    <span>Fullscreen</span>
                  </span>
                </div>

                {/* Mobile Hint badge */}
                <div className="absolute top-3 left-3 sm:hidden">
                  <span className="text-[10px] text-white/95 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full font-bold border border-white/10">
                    Tap to view
                  </span>
                </div>

                {/* Bottom Overlay: Caption + Tags */}
                <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
                  {coverPic.caption && (
                    <p className="text-xs sm:text-sm font-semibold truncate drop-shadow-md">
                      {coverPic.caption}
                    </p>
                  )}

                  {coverPic.tags && coverPic.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                      <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider shrink-0">
                        Tagged:
                      </span>
                      {coverPic.tags.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-white font-medium shrink-0"
                        >
                          {t.member?.full_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400 bg-slate-800">
                <Images className="w-10 h-10" />
              </div>
            )}
          </div>

          {/* ── Updated "View All Photos" Bottom Action Strip ── */}
          {pictures.length > 1 ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                openLightbox(pictures, 0, evt.title);
              }}
              className="w-full mt-3 py-2 px-3 sm:px-3.5 rounded-xl bg-slate-900/90 hover:bg-emerald-900 active:scale-[0.99] text-white flex items-center justify-between shadow-md transition-all group/bar border border-emerald-500/20 cursor-pointer"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {/* 2-3 Mini Thumbnail Circles previewing upcoming photos */}
                <div className="flex -space-x-2 shrink-0">
                  {pictures.slice(1, 4).map((p, pIdx) => (
                    <div 
                      key={p.id || pIdx} 
                      className="relative w-6 h-6 rounded-full border-2 border-slate-900 overflow-hidden bg-slate-800"
                    >
                      <Image 
                        src={p.image_url} 
                        alt="" 
                        fill 
                        sizes="24px" 
                        className="object-cover" 
                      />
                    </div>
                  ))}
                </div>

                <span className="text-xs font-black tracking-tight text-emerald-200 truncate">
                  +{pictures.length - 1} More Photos in Story
                </span>
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-800/90 group-hover/bar:bg-emerald-700 px-2.5 py-1 rounded-lg transition-colors shrink-0 ml-2">
                <span>Open Reel</span>
                <ChevronRight className="w-3 h-3 group-hover/bar:translate-x-0.5 transition-transform" />
              </span>
            </div>
          ) : (
            <div className="mt-2.5 py-1 px-3 rounded-lg bg-black/5 text-center text-[11px] font-semibold text-slate-600">
              1 Documented Photograph
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Editorial Magazine Storytelling (UNBOXED, Directly on Wall) ── */}
      <div 
        style={textSlideStyle}
        className="w-full md:w-[48%] relative"
      >
        {/* Large Decorative Editorial Watermark Number */}
        <div className="font-serif font-black text-7xl sm:text-8xl lg:text-9xl text-emerald-950/[0.08] select-none absolute -top-10 -left-4 pointer-events-none leading-none">
          {String(idx + 1).padStart(2, '0')}
        </div>

        <div className="relative z-10 space-y-4">
          {pictures.length > 1 && (
            <div className="flex justify-end sm:hidden pb-1">
              <span className="text-[10px] text-slate-500 font-semibold">
                Swipe photo to open
              </span>
            </div>
          )}

          {/* Editorial Dateline: Unboxed Pinpoint & Date */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Location Pinpoint — Unboxed Editorial Beacon */}
            {evt.location && (
              <div className="inline-flex items-center gap-2 group/loc">
                <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-emerald-800/10 text-emerald-800 transition-transform duration-300 group-hover/loc:scale-110">
                  <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-600/25 opacity-75 pointer-events-none" />
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 relative z-10" />
                </span>
                <span className="font-extrabold uppercase tracking-[0.16em] text-slate-900 text-xs">
                  {evt.location}
                </span>
              </div>
            )}

            {/* Date with Editorial Bullet Separator */}
            {evt.is_date_visible && evt.event_date && (
              <>
                {evt.location && (
                  <span className="text-[#C8BEAB] select-none text-xs font-black hidden sm:inline">•</span>
                )}
                <div className="inline-flex items-center gap-1.5 text-slate-600 text-xs font-semibold tracking-wide">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700/80" />
                  <span>
                    {new Date(evt.event_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'UTC',
                    })}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Magazine Headline Title */}
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-[2.35rem] font-bold text-slate-900 tracking-tight leading-[1.2]">
            {evt.title}
          </h2>

          {/* Short Storytelling Narrative */}
          {evt.description_markdown && (
            <div className="border-l-2 border-emerald-700/50 pl-4 py-1">
              <ExpandableStoryDescription
                content={evt.description_markdown}
                eventTitle={evt.title}
                folderSlug={folderSlug}
              />
            </div>
          )}

          {/* External Links */}
          {evt.external_links && evt.external_links.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {evt.external_links.map((link, lIdx) => (
                <a
                  key={lIdx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackEvent('external_link_clicked', `/events/${folderSlug}`, {
                      url: link.url,
                      label: link.label,
                      event_title: evt.title,
                    });
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-950 bg-emerald-100/90 hover:bg-emerald-200 px-3 py-1 rounded-full transition-colors border border-emerald-300/80 shadow-2xs"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="w-3 h-3 text-emerald-800" />
                </a>
              ))}
            </div>
          )}

          {/* Bottom Interactive Row */}
          <div className="pt-3 border-t border-[#E2DBD0] flex items-center justify-end">
            {/* Like Button */}
            <EventLikeButton
              eventId={evt.id}
              eventTitle={evt.title}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Expandable Storytelling Description ──────────────────────────────────── */
function ExpandableStoryDescription({
  content,
  eventTitle,
  folderSlug,
}: {
  content?: string;
  eventTitle?: string;
  folderSlug?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content || !content.trim()) return null;

  const isLong =
    content.trim().length > 170 ||
    content.includes('\n\n') ||
    content.split('\n').filter((l) => l.trim().length > 0).length > 2;

  return (
    <div className="space-y-2">
      <div className="relative">
        <div
          className={`transition-all duration-300 text-slate-700 text-sm sm:text-base leading-relaxed ${
            !isExpanded && isLong ? 'max-h-20 overflow-hidden' : ''
          }`}
        >
          <MarkdownView content={content} />
        </div>

        {/* Soft gradient fade overlay when collapsed */}
        {!isExpanded && isLong && (
          <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#F7F5E9] via-[#F7F5E9]/60 to-transparent pointer-events-none" />
        )}
      </div>

      {isLong && (
        <button
          type="button"
          onClick={() => {
            setIsExpanded((prev) => {
              const next = !prev;
              if (next) {
                trackEvent('event_description_expanded', `/events/${folderSlug || ''}`, {
                  event_title: eventTitle || '',
                });
              }
              return next;
            });
          }}
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900 hover:text-emerald-950 transition-colors cursor-pointer pt-1"
        >
          <span>{isExpanded ? 'Read Less' : 'Read More'}</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-emerald-700" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
          )}
        </button>
      )}
    </div>
  );
}
