'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Folder, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Search, 
  Layers, 
  ArrowRight,
  ImageIcon
} from 'lucide-react';
import { fetchPublishedFolders } from '@/lib/gallery';
import { GalleryFolderWithEvents } from '@/types/database';

export default function EventsGalleryPage() {
  const [folders, setFolders] = useState<GalleryFolderWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadFolders() {
      setLoading(true);
      try {
        const data = await fetchPublishedFolders();
        setFolders(data);
      } catch (err) {
        console.error('Failed to load folders:', err);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/60 py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100/80 px-3.5 py-1 rounded-full border border-emerald-200/80 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          Campaign Evidence & Photographic Archive
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Events & Institutional Gallery
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Explore photographic archives and documented operational evidence from workshops, campus awareness sessions, and SDG campaigns at IIUI Islamabad.
        </p>

        {/* Search Bar */}
        <div className="pt-4 max-w-md mx-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search albums by title or topic..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* Folders Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div 
                key={n} 
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm animate-pulse flex flex-col justify-between h-96"
              >
                <div className="h-48 bg-slate-200" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
                <div className="p-6 pt-0">
                  <div className="h-8 bg-slate-200 rounded-xl w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredFolders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto">
            <Folder className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Albums Found</h3>
            <p className="text-xs text-slate-500">
              {searchQuery ? 'No event folders matched your search term.' : 'No event albums have been published yet.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFolders.map((folder) => {
              const eventCount = folder.events_count ?? (folder.events?.length || 0);

              return (
                <Link
                  key={folder.id}
                  href={`/events/${folder.slug}`}
                  className="group bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300/80 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer hover:-translate-y-1"
                >
                  <div>
                    {/* Folder Cover Thumbnail */}
                    <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                      <Image
                        src={folder.thumbnail_url}
                        alt={folder.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                      {/* Event Count Pill */}
                      <div className="absolute top-3.5 right-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-900 shadow-2xs">
                          <ImageIcon className="w-3 h-3 text-emerald-700" />
                          <span>{eventCount} {eventCount === 1 ? 'Event' : 'Events'}</span>
                        </span>
                      </div>

                      {/* Folder Badge Indicator */}
                      <div className="absolute bottom-3 left-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md text-emerald-200 border border-emerald-400/30">
                          <Folder className="w-3 h-3 text-emerald-400" />
                          <span>Album</span>
                        </span>
                      </div>
                    </div>

                    {/* Folder Content Body */}
                    <div className="p-6 space-y-2.5">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug">
                        {folder.title}
                      </h2>
                      {folder.description && (
                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                          {folder.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Folder Footer Action */}
                  <div className="p-6 pt-0 border-t border-slate-100 mt-4">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800 group-hover:text-emerald-900 pt-3.5">
                      <span>Explore Album</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform text-emerald-700" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
