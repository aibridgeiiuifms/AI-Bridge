'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Image as ImageIcon, FileSpreadsheet, Check, X, Download, Layers, CheckSquare, Square, Sparkles } from 'lucide-react';
import { toPng } from 'html-to-image';
import SdgLoading from '@/components/SdgLoading';
import { ChartDataHelpButton } from '@/components/dashboard/ChartDataHelp';

export interface SelectableCardItem {
  id: string;
  label: string;
  index: number;
  baselinePre?: number;
  postTraining?: number;
  gain?: number;
  prePct?: number;
  postPct?: number;
}

interface ChartDownloadWrapperProps {
  id: string;
  title: string;
  subtitle?: string;
  dataForCsv?: Record<string, any>[];
  allowDownload?: boolean;
  tab?: string;
  selectableCards?: SelectableCardItem[];
  children: React.ReactNode;
}

export default function ChartDownloadWrapper({
  id,
  title,
  subtitle,
  dataForCsv,
  allowDownload = true,
  tab,
  selectableCards,
  children,
}: ChartDownloadWrapperProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const exportCanvasRef = useRef<HTMLDivElement>(null);
  const singleCanvasRef = useRef<HTMLDivElement>(null);

  const [downloading, setDownloading] = useState<'png' | 'csv' | 'custom' | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Selected card indices (1-based index)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [activeSingleCard, setActiveSingleItem] = useState<SelectableCardItem | null>(null);

  useEffect(() => {
    setIsMounted(true);
    if (selectableCards && selectableCards.length > 0) {
      setSelectedIndices(selectableCards.map((c) => c.index));
    }
  }, [selectableCards]);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Standard full-card PNG capture
  const handleDownloadStandardPng = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading('png');
    try {
      await new Promise((res) => setTimeout(res, 100));

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        filter: (node) => {
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

  // Main click handler on "Image (PNG)" button
  const handleImageButtonClick = () => {
    if (selectableCards && selectableCards.length > 0) {
      setIsModalOpen(true);
    } else {
      handleDownloadStandardPng();
    }
  };

  // Combined selected cards capture (guaranteed perfect desktop alignment)
  const handleDownloadCombined = async (itemsToDownload: SelectableCardItem[]) => {
    if (!exportCanvasRef.current || downloading || itemsToDownload.length === 0) return;
    setDownloading('custom');
    try {
      await new Promise((res) => setTimeout(res, 120));

      const dataUrl = await toPng(exportCanvasRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const idxStr = itemsToDownload.map((it) => it.index).join('-');
      const filename = `AI-Bridge-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-selected-[${idxStr}].png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess('Combined Image Saved');
      setIsModalOpen(false);
      setTimeout(() => setDownloadSuccess(null), 2500);
    } catch (err) {
      console.error('Failed to export combined image:', err);
      alert('Could not export image. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  // Separate individual card downloads (downloads each selected card as its own PNG)
  const handleDownloadSeparately = async (itemsToDownload: SelectableCardItem[]) => {
    if (downloading || itemsToDownload.length === 0) return;
    setDownloading('custom');
    try {
      for (let i = 0; i < itemsToDownload.length; i++) {
        const item = itemsToDownload[i];
        setActiveSingleItem(item);
        // Wait for single canvas DOM to re-render
        await new Promise((res) => setTimeout(res, 150));

        if (singleCanvasRef.current) {
          const dataUrl = await toPng(singleCanvasRef.current, {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
          });

          const filename = `AI-Bridge-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-card-${item.index}-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
          const link = document.createElement('a');
          link.download = filename;
          link.href = dataUrl;
          link.click();
        }
      }

      setDownloadSuccess(`${itemsToDownload.length} Images Saved`);
      setIsModalOpen(false);
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to export cards separately:', err);
      alert('Could not export cards. Please try again.');
    } finally {
      setDownloading(null);
      setActiveSingleItem(null);
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

  const toggleIndex = (idx: number) => {
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx].sort((a, b) => a - b)
    );
  };

  const selectAll = () => {
    if (selectableCards) {
      setSelectedIndices(selectableCards.map((c) => c.index));
    }
  };

  const clearAll = () => {
    setSelectedIndices([]);
  };

  const setPreset145 = () => {
    setSelectedIndices([1, 4, 5]);
  };

  const currentSelectedItems = (selectableCards || []).filter((c) =>
    selectedIndices.includes(c.index)
  );

  return (
    <div
      ref={cardRef}
      id={id}
      data-chart-wrapper="true"
      data-chart-id={id}
      data-chart-title={title}
      data-chart-subtitle={subtitle || ''}
      data-tab={tab || ''}
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

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <ChartDataHelpButton sourceId={id} />

          {/* Download & Export Controls (Hidden inside PNG capture) */}
          {allowDownload && (
            <div className="flex items-center gap-2 no-export">
              {downloadSuccess && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 animate-fade-in">
                  <Check className="w-3 h-3 text-emerald-700" />
                  <span>{downloadSuccess}</span>
                </span>
              )}

              <button
                type="button"
                onClick={handleImageButtonClick}
                disabled={Boolean(downloading)}
                title={
                  selectableCards && selectableCards.length > 0
                    ? 'Export All 5 or Select Specific Cards (1, 4, 5...)'
                    : 'Download High-Res PNG Image'
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer disabled:opacity-50"
              >
                {downloading === 'png' || downloading === 'custom' ? (
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
      </div>

      {/* Main Visual Content */}
      <div className="relative">{children}</div>

      {/* Watermark in Downloaded PNG */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
        <span>The AI Bridge · Faculty of Management Sciences · IIUI</span>
        <span>Live Verified Assessment Data</span>
      </div>

      {/* =========================================================================
          CUSTOM EXPORT MODAL: SELECT ALL 5 OR SELECT INDIVIDUAL (1, 4, 5, etc.)
         ========================================================================= */}
      {isMounted && isModalOpen && selectableCards && selectableCards.length > 0 &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setIsModalOpen(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="export-options-title"
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    Custom Image Export Studio
                  </div>
                  <h2 id="export-options-title" className="mt-1.5 text-lg font-black text-slate-900">
                    Export Student Impact Dimensions (PNG)
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Download all 5 dimensions combined, choose specific cards (e.g. 1, 4, 5), or save each card separately.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Selection Controls & Quick Presets */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <span className="text-xs font-bold text-slate-700">
                  Selected: <span className="text-emerald-700 font-black">{currentSelectedItems.length}</span> of {selectableCards.length}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    Select All (5)
                  </button>
                  <button
                    type="button"
                    onClick={setPreset145}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
                  >
                    Preset: 1, 4 & 5
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Interactive Card Selection List */}
              <div className="mt-4 space-y-2">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Select dimensions to include:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectableCards.map((item) => {
                    const isChecked = selectedIndices.includes(item.index);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleIndex(item.index)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-400 shadow-xs ring-1 ring-emerald-300'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="text-emerald-600 shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                #{item.index}
                              </span>
                              <p className="text-xs font-black text-slate-800 truncate">{item.label}</p>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                              Pre: {item.baselinePre}% → Post: {item.postTraining}%
                            </p>
                          </div>
                        </div>

                        {item.gain !== undefined && (
                          <span className="shrink-0 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full ml-2">
                            +{item.gain}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>

                <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
                  {/* Download Separately */}
                  <button
                    type="button"
                    onClick={() => handleDownloadSeparately(currentSelectedItems)}
                    disabled={currentSelectedItems.length === 0 || Boolean(downloading)}
                    title="Download each selected card as its own individual PNG file"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-all border border-slate-200 cursor-pointer disabled:opacity-40"
                  >
                    <Layers className="w-3.5 h-3.5 text-slate-600" />
                    <span>Download Separately ({currentSelectedItems.length})</span>
                  </button>

                  {/* Download Combined Aligned */}
                  <button
                    type="button"
                    onClick={() => handleDownloadCombined(currentSelectedItems)}
                    disabled={currentSelectedItems.length === 0 || Boolean(downloading)}
                    title="Download a single combined high-res PNG image with perfect alignment"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-40"
                  >
                    {downloading === 'custom' ? (
                      <SdgLoading size={14} label="Rendering image..." />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-white" />
                    )}
                    <span>Download Combined ({currentSelectedItems.length})</span>
                  </button>
                </div>
              </div>
            </section>
          </div>,
          document.body
        )}

      {/* =========================================================================
          OFF-SCREEN DEDICATED EXPORT CONTAINER: PERFECTLY ALIGNED COMBINED PNG
         ========================================================================= */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none' }}>
        <div
          ref={exportCanvasRef}
          style={{ width: '1200px', backgroundColor: '#ffffff', padding: '36px' }}
          className="rounded-3xl border border-slate-200 text-slate-900 font-sans"
        >
          {/* Official Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {title}
                </h2>
              </div>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="text-right text-[11px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
              Official Assessment Data
            </div>
          </div>

          {/* Dynamic Grid: Perfectly Balanced & Centered depending on number of cards */}
          <div
            className={
              currentSelectedItems.length === 1
                ? 'max-w-md mx-auto'
                : currentSelectedItems.length === 2
                ? 'grid grid-cols-2 gap-6 max-w-3xl mx-auto'
                : currentSelectedItems.length === 3
                ? 'grid grid-cols-3 gap-5 max-w-5xl mx-auto'
                : currentSelectedItems.length === 4
                ? 'grid grid-cols-4 gap-4'
                : 'grid grid-cols-5 gap-3.5'
            }
          >
            {currentSelectedItems.map((item) => (
              <div
                key={item.id}
                className="p-5 bg-slate-50/95 rounded-2xl border border-slate-200 text-center space-y-3.5 shadow-xs"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700">
                    #{item.index}
                  </span>
                  <p className="text-sm font-black text-slate-900">{item.label}</p>
                </div>

                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Baseline Pre:</span>
                    <span className="text-slate-700 font-extrabold">{item.baselinePre}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-slate-400 rounded-full"
                      style={{ width: `${Math.min(100, item.baselinePre || 0)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-emerald-700">Post Training:</span>
                    <span className="text-emerald-700 font-black">{item.postTraining}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${Math.min(100, item.postTraining || 0)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                    +{item.gain}% Competency Gain
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Watermark Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>The AI Bridge · Faculty of Management Sciences · IIUI</span>
            <span>Live Verified Assessment Data</span>
          </div>
        </div>

        {/* Off-screen single card container for "Download Separately" */}
        <div
          ref={singleCanvasRef}
          style={{ width: '560px', backgroundColor: '#ffffff', padding: '28px' }}
          className="rounded-3xl border border-slate-200 text-slate-900 font-sans"
        >
          {activeSingleCard && (
            <div>
              <div className="border-b border-slate-100 pb-3 mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  {title}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                    Dimension #{activeSingleCard.index}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">{activeSingleCard.label}</h3>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-4">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-400">Baseline Pre:</span>
                    <span className="text-slate-700 font-extrabold">{activeSingleCard.baselinePre}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-slate-400 rounded-full"
                      style={{ width: `${Math.min(100, activeSingleCard.baselinePre || 0)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-emerald-700">Post Training:</span>
                    <span className="text-emerald-700 font-black">{activeSingleCard.postTraining}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${Math.min(100, activeSingleCard.postTraining || 0)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-black">
                    +{activeSingleCard.gain}% Competency Gain
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>The AI Bridge · Faculty of Management Sciences · IIUI</span>
                <span>Live Verified Assessment Data</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
