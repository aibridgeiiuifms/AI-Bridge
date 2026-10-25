'use client';

import { useState } from 'react';
import {
  FileText,
  Video,
  Headphones,
  Link2,
  ExternalLink,
  Download,
  Share2,
  CheckCircle2,
  Circle,
  Eye,
  Check,
  Sparkles,
  Play
} from 'lucide-react';
import { TrainingResource } from '@/types/database';

interface ResourceCardProps {
  resource: TrainingResource;
  isWatched: boolean;
  onToggleWatched: (resourceId: string) => void;
  onPreview: (resource: TrainingResource) => void;
  onCopyShareLink: (resource: TrainingResource) => void;
}

/**
 * Determines whether a resource can be downloaded.
 * Hides download button for YouTube videos, external web links, etc.
 */
function isDownloadableResource(res: TrainingResource): boolean {
  if (res.type === 'link') return false;

  const urlLower = (res.url || '').toLowerCase();
  // YouTube videos are stream-only and cannot be downloaded directly
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return false;
  if (urlLower.includes('notebooklm.google.com')) return false;

  // Supabase storage files are always downloadable
  if (res.storage_path) return true;

  // PDFs and audio files are downloadable documents
  if (res.type === 'pdf' || res.type === 'audio') return true;

  // Direct MP4 / WebM video files
  if (res.type === 'video' && (urlLower.endsWith('.mp4') || urlLower.endsWith('.webm'))) {
    return true;
  }

  return false;
}

/**
 * Extracts a YouTube video ID if URL is from YouTube.
 */
function getYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/watch')) return parsed.searchParams.get('v');
      if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/embed/')[1]?.split('?')[0] || null;
      if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/shorts/')[1]?.split('?')[0] || null;
    }
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('?')[0] || null;
    }
  } catch (e) {}
  return null;
}

/**
 * Gets thumbnail URL: custom admin thumbnail -> YouTube HQ thumbnail fallback -> null.
 */
function getResourceThumbnail(res: TrainingResource): string | null {
  if (res.thumbnail_url && res.thumbnail_url.trim()) {
    return res.thumbnail_url.trim();
  }
  const ytId = getYouTubeId(res.url);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  return null;
}

