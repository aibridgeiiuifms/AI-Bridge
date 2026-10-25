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
  Sparkles
} from 'lucide-react';
import { TrainingResource } from '@/types/database';

interface ResourceCardProps {
  resource: TrainingResource;
  isWatched: boolean;
  onToggleWatched: (resourceId: string) => void;
  onPreview: (resource: TrainingResource) => void;
  onCopyShareLink: (resource: TrainingResource) => void;
}

export default function ResourceCard({
  resource,
  isWatched,
  onToggleWatched,
  onPreview,
  onCopyShareLink,
}: ResourceCardProps) {
  const [copied, setCopied] = useState(false);

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
        };
      case 'video':
        return {
          icon: Video,
          label: 'Video Tutorial',
          badgeClass: 'bg-red-50 text-red-700 border-red-200',
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100/70',
          borderColor: 'hover:border-red-300',
        };
      case 'audio':
        return {
          icon: Headphones,
          label: 'Audio / Podcast',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
          iconColor: 'text-purple-600',
          iconBg: 'bg-purple-100/70',
          borderColor: 'hover:border-purple-300',
        };
      default:
        return {
          icon: Link2,
          label: 'Resource Link',
          badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
          iconColor: 'text-sky-600',
          iconBg: 'bg-sky-100/70',
          borderColor: 'hover:border-sky-300',
        };
    }
  };

  const theme = getTypeTheme();
  const Icon = theme.icon;

  const isNotebookLMLink = resource.url.includes('notebooklm.google.com') || resource.title.toLowerCase().includes('notebooklm');

  return (
    <div
      className={`group relative bg-white rounded-3xl border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden ${
        isWatched ? 'border-emerald-200/80 bg-gradient-to-b from-emerald-50/20 to-white' : 'border-slate-200 hover:border-slate-300'
      } ${theme.borderColor}`}
    >
      {/* Top Banner Ribbon if Watched or Special */}
      {isNotebookLMLink && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-bl-xl tracking-wider shadow-xs flex items-center gap-1 z-10">
          <Sparkles className="w-2.5 h-2.5" />
          <span>Core Tool</span>
        </div>
      )}

      {/* Main Card Body */}
      <div className="p-5 sm:p-6 space-y-3.5 flex-1 flex flex-col">
        {/* Header row: Icon & Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl ${theme.iconBg} flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105`}>
              <Icon className={`w-5 h-5 ${theme.iconColor}`} />
            </div>
            <div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${theme.badgeClass}`}>
                {theme.label}
              </span>
            </div>
          </div>

          {/* Watched Status Indicator */}
          <button
            type="button"
            onClick={handleToggle}
            className={`cursor-pointer transition-all p-1 rounded-xl ${
              isWatched ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
            }`}
            title={isWatched ? 'Watched! Click to unmark' : 'Mark as watched'}
          >
            {isWatched ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Title */}
        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors tracking-tight line-clamp-2 leading-snug">
          {resource.title}
        </h4>

        {/* Description */}
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-1">
          {resource.description || 'Access this essential learning resource to deepen your understanding.'}
        </p>

        {/* Watched status pill indicator */}
        <div className="pt-1 flex items-center justify-between text-[11px]">
          <span className="text-slate-600 font-medium truncate max-w-[170px]">
            {resource.module}
          </span>
          {isWatched ? (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3" />
              Completed
            </span>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              className="text-slate-600 hover:text-emerald-700 font-semibold cursor-pointer transition-colors"
            >
              Mark watched
            </button>
          )}
        </div>
      </div>

      {/* Card Footer / Action Bar */}
      <div className="p-3 sm:px-5 sm:py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Left Actions: Preview / Open */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onPreview(resource)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex-1 justify-center"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          <a
            href={resource.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
            title="Download or direct open"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>

        {/* Right Actions: Share Link */}
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
