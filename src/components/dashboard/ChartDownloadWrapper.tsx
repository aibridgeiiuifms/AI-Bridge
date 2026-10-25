'use client';

import React, { useRef, useState } from 'react';
import { Download, Image as ImageIcon, FileSpreadsheet, Check, Sparkles } from 'lucide-react';
import { toPng, toSvg } from 'html-to-image';
import SdgLoading from '@/components/SdgLoading';

interface ChartDownloadWrapperProps {
  id: string;
  title: string;
  subtitle?: string;
  dataForCsv?: Record<string, any>[];
  allowDownload?: boolean;
  children: React.ReactNode;
}

export default function ChartDownloadWrapper({
  id,
  title,
  subtitle,
  dataForCsv,
  allowDownload = true,
  children,
}: ChartDownloadWrapperProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<'png' | 'csv' | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadImage = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading('png');
    try {
      // Small delay to allow fonts and layout to settle
      await new Promise(res => setTimeout(res, 100));

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        filter: (node) => {
          // Exclude export buttons from the exported image
          return !(node as HTMLElement)?.classList?.contains('no-export');
        },
      });

      const filename = `AI-Bridge-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess('PNG Saved');
      setTimeout(() => setDownloadSuccess(null), 2500);
    } catch (err) {
      console.error('Failed to export chart image:', err);
      alert('Could not export image. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadCsv = () => {
    if (!dataForCsv || dataForCsv.length === 0 || downloading) return;
    setDownloading('csv');
    try {
      const headers = Object.keys(dataForCsv[0]);
      const csvRows = [
        headers.join(','),
        ...dataForCsv.map((row) =>
          headers
            .map((field) => {
              const val = row[field] ?? '';
              const escaped = String(val).replace(/"/g, '""');
              return `"${escaped}"`;
            })
            .join(',')
        ),
      ];

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
      const filename = `AI-Bridge-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-data.csv`;
      const link = document.createElement('a');
      link.setAttribute('href', csvContent);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess('CSV Exported');
      setTimeout(() => setDownloadSuccess(null), 2500);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      alert('Could not export CSV.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div
      ref={cardRef}
      id={id}
      className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all text-slate-900"
    >
      {/* Official Header Bar (Captured in PNG download) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight truncate">
              {title}
            </h3>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {/* Download & Export Controls (Hidden inside PNG capture) */}
        {allowDownload && (
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto no-export">
            {downloadSuccess && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 animate-fade-in">
                <Check className="w-3 h-3 text-emerald-700" />
                <span>{downloadSuccess}</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={Boolean(downloading)}
              title="Download High-Res PNG Image"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer disabled:opacity-50"
            >
              {downloading === 'png' ? (
                <SdgLoading size={14} label="Preparing chart image" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span className="hidden sm:inline">Image (PNG)</span>
              <span className="sm:hidden">PNG</span>
            </button>

            {dataForCsv && dataForCsv.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={Boolean(downloading)}
                title="Download CSV Raw Data"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer disabled:opacity-50"
              >
                {downloading === 'csv' ? (
                  <SdgLoading size={14} label="Preparing CSV download" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
                )}
                <span className="hidden sm:inline">Data (CSV)</span>
                <span className="sm:hidden">CSV</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Visual Content */}
      <div className="relative">
        {children}
      </div>

      {/* Watermark in Downloaded PNG */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
        <span>The AI Bridge · Faculty of Management Sciences · IIUI</span>
        <span>Live Verified Assessment Data</span>
      </div>
    </div>
  );
}
