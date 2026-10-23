'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Folder,
  Calendar,
  MapPin,
  ExternalLink,
  Search,
  Layers,
  ArrowRight,
  ImageIcon,
  Images,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { fetchPublishedFolders, fetchFolderWithEventsBySlug } from '@/lib/gallery';
import { GalleryFolderWithEvents, GalleryPictureWithTags } from '@/types/database';
import EventsSkeleton from '@/components/skeletons/EventsSkeleton';
import MarkdownView from '@/components/MarkdownView';
import GalleryLightbox from '@/components/gallery/GalleryLightbox';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function EventsSection() {
  const [folders, setFolders] = useState<GalleryFolderWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Album Drawer / Modal state
  const [activeFolder, setActiveFolder] = useState<GalleryFolderWithEvents | null>(null);
  const [loadingFolderDetails, setLoadingFolderDetails] = useState(false);

  // Fullscreen photo lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPictures, setLightboxPictures] = useState<GalleryPictureWithTags[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxEventTitle, setLightboxEventTitle] = useState('');

  useEffect(() => {
    async function loadFolders() {
      setLoading(true);
      try {
        const data = await fetchPublishedFolders();
        setFolders(data);
      } catch (err) {
        console.error('Failed to load event folders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFolders();
  }, []);

  const handleOpenAlbum = useCallback(async (folder: GalleryFolderWithEvents) => {
    setActiveFolder(folder);
    if (!folder.events || folder.events.length === 0) {
      setLoadingFolderDetails(true);
      try {
        const fullFolder = await fetchFolderWithEventsBySlug(folder.slug);
        if (fullFolder) {
          setActiveFolder(fullFolder);
        }
      } catch (err) {
        console.error('Failed to load album events:', err);
      } finally {
        setLoadingFolderDetails(false);
      }
    }
  }, []);

  const handleCloseAlbum = useCallback(() => {
    setActiveFolder(null);
  }, []);

  // Lock body scroll when album modal is open
  useEffect(() => {
    if (!activeFolder || lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseAlbum();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeFolder, lightboxOpen, handleCloseAlbum]);

  const openLightbox = (
    pictures: GalleryPictureWithTags[],
    index: number,
    eventTitle: string
  ) => {
    setLightboxPictures(pictures);
    setLightboxIndex(index);
    setLightboxEventTitle(eventTitle);
    setLightboxOpen(true);
  };

  const filteredFolders = folders.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.title.toLowerCase().includes(q) ||
      (f.description && f.description.toLowerCase().includes(q))
    );
  });

  return (
    <section
      id="events"
      className="py-16 sm:py-20 lg:py-24 bg-[#F8F7F4] border-b border-[#E2DFD7]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header & Search */}
        <ScrollReveal className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F4C3A] bg-[#E6F0EC] px-3.5 py-1 rounded-full border border-[#C3DCD2]">
            Campaign Evidence &amp; Photographic Archive
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Events &amp; Institutional Gallery
          </h2>
          <p className="text-sm sm:text-base text-[#334155] leading-relaxed max-w-2xl mx-auto">
            Explore photographic archives and documented operational evidence from workshops, campus awareness drives, and SDG sessions at IIUI Islamabad.
          </p>

          <div className="pt-2 max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search albums by title or topic..."
              aria-label="Search event albums"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-xs sm:text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C3A] shadow-2xs transition-all"
            />
          </div>
        </ScrollReveal>

        {/* Folders Grid */}
        {loading ? (
          <EventsSkeleton />
        ) : filteredFolders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2DFD7] p-12 text-center space-y-4 max-w-lg mx-auto">
            <Folder className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-[#0F172A]">No Albums Found</h3>
            <p className="text-xs text-[#64748B]">
              {searchQuery
                ? 'No event folders matched your search term.'
                : 'No event albums have been published yet.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-[#0F4C3A] hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredFolders.map((folder, idx) => {
              const eventCount = folder.events_count ?? (folder.events?.length || 0);

              return (
                <ScrollReveal key={folder.id} delay={idx * 0.06} className="h-full">
                  <button
                    type="button"
                    onClick={() => handleOpenAlbum(folder)}
                    className="w-full h-full text-left group bg-white rounded-2xl border border-[#E2DFD7] shadow-xs hover:shadow-lg hover:border-[#0F4C3A]/50 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer hover:-translate-y-1"
                  >
                    <div className="w-full">
                      {/* Folder Cover Thumbnail */}
                      <div className="relative h-52 w-full overflow-hidden bg-[#F1EFEA]">
                        <Image
                          src={folder.thumbnail_url}
                          alt={folder.title}
                          fill
                          loading="lazy"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-[#0F172A]/25 group-hover:bg-[#0F172A]/15 transition-colors" />

                        {/* Event Count Pill */}
                        <div className="absolute top-3.5 right-3.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white text-[#0F172A] shadow-xs">
                            <ImageIcon className="w-3 h-3 text-[#0F4C3A]" />
                            <span>
                              {eventCount} {eventCount === 1 ? 'Event' : 'Events'}
                            </span>
                          </span>
                        </div>

                        {/* Folder Badge Indicator */}
                        <div className="absolute bottom-3 left-3.5">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-[#0F4C3A] text-white">
                            <Folder className="w-3 h-3 text-[#EAD1A7]" />
                            <span>Interactive Album</span>
                          </span>
                        </div>
                      </div>

                      {/* Folder Content Body */}
                      <div className="p-6 space-y-2.5">
                        <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] group-hover:text-[#0F4C3A] transition-colors leading-snug">
                          {folder.title}
                        </h3>
                        {folder.description && (
                          <p className="text-xs sm:text-sm text-[#334155] line-clamp-3 leading-relaxed">
                            {folder.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Folder Footer Action */}
                    <div className="w-full p-6 pt-0 border-t border-[#F1EFEA] mt-4">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#0F4C3A] pt-3.5">
                        <span>Open Album &amp; Photos</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#0F4C3A]" />
                      </div>
                    </div>
                  </button>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Album Modal / Drawer */}
      {activeFolder && (
        <div
          className="fixed inset-0 z-50 bg-[#0F172A]/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 overflow-hidden animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={activeFolder.title}
          onClick={handleCloseAlbum}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] bg-[#F8F7F4] rounded-2xl sm:rounded-3xl border border-[#E2DFD7] shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Sticky Header */}
            <div className="bg-[#0F4C3A] text-white px-5 py-4 sm:px-8 sm:py-5 flex items-center justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#EAD1A7]">
                  <Folder className="w-3.5 h-3.5" />
                  <span>Campaign Event Album</span>
                </div>
                <h3 className="text-lg sm:text-2xl font-extrabold text-white truncate mt-0.5">
                  {activeFolder.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCloseAlbum}
                aria-label="Close album modal"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
              {activeFolder.description && (
                <p className="text-sm sm:text-base text-[#334155] bg-white p-4 sm:p-5 rounded-2xl border border-[#E2DFD7]">
                  {activeFolder.description}
                </p>
              )}

              {loadingFolderDetails ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-9 h-9 border-3 border-[#0F4C3A] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-[#64748B]">
                    Loading event documentation and photographs...
                  </p>
                </div>
              ) : !activeFolder.events || activeFolder.events.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E2DFD7] p-12 text-center space-y-2">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-base font-bold text-[#0F172A]">No Events Added Yet</h4>
                  <p className="text-xs text-[#64748B]">
                    Photographs and documentation for this album will appear here soon.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {activeFolder.events.map((evt, idx) => {
                    const pictures = evt.pictures || [];
                    const coverPic = pictures.find((p) => p.is_cover) || pictures[0];
                    const remainingPics = pictures.filter((p) => p.id !== coverPic?.id);

                    return (
                      <article
                        key={evt.id || idx}
                        className="bg-white rounded-2xl border border-[#E2DFD7] shadow-xs overflow-hidden"
                      >
                        <div className="h-1.5 bg-[#0F4C3A]" />
                        <div className="p-5 sm:p-8 space-y-6">
                          {/* Metadata Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1EFEA] pb-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-extrabold text-[#0F4C3A] bg-[#E6F0EC] px-2.5 py-1 rounded-lg border border-[#C3DCD2]">
                                Event #{idx + 1}
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#334155] bg-[#F1EFEA] px-3 py-1 rounded-lg">
                                <MapPin className="w-3.5 h-3.5 text-[#0F4C3A] shrink-0" />
                                <span>{evt.location}</span>
                              </span>
                              {evt.is_date_visible && evt.event_date && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#334155] bg-[#F1EFEA] px-3 py-1 rounded-lg">
                                  <Calendar className="w-3.5 h-3.5 text-[#0F4C3A] shrink-0" />
                                  <span>
                                    {new Date(evt.event_date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      timeZone: 'UTC',
                                    })}
                                  </span>
                                </span>
                              )}
                            </div>

                            {evt.external_links && evt.external_links.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2">
                                {evt.external_links.map((link, lIdx) => (
                                  <a
                                    key={lIdx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0F4C3A] bg-[#E6F0EC] hover:bg-[#C3DCD2] px-2.5 py-1 rounded-lg transition-colors"
                                  >
                                    <span>{link.label}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>

                          <h4 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
                            {evt.title}
                          </h4>

                          {/* Pictures Grid */}
                          {pictures.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                                  <ImageIcon className="w-3.5 h-3.5 text-[#0F4C3A]" />
                                  Photo Showcase ({pictures.length}{' '}
                                  {pictures.length === 1 ? 'Photo' : 'Photos'})
                                </span>
                                {pictures.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => openLightbox(pictures, 0, evt.title)}
                                    className="text-xs font-bold text-[#0F4C3A] bg-[#E6F0EC] hover:bg-[#C3DCD2] px-3 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Layers className="w-3.5 h-3.5" />
                                    <span>Open Fullscreen Lightbox ({pictures.length})</span>
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {coverPic && (
                                  <div
                                    onClick={() => openLightbox(pictures, 0, evt.title)}
                                    className="relative h-60 sm:h-72 sm:col-span-2 rounded-2xl overflow-hidden cursor-pointer group border border-[#E2DFD7]"
                                  >
                                    <Image
                                      src={coverPic.image_url}
                                      alt={coverPic.caption || evt.title}
                                      fill
                                      sizes="(max-width: 768px) 100vw, 600px"
                                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-[#0F172A]/40 group-hover:bg-[#0F172A]/30 transition-colors" />
                                    {pictures.length > 1 && (
                                      <div className="absolute top-3 right-3">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F172A]/85 text-white text-xs font-bold">
                                          <Images className="w-3.5 h-3.5 text-[#EAD1A7]" />
                                          <span>{pictures.length} Photos</span>
                                        </span>
                                      </div>
                                    )}
                                    {coverPic.caption && (
                                      <div className="absolute bottom-3 left-3 right-3 bg-[#0F172A]/80 backdrop-blur-xs px-3 py-2 rounded-xl text-white">
                                        <p className="text-xs font-medium truncate">
                                          {coverPic.caption}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="hidden sm:grid sm:grid-cols-1 gap-3">
                                  {remainingPics.slice(0, 2).map((pic, pIdx) => {
                                    const actualIndex = pictures.findIndex(
                                      (p) => p.id === pic.id
                                    );
                                    const isLastVisible =
                                      pIdx === 1 && remainingPics.length > 2;
                                    const extraCount = remainingPics.length - 2;

                                    return (
                                      <div
                                        key={pic.id || pIdx}
                                        onClick={() =>
                                          openLightbox(pictures, actualIndex, evt.title)
                                        }
                                        className="relative sm:h-[138px] rounded-2xl overflow-hidden cursor-pointer group border border-[#E2DFD7]"
                                      >
                                        <Image
                                          src={pic.image_url}
                                          alt={pic.caption || `Photo ${actualIndex + 1}`}
                                          fill
                                          sizes="300px"
                                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        {isLastVisible && extraCount > 0 && (
                                          <div className="absolute inset-0 bg-[#0F172A]/80 flex items-center justify-center text-white text-center p-2">
                                            <div>
                                              <span className="text-lg font-extrabold block">
                                                +{extraCount}
                                              </span>
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
                            </div>
                          )}

                          {/* Expandable Markdown Story */}
                          {evt.description_markdown && (
                            <ExpandableMarkdown content={evt.description_markdown} />
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-white border-t border-[#E2DFD7] px-5 py-3.5 sm:px-8 flex items-center justify-between text-xs shrink-0">
              <span className="text-[#64748B] font-medium">
                IIUI FMS • Campaign Evidence Archive
              </span>
              <button
                type="button"
                onClick={handleCloseAlbum}
                className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold transition-colors cursor-pointer"
              >
                Close Album
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox */}
      <GalleryLightbox
        pictures={lightboxPictures}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        eventTitle={lightboxEventTitle}
      />
    </section>
  );
}

function ExpandableMarkdown({ content }: { content?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content || !content.trim()) return null;

  const isLong =
    content.trim().length > 180 ||
    content.includes('\n\n') ||
    content.split('\n').filter((l) => l.trim().length > 0).length > 2;

  return (
    <div className="bg-[#F8F7F4] border border-[#E2DFD7] rounded-2xl p-4 sm:p-5">
      <div
        className={`transition-all duration-300 ${
          !isExpanded && isLong ? 'max-h-24 overflow-hidden' : ''
        }`}
      >
        <MarkdownView content={content} />
      </div>

      {isLong && (
        <div className="pt-2.5 flex items-center border-t border-[#E2DFD7] mt-2.5">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0F4C3A] hover:text-[#093528] transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Show less' : 'Read full event report'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

