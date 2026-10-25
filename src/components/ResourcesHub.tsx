'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  FileText,
  Video,
  Headphones,
  Link2,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  X
} from 'lucide-react';
import { TrainingResource, TrainingResourceType } from '@/types/database';
import ResourceCard from '@/components/ResourceCard';
import ResourcePreviewModal from '@/components/ResourcePreviewModal';
import SdgLoading from '@/components/SdgLoading';

const GUEST_WATCHED_KEY = 'ai_bridge_guest_watched_resources';

export default function ResourcesHub() {
  const [resources, setResources] = useState<TrainingResource[]>([]);
  const [watchedIds, setWatchedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | TrainingResourceType>('all');
  const [previewResource, setPreviewResource] = useState<TrainingResource | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch resources and initial watched status
  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/portal/resources');
      const data = await res.json();
      if (data.success) {
        setResources(data.resources || []);

        // Combine DB watched IDs with any guest localStorage fallback
        let serverWatched: string[] = data.watchedIds || [];
        try {
          const guestSaved = localStorage.getItem(GUEST_WATCHED_KEY);
          if (guestSaved) {
            const guestIds: string[] = JSON.parse(guestSaved);
            serverWatched = Array.from(new Set([...serverWatched, ...guestIds]));
          }
        } catch (e) {
          // Ignore localStorage errors
        }
        setWatchedIds(serverWatched);
      }
    } catch (err) {
      console.error('Failed to load training resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Show toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle Watched Status (Optimistic UI)
  const handleToggleWatched = async (resourceId: string) => {
    const isCurrentlyWatched = watchedIds.includes(resourceId);
    const updated = isCurrentlyWatched
      ? watchedIds.filter((id) => id !== resourceId)
      : [...watchedIds, resourceId];

    // Optimistic state update
    setWatchedIds(updated);

    // Save to guest localStorage fallback
    try {
      localStorage.setItem(GUEST_WATCHED_KEY, JSON.stringify(updated));
    } catch (e) {}

    // Synchronize with database
    try {
      const res = await fetch('/api/portal/resources/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_id: resourceId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.watched ? 'Resource marked as completed!' : 'Resource unmarked.');
      }
    } catch (err) {
      console.warn('Could not sync progress with server (using local state):', err);
    }
  };

  // Copy share link to clipboard
  const handleCopyShareLink = (resource: TrainingResource) => {
    const shareUrl = `${window.location.origin}/portal#resource-${resource.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast(`Copied link for "${resource.title}"!`);
      }).catch(() => {
        showToast('Link copied to clipboard!');
      });
    } else {
      showToast('Link copied!');
    }
  };

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (res.description && res.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        res.module.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'all' || res.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [resources, searchQuery, selectedType]);

  // Group by module (preserving module appearance order)
  const groupedModules = useMemo(() => {
    const map = new Map<string, TrainingResource[]>();
    for (const res of filteredResources) {
      const list = map.get(res.module) || [];
      list.push(res);
      map.set(res.module, list);
    }
    return Array.from(map.entries());
  }, [filteredResources]);

  // Type count helpers
  const counts = useMemo(() => {
    const total = resources.length;
    const pdfs = resources.filter((r) => r.type === 'pdf').length;
    const videos = resources.filter((r) => r.type === 'video').length;
    const links = resources.filter((r) => r.type === 'link').length;
    const audios = resources.filter((r) => r.type === 'audio').length;
    const completed = resources.filter((r) => watchedIds.includes(r.id)).length;
    return { total, pdfs, videos, links, audios, completed };
  }, [resources, watchedIds]);

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hub Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-100 pb-6">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full">
              <BookOpen className="w-3.5 h-3.5" />
              NotebookLM Study Hub
            </span>
            <span className="text-xs text-slate-500">• Hands-on Materials</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Learning Resources & Tutorials
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Access official NotebookLM walkthroughs, video masterclasses, source-grounding handbooks, and podcasts. Free for all enrolled participants.
          </p>
        </div>

        {/* NotebookLM Web App Direct Action Button & Progress */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl text-xs text-slate-600">
            Progress:{' '}
            <strong className="text-slate-900">
              {counts.completed} / {counts.total}
            </strong>{' '}
            <span className="text-[11px] text-slate-400">(optional)</span>
          </div>

          <a
            href="https://notebooklm.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-bold transition-all shadow-sm hover:shadow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch NotebookLM</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
        </div>
      </div>

      {/* Search Bar & Filter Chips */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources, topics, or keywords..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedType === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All ({counts.total})
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('video')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedType === 'video'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Videos ({counts.videos})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('pdf')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedType === 'pdf'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDFs ({counts.pdfs})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('link')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedType === 'link'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Links ({counts.links})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('audio')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedType === 'audio'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Audio ({counts.audios})</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 pt-4">
          <SdgLoading size={28} className="mx-auto" label="Loading learning resources" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 h-56 space-y-4">
                <div className="h-6 w-24 bg-slate-200 rounded-full" />
                <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
                <div className="h-14 w-full bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredResources.length === 0 && (
        <div className="py-12 px-4 text-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No resources found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No materials matched your filter &quot;{searchQuery}&quot;. Try adjusting your keywords or clearing the filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedType('all');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      )}

      {/* Modules List: All shown at once with separated headings */}
      {!loading && groupedModules.length > 0 && (
        <div className="space-y-8 pt-2">
          {groupedModules.map(([moduleName, moduleResources], index) => (
            <div key={moduleName} className="space-y-4">
              {/* Module Header Bar */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shadow-xs">
                    {index + 1}
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    {moduleName}
                  </h3>
                </div>
                <div className="h-px bg-slate-200 flex-1 ml-2" />
                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 shrink-0">
                  {moduleResources.length} {moduleResources.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                {moduleResources.map((resource) => (
                  <div key={resource.id} id={`resource-${resource.id}`} className="h-full flex w-full">
                    <ResourceCard
                      resource={resource}
                      isWatched={watchedIds.includes(resource.id)}
                      onToggleWatched={handleToggleWatched}
                      onPreview={(res) => setPreviewResource(res)}
                      onCopyShareLink={handleCopyShareLink}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <ResourcePreviewModal
        resource={previewResource}
        isOpen={Boolean(previewResource)}
        onClose={() => setPreviewResource(null)}
        isWatched={previewResource ? watchedIds.includes(previewResource.id) : false}
        onToggleWatched={handleToggleWatched}
        onCopyShareLink={handleCopyShareLink}
      />
    </section>
  );
}
