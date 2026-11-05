'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileDown,
  ArrowLeft,
  Sparkles,
  GraduationCap,
  Briefcase,
  Building2,
  FileText,
  Presentation,
  Archive,
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import SdgLoading from '@/components/SdgLoading';
import { SURVEY_CHART_SOURCES } from '@/lib/surveyChartSources';
import SurveyAnalyticsView from '@/components/dashboard/SurveyAnalyticsView';
import {
  CapturedChartItem,
  exportMasterCsv,
  exportWordDoc,
  exportPowerPoint,
  exportPdfDoc,
  exportZipArchive,
} from '@/lib/exportReportEngine';

// ─── Help Tooltip Component ──────────────────────────────────────────────────
function StudioHelpTooltip({
  title,
  explanation,
  recommendation,
}: {
  title: string;
  explanation: string;
  recommendation?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center ml-1.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="w-4 h-4 rounded-full bg-slate-200 hover:bg-emerald-200 text-slate-600 hover:text-emerald-900 flex items-center justify-center text-[10px] font-black transition-colors cursor-pointer"
        aria-label={`Help: ${title}`}
      >
        ?
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-1.5 pointer-events-auto border border-slate-700 animate-fade-in"
        >
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>{title}</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">{explanation}</p>
          {recommendation && (
            <p className="text-[10px] text-amber-300 font-medium pt-1 border-t border-slate-800">
              💡 <span className="font-bold">Recommendation:</span> {recommendation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface SurveyExportStudioProps {
  onBack: () => void;
  initialCohort?: 'all' | 'matched';
}

export default function SurveyExportStudio({ onBack, initialCohort = 'all' }: SurveyExportStudioProps) {
  // ─── Studio Configuration State ───────────────────────────────────────────
  const [cohortMode, setCohortMode] = useState<'all' | 'matched'>(initialCohort);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | 'pptx' | 'zip' | 'csv'>('pdf');
  const [selectedTabs, setSelectedTabs] = useState<Record<string, boolean>>({
    executive: true,
    student: true,
    faculty: true,
    demographics: true,
  });

  // PDF options
  const [pdfLayout, setPdfLayout] = useState<'single' | 'compact' | 'hybrid'>('single');
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [watermarkText, setWatermarkText] = useState('THE AI BRIDGE · IIUI FMS · OFFICIAL VERIFIED REPORT');
  const [includeVerificationQr, setIncludeVerificationQr] = useState(true);

  // Word options
  const [docxOptions, setDocxOptions] = useState({
    includeChart: true,
    includeTable: true,
    includeInsight: true,
    includeSource: true,
    style: 'branded' as 'branded' | 'plain',
  });

  // PNG ZIP options
  const [pngQuality, setPngQuality] = useState<number>(2); // 1 = 1x, 2 = 2x, 3 = 3x
  const [pngStructure, setPngStructure] = useState<'individual' | 'tabs'>('individual');

  // Universal toggles
  const [includeInsight, setIncludeInsight] = useState(true);
  const [includeDataSource, setIncludeDataSource] = useState(true);

  // Raw dataset for Master CSV
  const [rawDataset, setRawDataset] = useState<any>(null);

  // Export in-progress state
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState({
    step: '',
    current: 0,
    total: 0,
    percent: 0,
    etaSeconds: 0,
  });
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Live Render Canvas container holding the real SurveyAnalyticsView
  const renderContainerRef = useRef<HTMLDivElement>(null);

  // Fetch raw dataset for CSV background export
  useEffect(() => {
    fetch(`/api/admin/survey-analytics-v2?cohort=${cohortMode}`)
      .then((res) => res.json())
      .then((json) => setRawDataset(json))
      .catch(() => null);
  }, [cohortMode]);

  // ─── Quick Presets ────────────────────────────────────────────────────────
  const applyExecutiveBriefPreset = () => {
    setExportFormat('pdf');
    setSelectedTabs({
      executive: true,
      student: false,
      faculty: false,
      demographics: false,
    });
    setPdfLayout('single');
    setIncludeWatermark(true);
    setIncludeInsight(true);
    setIncludeDataSource(true);
  };

  const applyFullResearchPreset = () => {
    setSelectedTabs({
      executive: true,
      student: true,
      faculty: true,
      demographics: true,
    });
    setIncludeInsight(true);
    setIncludeDataSource(true);
  };

  // ─── Batch Export Execution ───────────────────────────────────────────────
  const handleTriggerExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setSuccessNotice(null);

    const kpi = rawDataset?.kpiSummary || {};
    const charts = rawDataset?.charts || {};

    try {
      // 1. FAST PATH: Master CSV
      if (exportFormat === 'csv') {
        setProgress({
          step: 'Compiling Master CSV dataset with all 33+ survey indicators...',
          current: 1,
          total: 1,
          percent: 50,
          etaSeconds: 1,
        });
        await new Promise((res) => setTimeout(res, 200));
        exportMasterCsv({
          kpi,
          charts,
          cohortMode,
          selectedTabs,
        });
        setProgress({
          step: 'Master CSV export complete!',
          current: 1,
          total: 1,
          percent: 100,
          etaSeconds: 0,
        });
        setSuccessNotice('Master CSV successfully exported!');
        return;
      }

      // 2. DOM-IMAGE CAPTURE PATH: Captures EVERY single real ChartDownloadWrapper card
      if (!renderContainerRef.current) {
        throw new Error('Render canvas is not initialized.');
      }

      // Find all official chart wrapper cards inside the live SurveyAnalyticsView
      const allChartCards = Array.from(
        renderContainerRef.current.querySelectorAll<HTMLDivElement>('[data-chart-wrapper="true"]')
      );

      // Filter by selected tabs
      const chartCards = allChartCards.filter((card) => {
        const tab = card.getAttribute('data-tab') || 'executive';
        return selectedTabs[tab] === true;
      });

      const totalItems = chartCards.length;
      if (totalItems === 0) {
        alert('Please select at least one tab or section to export.');
        return;
      }

      const capturedCharts: CapturedChartItem[] = [];
      const startTime = Date.now();

      for (let i = 0; i < totalItems; i++) {
        const card = chartCards[i];
        const chartId = card.getAttribute('data-chart-id') || card.id || `chart-${i}`;
        const title = card.getAttribute('data-chart-title') || 'AI Bridge Chart';
        const subtitle = card.getAttribute('data-chart-subtitle') || undefined;
        const tab = (card.getAttribute('data-tab') || 'executive') as any;

        // Progress & ETA countdown
        const elapsed = (Date.now() - startTime) / 1000;
        const avgPerItem = i > 0 ? elapsed / i : 0.28;
        const remainingItems = totalItems - i;
        const eta = Math.max(1, Math.round(remainingItems * avgPerItem));

        setProgress({
          step: `Capturing chart ${i + 1} of ${totalItems}: ${title}`,
          current: i + 1,
          total: totalItems,
          percent: Math.round(((i + 1) / totalItems) * 78),
          etaSeconds: eta,
        });

        // Exact high-DPI capture identical to the individual button
        const dataUrl = await toPng(card, {
          cacheBust: true,
          pixelRatio: pngQuality,
          backgroundColor: '#ffffff',
          filter: (node) => !(node as HTMLElement)?.classList?.contains('no-export'),
        });

        // Pull insight text from ExplanationCallout if present in card
        const insightElem = card.querySelector('.bg-amber-50\\/70, .bg-amber-50');
        const insightText = insightElem?.textContent?.replace('Current data summary:', '').trim() || undefined;

        // Pull source metadata from SURVEY_CHART_SOURCES
        const sourceInfo = SURVEY_CHART_SOURCES[chartId];

        // Retrieve tabular dataset if available
        let tableData: any[] | undefined = undefined;
        if (charts) {
          const directMatch = charts[chartId] || charts[chartId.replace(/-/g, '_')];
          if (Array.isArray(directMatch)) {
            tableData = directMatch;
          }
        }

        capturedCharts.push({
          id: chartId,
          title,
          subtitle,
          tab,
          dataUrl,
          width: card.offsetWidth || 800,
          height: card.offsetHeight || 450,
          tableData,
          insight: insightText,
          sourceInfo,
        });
      }

      // Step 2: Assemble document format
      setProgress({
        step: `Assembling official ${exportFormat.toUpperCase()} document (${capturedCharts.length} charts + data sources)...`,
        current: totalItems,
        total: totalItems,
        percent: 88,
        etaSeconds: 2,
      });

      if (exportFormat === 'pdf') {
        await exportPdfDoc({
          kpi,
          cohortMode,
          capturedCharts,
          options: {
            layout: pdfLayout,
            includeInsight,
            includeWatermark,
            watermarkText,
            includeVerificationQr,
            guestPasscode: 'AIB-Impact-2026',
            verificationUrl: 'https://ai-bridge-iiui.vercel.app/guest-analytics',
          },
        });
        setSuccessNotice(`Official PDF Report (${capturedCharts.length} Charts + Sources) generated & downloaded!`);
      } else if (exportFormat === 'docx') {
        await exportWordDoc({
          kpi,
          cohortMode,
          capturedCharts,
          options: {
            ...docxOptions,
            includeInsight,
            includeSource: includeDataSource,
          },
        });
        setSuccessNotice(`Microsoft Word document (${capturedCharts.length} Charts) generated & downloaded!`);
      } else if (exportFormat === 'pptx') {
        await exportPowerPoint({
          kpi,
          cohortMode,
          capturedCharts,
        });
        setSuccessNotice(`PowerPoint presentation (${capturedCharts.length + 2} Slides) generated & downloaded!`);
      } else if (exportFormat === 'zip') {
        await exportZipArchive({
          capturedCharts,
          cohortMode,
          options: {
            structure: pngStructure,
          },
        });
        setSuccessNotice(`High-Res PNG Graphics ZIP (${capturedCharts.length} Images + Sources) downloaded!`);
      }

      setProgress({
        step: 'Export Complete!',
        current: totalItems,
        total: totalItems,
        percent: 100,
        etaSeconds: 0,
      });
    } catch (err: any) {
      console.error('Export execution error:', err);
      alert(`Export failed: ${err.message || 'Unknown error occurred'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in text-slate-900">
      {/* ─── Top Navigation Header ────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Return to Management Console</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Research Export Studio · Paper Mode</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">33 Verified Sections Loaded</span>
        </div>
      </div>

      {/* ─── The Main Paper Document Container ────────────────────────────── */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-10 relative overflow-hidden">
        {/* Paper Top Accent Header */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-800 via-emerald-600 to-teal-700" />

        {/* Paper Header Title */}
        <div className="border-b border-slate-200 pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-700 mb-1">
              <span>The AI Bridge</span>
              <span>•</span>
              <span>Faculty of Management Sciences · IIUI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Executive Survey & Research Export Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Export verified longitudinal intelligence into publication-ready PDF reports, editable Word documents,
              PowerPoint presentations, high-DPI PNG graphics archives, or master CSV datasets with verified data sources.
            </p>
          </div>

          {/* Quick Presets Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              onClick={applyExecutiveBriefPreset}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Auto-select PDF with Executive Summary tab and KPI highlights"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>⚡ 1-Page Executive Brief</span>
            </button>

            <button
              onClick={applyFullResearchPreset}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Select all tabs and metrics for comprehensive publication"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>🎯 Full Research Report (All 33 Charts)</span>
            </button>
          </div>
        </div>

        {/* ─── Paper Form Sections ─────────────────────────────────────────── */}
        <div className="space-y-8">
          {/* Section 1: Choose Format */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-slate-900 flex items-center">
                1. Select Export Deliverable Format
                <StudioHelpTooltip
                  title="Deliverable Format"
                  explanation="Choose the file format suited for your reporting needs. PDF is ideal for formal printing and board meetings. Word (.docx) is best for editing text and academic publishing. PowerPoint is ready for slide presentations. PNG ZIP provides individual graphic files. Master CSV contains all raw and aggregated numbers."
                  recommendation="PDF for formal institutional presentations; Word for research publications."
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                {
                  id: 'pdf',
                  title: 'PDF Document',
                  ext: '.pdf',
                  desc: 'Formal printable report with cover page, typography & charts.',
                  icon: FileText,
                  badge: 'Print & Share',
                },
                {
                  id: 'docx',
                  title: 'Microsoft Word',
                  ext: '.docx',
                  desc: 'Fully editable academic paper with tables, figures & callouts.',
                  icon: FileDown,
                  badge: 'Editable',
                },
                {
                  id: 'pptx',
                  title: 'PowerPoint',
                  ext: '.pptx',
                  desc: 'Branded 16:9 presentation deck with 1 slide per chart.',
                  icon: Presentation,
                  badge: 'Slides',
                },
                {
                  id: 'zip',
                  title: 'PNG Graphics ZIP',
                  ext: '.zip',
                  desc: 'High-res image archive (2x/3x DPI) identical to download button.',
                  icon: Archive,
                  badge: 'Graphics',
                },
                {
                  id: 'csv',
                  title: 'Master CSV',
                  ext: '.csv',
                  desc: 'Single consolidated file with all chart indicators & raw values.',
                  icon: FileSpreadsheet,
                  badge: 'Raw Data',
                },
              ].map((fmt) => {
                const isSelected = exportFormat === fmt.id;
                const Icon = fmt.icon;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setExportFormat(fmt.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {fmt.badge}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900">{fmt.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{fmt.desc}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
                      <span>Format:</span>
                      <span className="text-emerald-700">{fmt.ext}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Cohort Filter */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center">
              2. Longitudinal Cohort Filter
              <StudioHelpTooltip
                title="Cohort Mode Filter"
                explanation="'All Submissions' aggregates all verified pre-assessment and post-assessment submissions (1,331 Pre / 864 Post), including participants who submitted only one phase. 'Matched Pairs Only' isolates the 743 students whose pre and post survey records were strictly verified and linked, providing pure longitudinal evidence."
                recommendation="Use 'Matched Pairs Only' for strict academic before-and-after change papers."
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  cohortMode === 'all'
                    ? 'border-emerald-600 bg-white ring-1 ring-emerald-600 shadow-2xs'
                    : 'border-slate-200 bg-white/70 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="cohort"
                  checked={cohortMode === 'all'}
                  onChange={() => setCohortMode('all')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">All Submissions (1,331 Pre / 864 Post)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Maximum sample volume. Includes comprehensive unpaired and auto-corrected responses.
                  </p>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  cohortMode === 'matched'
                    ? 'border-emerald-600 bg-white ring-1 ring-emerald-600 shadow-2xs'
                    : 'border-slate-200 bg-white/70 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="cohort"
                  checked={cohortMode === 'matched'}
                  onChange={() => setCohortMode('matched')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Matched Pairs Only (743 Verified Pre+Post Linked)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Strict longitudinal sample. Only students with both baseline and verified outcome records.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Tabs & Scope Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-slate-900 flex items-center">
                3. Survey Domains & Tab Scope
                <StudioHelpTooltip
                  title="Domains & Tabs Scope"
                  explanation="Select which survey sections will be included in the exported package. You can include all 4 tabs for a complete master report, or select specific sections to produce focused briefings."
                  recommendation="Keep all 4 selected for formal accreditation audits; select Executive Summary only for leadership briefs."
                />
              </label>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTabs({ executive: true, student: true, faculty: true, demographics: true })
                  }
                  className="text-emerald-700 hover:underline font-bold cursor-pointer"
                >
                  Select All (33 Sections)
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTabs({ executive: true, student: false, faculty: false, demographics: false })
                  }
                  className="text-slate-500 hover:underline font-bold cursor-pointer"
                >
                  Executive Only (6 Sections)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  id: 'executive',
                  title: '1. Executive Summary',
                  badge: '6 Core Sections',
                  icon: Sparkles,
                  desc: 'High-level radars, hours saved, familiarity shift, future adoption.',
                },
                {
                  id: 'student',
                  title: '2. Student Journey',
                  badge: '13 Deep Metrics',
                  icon: GraduationCap,
                  desc: 'Needs matrix, concept gain, reading ease, preferred study formats.',
                },
                {
                  id: 'faculty',
                  title: '3. Faculty & Teachers',
                  badge: '8 Impact Metrics',
                  icon: Briefcase,
                  desc: 'Translation burden, lesson prep time reduction, teaching fatigue relief.',
                },
                {
                  id: 'demographics',
                  title: '4. Demographics & Outreach',
                  badge: '6 Segmentations',
                  icon: Building2,
                  desc: 'Department reach, semester distributions, audit checks, velocity.',
                },
              ].map((tab) => {
                const isChecked = selectedTabs[tab.id];
                const Icon = tab.icon;
                return (
                  <label
                    key={tab.id}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isChecked
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setSelectedTabs((prev) => ({ ...prev, [tab.id]: e.target.checked }))
                          }
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isChecked ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{tab.title}</span>
                      </div>
                      <p
                        className={`text-[11px] mt-1.5 leading-snug ${
                          isChecked ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {tab.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 4: Format-Specific Customizations */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center">
              4. Format Configuration & Layout Settings
              <StudioHelpTooltip
                title="Format Layout Settings"
                explanation="Fine-tune how the charts, data tables, and interpretations will be arranged in your selected format."
              />
            </h3>

            {/* If PDF */}
            {exportFormat === 'pdf' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5 flex items-center">
                    PDF Page Layout
                    <StudioHelpTooltip
                      title="PDF Page Layout"
                      explanation="'One Chart Per Page' renders each chart at maximum readable size with its subtitle and insight. 'Compact Multi-Chart' packs 2-3 charts per page for shorter documents."
                    />
                  </label>
                  <select
                    value={pdfLayout}
                    onChange={(e) => setPdfLayout(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="single">One Chart Per Page (Full-size, High Readability)</option>
                    <option value="compact">Compact Multi-Chart (2-3 charts per page)</option>
                    <option value="hybrid">Hybrid Adaptive (KPI page + Core full-size)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5 flex items-center">
                    Document Orientation & Cover
                    <StudioHelpTooltip
                      title="PDF Standard"
                      explanation="Standard portrait A4 document with formal IIUI FMS cover page including executive KPI cards."
                    />
                  </label>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 text-xs">
                    Portrait A4 · Cover Page Included
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5 flex items-center">
                    Watermark & Authentication
                    <StudioHelpTooltip
                      title="Watermark Toggle"
                      explanation="Adds subtle official document verification stamps to headers and footers."
                    />
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeWatermark}
                      onChange={(e) => setIncludeWatermark(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-700 text-xs truncate">
                      Official Verification Stamp
                    </span>
                  </label>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5 flex items-center">
                    Live Telemetry QR on Cover
                    <StudioHelpTooltip
                      title="Cover Page Verification QR"
                      explanation="Embeds a scannable smartphone QR code on the cover page linking directly to live guest analytics with the evaluator passcode (AIB-Impact-2026) displayed underneath."
                      recommendation="Keep enabled for accreditation evaluators to verify data authenticity."
                    />
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeVerificationQr}
                      onChange={(e) => setIncludeVerificationQr(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-700 text-xs truncate">
                      QR Code & Passcode (Default ON)
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* If Word (.docx) */}
            {exportFormat === 'docx' && (
              <div className="space-y-3 text-xs">
                <label className="font-bold text-slate-700 block flex items-center">
                  Select Elements to Include in Each Chart Section:
                  <StudioHelpTooltip
                    title="Word Document Elements"
                    explanation="You can choose to include embedded chart image graphics, structured data tables, key finding interpretations, and data source methodology notes."
                  />
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'includeChart', label: '☑ Chart Visual Graphic' },
                    { key: 'includeTable', label: '☑ Formatted Data Table' },
                    { key: 'includeInsight', label: '☑ Key Finding Interpretation' },
                    { key: 'includeSource', label: '☑ Data Source Info' },
                  ].map((elem) => (
                    <label
                      key={elem.key}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 cursor-pointer font-bold text-slate-800"
                    >
                      <input
                        type="checkbox"
                        checked={(docxOptions as any)[elem.key]}
                        onChange={(e) =>
                          setDocxOptions((prev) => ({ ...prev, [elem.key]: e.target.checked }))
                        }
                        className="rounded text-emerald-600"
                      />
                      <span>{elem.label}</span>
                    </label>
                  ))}
                </div>

                <div className="pt-2 flex items-center gap-4">
                  <span className="font-bold text-slate-700">Document Style:</span>
                  <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="docxStyle"
                      checked={docxOptions.style === 'branded'}
                      onChange={() => setDocxOptions((prev) => ({ ...prev, style: 'branded' }))}
                      className="text-emerald-600"
                    />
                    <span>AI Bridge Emerald Branded (Default)</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="docxStyle"
                      checked={docxOptions.style === 'plain'}
                      onChange={() => setDocxOptions((prev) => ({ ...prev, style: 'plain' }))}
                      className="text-emerald-600"
                    />
                    <span>Minimalist Academic B&W</span>
                  </label>
                </div>
              </div>
            )}

            {/* If PNG ZIP */}
            {exportFormat === 'zip' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5 flex items-center">
                    Image Resolution & Quality
                    <StudioHelpTooltip
                      title="PNG Quality"
                      explanation="High (2x) provides 1920px+ crystal clear images identical to individual download buttons. Standard (1x) generates lightweight files for web and emails. Ultra (3x) generates maximum-DPI images for large format printing."
                    />
                  </label>
                  <select
                    value={pngQuality}
                    onChange={(e) => setPngQuality(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value={1}>Standard Quality (1x - Lightweight)</option>
                    <option value={2}>High Quality (2x - Default, Crisp & Sharp)</option>
                    <option value={3}>Ultra Print Quality (3x - Maximum DPI)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5 flex items-center">
                    Archive File Organization
                    <StudioHelpTooltip
                      title="ZIP File Structure"
                      explanation="Individual PNGs saves all 33 separate image files with numbered filenames and manifest."
                    />
                  </label>
                  <select
                    value={pngStructure}
                    onChange={(e) => setPngStructure(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="individual">Individual PNG per Chart (All 33 Files + Manifest)</option>
                    <option value="tabs">Organized by Domain Folders</option>
                  </select>
                </div>
              </div>
            )}

            {/* If PowerPoint */}
            {exportFormat === 'pptx' && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">📽️ PowerPoint Presentation Deck Ready</p>
                <p className="text-[11px]">
                  Generates an executive 16:9 widescreen presentation featuring an AI Bridge dark emerald title slide,
                  a KPI scorecard slide, and one dedicated slide per chart with title, graphic, and verified data source citations.
                </p>
              </div>
            )}

            {/* If Master CSV */}
            {exportFormat === 'csv' && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">📊 Consolidated CSV Spreadsheet</p>
                <p className="text-[11px]">
                  Generates a single UTF-8 BOM CSV dataset containing executive KPI benchmarks, table headers,
                  participant counts, and percentages for all 33 selected sections.
                </p>
              </div>
            )}

            {/* Universal Toggles */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeInsight}
                  onChange={(e) => setIncludeInsight(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>Include "What this data proves" / Insight Callouts (Default ON)</span>
                <StudioHelpTooltip
                  title="Insight Callouts"
                  explanation="Includes concise findings underneath each chart explaining the statistical significance and meaning."
                />
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDataSource}
                  onChange={(e) => setIncludeDataSource(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>Include Verified Data Source & Methodology Attributions</span>
                <StudioHelpTooltip
                  title="Data Source & Methodology"
                  explanation="Includes exact survey questions and verified source tables from Supabase V2."
                />
              </label>
            </div>
          </div>

          {/* ─── Real-Time Progress Bar & Status Banner ─────────────────────── */}
          {isExporting && (
            <div className="p-6 rounded-2xl bg-slate-950 text-white space-y-3 shadow-lg border border-slate-800 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <SdgLoading size={16} label="Export processing..." />
                  <span className="font-bold text-emerald-400">{progress.step}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-slate-400">
                  <span className="font-bold text-white">{progress.percent}%</span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successNotice && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold flex items-center justify-between gap-3 shadow-2xs animate-fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successNotice}</span>
              </div>
              <button
                onClick={() => setSuccessNotice(null)}
                className="text-xs text-emerald-800 hover:text-emerald-950 font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ─── Main Action Trigger Bar ──────────────────────────────────── */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Verified Client-Side Generation · All 33 Sections Ready · Format:{' '}
                <span className="font-black text-slate-900">{exportFormat.toUpperCase()}</span>
              </span>
            </div>

            <button
              onClick={handleTriggerExport}
              disabled={isExporting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:shadow-lg"
            >
              {isExporting ? (
                <>
                  <SdgLoading size={18} label="Generating" />
                  <span>Generating Export ({progress.percent}%)...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Generate & Download {exportFormat.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Real Live Survey Analytics Render Stage (All 33 Charts) ──── */}
      {/* Mounts the full SurveyAnalyticsView with renderAllForExport={true} so all 33 cards are rendered */}
      <div
        ref={renderContainerRef}
        className="max-w-6xl mx-auto space-y-6 pt-4"
      >
        <div className="flex items-center justify-between px-2 text-xs font-black text-slate-500 uppercase tracking-wider">
          <span>Active Chart Preview & Render Stage ({cohortMode.toUpperCase()} COHORT)</span>
          <span className="text-emerald-700 font-bold">33 Official Analytical Sections Loaded</span>
        </div>

        {/* The Real SurveyAnalyticsView in Export All Mode */}
        <SurveyAnalyticsView
          isAdmin={true}
          renderAllForExport={true}
          hideHeaderBar={true}
          initialCohort={cohortMode}
        />
      </div>
    </div>
  );
}
