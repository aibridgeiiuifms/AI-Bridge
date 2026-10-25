'use client';

import { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Download,
  Share2,
  CheckCircle2,
  Circle,
  FileText,
  Video,
  Headphones,
  Link2,
  Copy,
  Check,
  Maximize2
} from 'lucide-react';
import { TrainingResource } from '@/types/database';

interface ResourcePreviewModalProps {
  resource: TrainingResource | null;
  isOpen: boolean;
  onClose: () => void;
  isWatched: boolean;
  onToggleWatched: (resourceId: string) => void;
  onCopyShareLink: (resource: TrainingResource) => void;
}

/**
 * Extracts a YouTube video ID from various YouTube URL formats.
 */
function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/watch')) {
        return parsed.searchParams.get('v');
      }
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.split('/embed/')[1]?.split('?')[0] || null;
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/shorts/')[1]?.split('?')[0] || null;
      }
    }
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('?')[0] || null;
    }
  } catch (e) {
    // Non-URL or malformed
  }
  return null;
}

/**
 * Determines whether a resource can be downloaded.
 */
function isDownloadableResource(res: TrainingResource): boolean {
  if (res.type === 'link') return false;
  const urlLower = (res.url || '').toLowerCase();
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return false;
  if (urlLower.includes('notebooklm.google.com')) return false;
  if (res.storage_path) return true;
  if (res.type === 'pdf' || res.type === 'audio') return true;
  if (res.type === 'video' && (urlLower.endsWith('.mp4') || urlLower.endsWith('.webm'))) return true;
  return false;
}

export default function ResourcePreviewModal({
  resource,
  isOpen,
  onClose,
  isWatched,
  onToggleWatched,
  onCopyShareLink,
}: ResourcePreviewModalProps) {
  const [copied, setCopied] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !resource) return null;

  const youtubeId = resource.type === 'video' ? getYouTubeVideoId(resource.url) : null;
  const isDirectVideo = resource.type === 'video' && !youtubeId;

  const handleCopy = () => {
    onCopyShareLink(resource);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getTypeBadge = () => {
    switch (resource.type) {
      case 'pdf':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            PDF Document
          </span>
        );
      case 'video':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <Video className="w-3.5 h-3.5 text-red-600" />
            Video Tutorial
          </span>
        );
      case 'audio':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Headphones className="w-3.5 h-3.5 text-purple-600" />
            Audio / Podcast
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Link2 className="w-3.5 h-3.5 text-sky-600" />
            Resource Link
          </span>
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/70">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {getTypeBadge()}
              <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                {resource.module}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
              {resource.title}
            </h3>
            {resource.description && (
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {resource.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
              title="Open in new window"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content / Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/5">
          {/* PDF Preview */}
          {resource.type === 'pdf' && (
            <div className="space-y-3">
              <div className="w-full h-[62vh] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-inner">
                <iframe
                  src={`${resource.url}#toolbar=1&navpanes=0`}
                  title={resource.title}
                  className="w-full h-full border-0"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600">
                <span>Having trouble previewing this document in your browser?</span>
                <a
                  href={resource.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  Open / Download PDF directly
                </a>
              </div>
            </div>
          )}

          {/* Video Preview: YouTube */}
          {resource.type === 'video' && youtubeId && (
            <div className="space-y-3">
              <div className="relative w-full pb-[56.25%] rounded-2xl overflow-hidden bg-black shadow-lg">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                  title={resource.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
              <div className="text-right">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-700"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Watch on YouTube
                </a>
              </div>
            </div>
          )}

          {/* Video Preview: Direct MP4 */}
          {resource.type === 'video' && isDirectVideo && (
            <div className="w-full rounded-2xl overflow-hidden bg-black shadow-lg">
              <video
                controls
                autoPlay
                src={resource.url}
                className="w-full max-h-[62vh] bg-black"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Audio Preview */}
          {resource.type === 'audio' && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm max-w-xl mx-auto text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-inner">
                <Headphones className="w-10 h-10 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-extrabold text-slate-900">{resource.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                  {resource.description || 'Audio Overview & Deep Dive Discussion powered by NotebookLM.'}
                </p>
              </div>

              {/* HTML5 Audio Player */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl">
                <audio
                  controls
                  autoPlay
                  src={resource.url}
                  className="w-full"
                >
                  Your browser does not support the audio element.
                </audio>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <a
                  href={resource.url}
                  download
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Audio File
                </a>
              </div>
            </div>
          )}

          {/* Link Preview */}
          {resource.type === 'link' && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm max-w-xl mx-auto text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto shadow-inner">
                <Link2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-extrabold text-slate-900">{resource.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                  {resource.description || 'External learning material and tools.'}
                </p>
                <div className="pt-2">
                  <span className="font-mono text-xs text-sky-700 bg-sky-50 px-3 py-1 rounded-xl border border-sky-200 inline-block break-all max-w-full">
                    {resource.url}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <span>Launch / Visit Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          {/* Watched Status Toggle */}
          <button
            type="button"
            onClick={() => onToggleWatched(resource.id)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isWatched
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
            }`}
          >
            {isWatched ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Marked as Watched</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 text-slate-400" />
                <span>Mark as Watched</span>
              </>
            )}
          </button>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            {isDownloadableResource(resource) ? (
              <a
                href={resource.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download / Save</span>
              </a>
            ) : (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{resource.type === 'video' ? 'Watch on YouTube' : 'Open Link'}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