export default function ResourceCard({
  resource,
  isWatched,
  onToggleWatched,
  onPreview,
  onCopyShareLink,
}: ResourceCardProps) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyShareLink(resource);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWatched(resource.id);
  };

  const getTypeTheme = () => {
    switch (resource.type) {
      case 'pdf':
        return {
          icon: FileText,
          label: 'PDF Document',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          iconColor: 'text-rose-600',
          iconBg: 'bg-rose-100/70',
          borderColor: 'hover:border-rose-300',
          gradientBg: 'from-rose-500/10 via-rose-500/5 to-slate-50',
        };
      case 'video':
        return {
          icon: Video,
          label: 'Video Tutorial',
          badgeClass: 'bg-red-50 text-red-700 border-red-200',
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100/70',
          borderColor: 'hover:border-red-300',
          gradientBg: 'from-red-500/10 via-red-500/5 to-slate-50',
        };
      case 'audio':
        return {
          icon: Headphones,
          label: 'Audio / Podcast',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
          iconColor: 'text-purple-600',
          iconBg: 'bg-purple-100/70',
          borderColor: 'hover:border-purple-300',
          gradientBg: 'from-purple-500/10 via-purple-500/5 to-slate-50',
        };
      default:
        return {
          icon: Link2,
          label: 'Resource Link',
          badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
          iconColor: 'text-sky-600',
          iconBg: 'bg-sky-100/70',
          borderColor: 'hover:border-sky-300',
          gradientBg: 'from-sky-500/10 via-sky-500/5 to-slate-50',
        };
    }
  };

  const theme = getTypeTheme();
  const Icon = theme.icon;

  const isNotebookLMLink =
    resource.url.includes('notebooklm.google.com') ||
    resource.title.toLowerCase().includes('notebooklm');

  const isDownloadable = isDownloadableResource(resource);
  const thumbnailUrl = !imgError ? getResourceThumbnail(resource) : null;
  const isVideo = resource.type === 'video';

  return (
    <div
      className={`group relative bg-white rounded-3xl border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden h-full w-full ${
        isWatched
          ? 'border-emerald-200/90 bg-gradient-to-b from-emerald-50/20 to-white'
          : 'border-slate-200 hover:border-slate-300'
      } ${theme.borderColor}`}
    >
      {/* Top: Card Thumbnail / Cover Media */}
      <div 
        className="relative w-full aspect-[16/9] overflow-hidden bg-slate-100 border-b border-slate-100 shrink-0 cursor-pointer"
        onClick={() => onPreview(resource)}
      >
        {thumbnailUrl ? (
          <>
            <img
              src={thumbnailUrl}
              alt={resource.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Subtle dark gradient overlay on hover */}
            <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/25 transition-colors" />
          </>
        ) : (
          /* Stylized branded gradient cover placeholder */
          <div className={`w-full h-full bg-gradient-to-br ${theme.gradientBg} flex items-center justify-center p-6 transition-all group-hover:scale-102`}>
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 rounded-2xl ${theme.iconBg} flex items-center justify-center mx-auto shadow-xs`}>
                <Icon className={`w-6 h-6 ${theme.iconColor}`} />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {theme.label}
              </span>
            </div>
          </div>
        )}

        {/* Video Play Button Overlay */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-11 h-11 rounded-full bg-slate-950/60 backdrop-blur-xs text-white flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110 group-hover:bg-red-600">
              <Play className="w-5 h-5 ml-0.5 fill-current" />
            </div>
          </div>
        )}

        {/* Floating Top-Left Badge: Type */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-xs backdrop-blur-md bg-white/95 ${theme.badgeClass}`}>
            <Icon className={`w-3.5 h-3.5 ${theme.iconColor}`} />
            <span>{theme.label}</span>
          </span>
        </div>

        {/* Floating Top-Right Badges: Core Tool & Watched Toggle */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
          {isNotebookLMLink && (
            <span className="bg-emerald-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-xs backdrop-blur-md flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Core Tool</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleToggle}
            className={`cursor-pointer transition-all p-1.5 rounded-full shadow-xs backdrop-blur-md ${
              isWatched
                ? 'text-emerald-700 bg-white/95 hover:bg-white'
                : 'text-slate-400 bg-white/90 hover:text-slate-700 hover:bg-white'
            }`}
            title={isWatched ? 'Completed! Click to unmark' : 'Mark as completed'}
          >
            {isWatched ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Middle: Content with Fixed Consistent Heights */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Title - fixed 2-line height */}
          <h4
            className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors tracking-tight line-clamp-2 leading-snug min-h-[2.6rem]"
            title={resource.title}
          >
            {resource.title}
          </h4>

          {/* Description - fixed 2-line height */}
          <p
            className="text-xs text-slate-500 leading-relaxed line-clamp-2 min-h-[2.25rem]"
            title={resource.description || ''}
          >
            {resource.description || 'Access this essential learning resource to deepen your understanding.'}
          </p>
        </div>

        {/* Module tag and completion status */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] mt-auto">
          <span className="text-slate-600 font-medium truncate max-w-[170px]" title={resource.module}>
            {resource.module}
          </span>
          {isWatched ? (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
              <Check className="w-3 h-3" />
              Completed
            </span>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              className="text-slate-600 hover:text-emerald-700 font-semibold cursor-pointer transition-colors shrink-0"
            >
              Mark watched
            </button>
          )}
        </div>
      </div>

      {/* Footer / Action Bar */}
      <div className="p-3 sm:px-5 sm:py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onPreview(resource)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex-1 justify-center"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          {/* Download button: ONLY rendered if resource is actually downloadable! */}
          {isDownloadable && (
            <a
              href={resource.url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-colors shrink-0"
              title="Download resource file"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Share Link Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer shrink-0"
          title={copied ? 'Link copied!' : 'Copy share link'}
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
