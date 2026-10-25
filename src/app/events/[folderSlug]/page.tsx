'use client';

import React, { useState, useEffect } from 'react';
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
  ImageIcon, 
  User, 
  Folder,
  Layers,
  Images,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { fetchFolderWithEventsBySlug } from '@/lib/gallery';
import { GalleryFolderWithEvents, GalleryEventWithPictures, GalleryPictureWithTags } from '@/types/database';
import MarkdownView from '@/components/MarkdownView';
import GalleryLightbox from '@/components/gallery/GalleryLightbox';
import EventLikeButton from '@/components/gallery/EventLikeButton';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/tracking/trackEvent';
import { useTimeOnPage } from '@/hooks/useTimeOnPage';

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
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <SdgLoading size={40} label="Opening event album" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">
          Opening Event Album...
        </p>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center">
          <Folder className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          {loadError ? 'Gallery Temporarily Unavailable' : 'Album Not Found'}
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          {loadError
            ? 'The album could not be loaded. Please try again later.'
            : 'The requested event folder does not exist, is unpublished, or may have been archived.'}
        </p>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Albums
        </Link>
      </div>
    );
  }

  const events = folder.events || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/60 pb-28">
      {/* Top Breadcrumb & Return Bar */}
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium overflow-hidden">
            <Link 
              href="/events" 
              className="hover:text-emerald-800 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Folder className="w-3.5 h-3.5 text-emerald-700" />
              <span>Events Gallery</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="truncate font-bold text-slate-900">
              {folder.title}
            </span>
          </div>

          <Link
            href="/events"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-bold transition-all text-[11px] shrink-0"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>All Albums</span>
          </Link>
        </div>
      </div>

      {/* Album Header Banner */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

          <div className="relative space-y-4 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200/80">
                <Folder className="w-3 h-3 text-emerald-700" />
                Event Album
              </span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {events.length} {events.length === 1 ? 'Event Documented' : 'Events Documented'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {folder.title}
            </h1>

            {folder.description && (
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {folder.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Events — Simple Vertical Scroll */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {events.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Events Added Yet</h3>
            <p className="text-xs text-slate-500">
              Photographs and documentation for this album will appear here soon.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {events.map((evt, idx) => {
              const pictures = evt.pictures || [];
              const coverPic = pictures.find(p => p.is_cover) || pictures[0];
              const remainingPics = pictures.filter(p => p.id !== coverPic?.id);

              return (
                <article
                  key={evt.id || idx}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                >
                  {/* Decorative Card Top Indicator */}
                  <div className="h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700" />

                  <div className="p-6 sm:p-8 lg:p-10 space-y-6">
                    {/* Metadata Header Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Event Index Badge */}
                        <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                          #{idx + 1}
                        </span>

                        {/* Location Badge */}
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>{evt.location}</span>
                        </span>

                        {/* Date Badge — STRICTLY HIDDEN IF is_date_visible is false */}
                        {evt.is_date_visible && evt.event_date && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                            <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>
                              {new Date(evt.event_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                timeZone: 'UTC'
                              })}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* External Links (Chips) */}
                      {evt.external_links && evt.external_links.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
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
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors border border-emerald-200/60"
                            >
                              <span>{link.label}</span>
                              <ExternalLink className="w-3 h-3 text-emerald-600" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Event Title */}
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                      {evt.title}
                    </h2>

                    {/* Multi-Picture Showcase (Click to Open Lightbox) */}
                    {pictures.length > 0 && (
                      <div className="space-y-3 pt-2">
                        {/* Section Header with Clear Count & Direct View All Action */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                            Photo Showcase ({pictures.length} {pictures.length === 1 ? 'Photo' : 'Photos'})
                          </span>
                          {pictures.length > 1 && (
                            <button
                              onClick={() => openLightbox(pictures, 0, evt.title)}
                              className="text-xs font-extrabold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Layers className="w-3.5 h-3.5 text-emerald-700" />
                              <span>View All ({pictures.length})</span>
                            </button>
                          )}
                        </div>

                        {/* Image Showcase Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Primary Cover Image */}
                          {coverPic && (
                            <div
                              onClick={() => openLightbox(pictures, 0, evt.title)}
                              className="relative h-64 sm:h-72 sm:col-span-2 rounded-2xl overflow-hidden cursor-pointer group shadow-sm border border-slate-200"
                            >
                              <Image
                                src={coverPic.image_url}
                                alt={coverPic.caption || evt.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 600px"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-85 group-hover:opacity-90 transition-opacity" />

                              {/* Prominent High-Visibility Photo Count Pill on Mobile & Desktop */}
                              {pictures.length > 1 && (
                                <div className="absolute top-3 right-3 z-10">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 hover:bg-emerald-800 backdrop-blur-md text-white text-xs font-extrabold shadow-md border border-white/20 transition-all group-hover:scale-105">
                                    <Images className="w-3.5 h-3.5 text-emerald-300" />
                                    <span>{pictures.length} Photos</span>
                                    <span className="text-[10px] text-emerald-200 bg-emerald-950/80 px-2 py-0.5 rounded-full font-bold ml-0.5">
                                      Tap to open
                                    </span>
                                  </span>
                                </div>
                              )}

                              {/* Caption overlay on cover */}
                              <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
                                {coverPic.caption && (
                                  <p className="text-xs sm:text-sm font-semibold truncate drop-shadow">
                                    {coverPic.caption}
                                  </p>
                                )}
                                
                                {/* Tagged Team Members chips on cover */}
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
                            </div>
                          )}

                          {/* Desktop Secondary Thumbnails Stack */}
                          <div className="hidden sm:grid sm:grid-cols-1 gap-3">
                            {remainingPics.slice(0, 2).map((pic, pIdx) => {
                              const actualIndex = pictures.findIndex(p => p.id === pic.id);
                              const isLastVisible = pIdx === 1 && remainingPics.length > 2;
                              const extraCount = remainingPics.length - 2;

                              return (
                                <div
                                  key={pic.id || pIdx}
                                  onClick={() => openLightbox(pictures, actualIndex, evt.title)}
                                  className="relative sm:h-[138px] rounded-2xl overflow-hidden cursor-pointer group shadow-sm border border-slate-200"
                                >
                                  <Image
                                    src={pic.image_url}
                                    alt={pic.caption || `Photo ${actualIndex + 1}`}
                                    fill
                                    sizes="300px"
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                                  {isLastVisible && extraCount > 0 && (
                                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center text-white text-center p-2">
                                      <div>
                                        <span className="text-lg font-black block">+{extraCount}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                                          More Photos
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Mobile Swipeable Thumbnail Carousel & Action Bar */}
                        {pictures.length > 1 && (
                          <div className="sm:hidden space-y-2.5 pt-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                              <span>Swipe photos to browse:</span>
                              <span className="text-emerald-700 font-extrabold">{pictures.length} photos</span>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-0.5 scroll-smooth snap-x snap-mandatory">
                              {pictures.map((pic, pIdx) => (
                                <button
                                  key={pic.id || pIdx}
                                  onClick={() => openLightbox(pictures, pIdx, evt.title)}
                                  className="relative w-24 h-20 shrink-0 rounded-xl overflow-hidden border border-slate-200 shadow-2xs snap-start cursor-pointer group active:scale-95 transition-all text-left"
                                >
                                  <Image
                                    src={pic.image_url}
                                    alt={`Photo ${pIdx + 1}`}
                                    fill
                                    sizes="96px"
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition-colors" />
                                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white">
                                    #{pIdx + 1}
                                  </span>
                                </button>
                              ))}

                              {/* Dedicated View All Card in horizontal mobile strip */}
                              <button
                                onClick={() => openLightbox(pictures, 0, evt.title)}
                                className="relative w-24 h-20 shrink-0 rounded-xl bg-emerald-900 text-white flex flex-col items-center justify-center text-center p-2 shadow-2xs snap-start cursor-pointer hover:bg-emerald-800 transition-colors"
                              >
                                <Layers className="w-5 h-5 text-emerald-300 mb-0.5" />
                                <span className="text-[11px] font-extrabold leading-tight">View All</span>
                                <span className="text-[9px] text-emerald-300 font-bold">{pictures.length} Photos</span>
                              </button>
                            </div>

                            {/* Full-Width Mobile Trigger Button */}
                            <button
                              onClick={() => openLightbox(pictures, 0, evt.title)}
                              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                            >
                              <Images className="w-4 h-4 text-emerald-400" />
                              <span>View All {pictures.length} Photos in Fullscreen</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Formatted Markdown Caption / Story (Placed below picture with Instagram-style 'see more') */}
                    {evt.description_markdown && (
                      <ExpandableEventDescription content={evt.description_markdown} eventTitle={evt.title} folderSlug={folderSlug} />
                    )}

                    {/* Event Card Like Bar */}
                    <div className="pt-4 border-t border-slate-100">
                      <EventLikeButton
                        eventId={evt.id}
                        eventTitle={evt.title}
                        currentUserId={currentUserId}
                      />
                    </div>
                  </div>
                </article>
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

/**
 * Expandable Instagram-style Markdown Description
 * Shows first lines with a subtle fade and "... see more" button,
 * expanding smoothly to reveal full rich markdown content.
 */
function ExpandableEventDescription({ content, eventTitle, folderSlug }: { content?: string; eventTitle?: string; folderSlug?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content || !content.trim()) return null;

  // Deem content long if it exceeds ~180 characters or has multiple line breaks/paragraphs
  const isLong =
    content.trim().length > 180 ||
    content.includes('\n\n') ||
    content.split('\n').filter(l => l.trim().length > 0).length > 2;

  return (
    <div className="bg-slate-50/75 border border-slate-100 rounded-2xl p-4 sm:p-5 transition-all">
      <div className="relative">
        <div
          className={`transition-all duration-300 ${
            !isExpanded && isLong ? 'max-h-20 sm:max-h-24 overflow-hidden' : ''
          }`}
        >
          <MarkdownView content={content} />
        </div>

        {/* Gradient fade overlay when collapsed and long */}
        {!isExpanded && isLong && (
          <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-slate-50/95 via-slate-50/60 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Instagram-style 'see more' / 'see less' toggle */}
      {isLong && (
        <div className="pt-2 flex items-center">
          <button
            type="button"
            onClick={() => {
              setIsExpanded(prev => {
                const next = !prev;
                if (next) {
                  trackEvent('event_description_expanded', `/events/${folderSlug || ''}`, {
                    event_title: eventTitle || '',
                  });
                }
                return next;
              });
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer py-0.5"
          >
            <span>{isExpanded ? 'see less' : '... see more'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-emerald-700" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
