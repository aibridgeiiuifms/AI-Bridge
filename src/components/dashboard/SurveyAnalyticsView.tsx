'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  GraduationCap,
  Briefcase,
  Building2,
  ShieldCheck,
  QrCode,
  Lock,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  TrendingUp,
  Award,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Eye,
  Sliders,
  ExternalLink,
  BarChart3,
  PieChart,
  Layers,
  Lightbulb,
  FileText,
  Target,
  Percent,
  FileDown,
} from 'lucide-react';
import SdgLoading from '@/components/SdgLoading';
import ChartDownloadWrapper from '@/components/dashboard/ChartDownloadWrapper';
import { ChartDataHelpButton, ChartDataHelpProvider } from '@/components/dashboard/ChartDataHelp';
import MemberChartPermissionsModal from '@/components/dashboard/MemberChartPermissionsModal';
import GuestAccessModal from '@/components/dashboard/GuestAccessModal';

// ─── Visual Chart & Callout Helpers ──────────────────────────────────────────
import {
  DONUT_COLORS,
  getChartInsight,
  ExplanationCallout,
  getCategoryShare,
  SvgDonutChart,
  MiniRadialRing,
} from './surveyChartVisuals';

export type V2AnalyticsTab = 'executive' | 'student' | 'faculty' | 'demographics';
export type SurveySubTab = string;

interface SurveyAnalyticsViewProps {
  isAdmin?: boolean;
  activeSubTab?: any;
  onSubTabChange?: (tab: any) => void;
  onVisibleSubTabsChange?: (tabs: any[]) => void;
  hideHeaderBar?: boolean;
  onOpenExportStudio?: () => void;
  renderAllForExport?: boolean;
  initialCohort?: 'all' | 'matched';
}

export default function SurveyAnalyticsView({
  isAdmin = false,
  activeSubTab: controlledSubTab,
  onSubTabChange,
  onVisibleSubTabsChange,
  hideHeaderBar = false,
  onOpenExportStudio,
  renderAllForExport = false,
  initialCohort = 'all',
}: SurveyAnalyticsViewProps = {}) {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [certData, setCertData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<V2AnalyticsTab>('executive');
  const [cohortMode, setCohortMode] = useState<'all' | 'matched'>(initialCohort || 'all');
  useEffect(() => { if (initialCohort) setCohortMode(initialCohort); }, [initialCohort]);
  const [viewMode, setViewMode] = useState<'charts' | 'numbers'>('charts');

  // Modals
  const [showPermsModal, setShowPermsModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  // Operational Registry Search
  const [certSearch, setCertSearch] = useState('');
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Guest alert banner state
  const [guestNotification, setGuestNotification] = useState<any | null>(null);

  const fetchAnalytics = useCallback(async (mode?: 'all' | 'matched', refresh?: boolean) => {
    setLoading(true);
    setError(null);
    const activeMode = mode || cohortMode;
    try {
      const url = `/api/admin/survey-analytics-v2?cohort=${activeMode}${refresh ? '&refresh=true' : ''}`;
      const [v2Res, guestRes] = await Promise.all([
        fetch(url),
        fetch('/api/admin/guest-access').catch(() => null),
      ]);

      if (!v2Res.ok) {
        const errJson = await v2Res.json();
        throw new Error(errJson.error || 'Failed to fetch V2 analytics');
      }

      const v2Json = await v2Res.json();
      setData(v2Json);
      setCertData(v2Json.recentCertificates || []);

      if (guestRes && guestRes.ok) {
        const gJson = await guestRes.json();
        const unread = (gJson.notifications || []).find((n: any) => !n.is_read);
        if (unread) {
          setGuestNotification(unread);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  }, [cohortMode]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (controlledSubTab && ['executive', 'student', 'faculty', 'demographics'].includes(controlledSubTab)) {
      setActiveTab(controlledSubTab as V2AnalyticsTab);
    }
  }, [controlledSubTab]);

  const handleTabChange = (tabId: V2AnalyticsTab) => {
    setActiveTab(tabId);
    onSubTabChange?.(tabId);
  };

  const handleManualSync = async () => {
    setSyncingSheets(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/webhooks/google-sheets');
      const json = await res.json();
      setSyncMessage(`Sync engine operational: ${json.message || 'Ready'}`);
      await fetchAnalytics(cohortMode, true);
    } catch (err: any) {
      setSyncMessage(`Sync check error: ${err.message}`);
    } finally {
      setSyncingSheets(false);
    }
  };

  const isSurveyAdmin = isAdmin || data?.isAdmin === true || data?.role === 'admin';
  const canViewChartDataHelp = data?.canViewChartDataHelp === true;

  const isChartAllowed = (chartId: string) => {
    if (!data) return false;
    if (isSurveyAdmin) return true;
    return data.allowedCharts?.[chartId] !== false;
  };

  const charts = data?.charts || {};
  const kpi = data?.kpiSummary || {};

  const filteredCerts = certData.filter(c => {
    const q = certSearch.toLowerCase();
    return (
      (c.recipient_name || '').toLowerCase().includes(q) ||
      (c.certificate_id || '').toLowerCase().includes(q) ||
      (c.department || '').toLowerCase().includes(q)
    );
  });

  if (loading && !data) {
    return (
      <div className="py-24 text-center">
        <SdgLoading size={32} label="Computing survey analytics" />
        <p className="mt-4 text-xs font-bold text-slate-500">
          Loading V2 Pipeline Analytics...
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 max-w-lg mx-auto bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-base font-extrabold text-rose-900">Failed to Load Analytics</h3>
        <p className="text-xs text-rose-700">{error}</p>
        <button
          onClick={() => fetchAnalytics()}
          className="px-4 py-2 rounded-xl bg-rose-600 text-white font-extrabold text-xs shadow-sm hover:bg-rose-700 cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <ChartDataHelpProvider canView={canViewChartDataHelp}>
    <div className="space-y-6">
      
      {/* 1. Live Guest Notification Banner (if any outsider logged in) */}
      {guestNotification && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-amber-950 animate-fade-in shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black">{guestNotification.title}</p>
              <p className="text-[11px] text-amber-800">{guestNotification.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGuestModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Inspect / Block Access
            </button>
            <button
              onClick={() => setGuestNotification(null)}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Header & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              V2 Data Pipeline Active
            </span>
            <span className="text-[10px] text-slate-400">Isolated & Non-Destructive</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1">
            Unified Survey & Training Impact Analytics
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            34 Comparative Metrics across {kpi.totalStudents || 0} Students and {kpi.totalTeachers || 0} Faculty pre/post assessments.
          </p>
        </div>

        {/* Action Controls for Admin */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Cohort Switch */}
          <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex items-center text-xs font-bold">
            <button
              onClick={() => {
                setCohortMode('all');
                fetchAnalytics('all');
              }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                cohortMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Submissions ({kpi.totalStudentPre || 0} Pre / {kpi.totalStudentPost || 0} Post)
            </button>
            <button
              onClick={() => {
                setCohortMode('matched');
                fetchAnalytics('matched');
              }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                cohortMode === 'matched'
                  ? 'bg-white text-emerald-800 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Matched Pairs Only ({kpi.matchedPairsCount || 0})
            </button>
          </div>

          {data?.isAdmin && (
            <>
              {/* Member Chart Permissions */}
              <button
                onClick={() => setShowPermsModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Configure per-member granular chart checkboxes"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Member Permissions</span>
              </button>

              {/* Outsider QR & Access */}
              <button
                onClick={() => setShowGuestModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Generate QR code and shared password for external evaluators"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Outsider Access (QR)</span>
              </button>
            </>
          )}

          <button
            onClick={() => fetchAnalytics(cohortMode, true)}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all cursor-pointer"
            title="Refresh analytics data (recompute and bust cache)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {onOpenExportStudio && (
            <button
              onClick={onOpenExportStudio}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Open full research export paper studio (PDF, Word, PPTX, PNG ZIP, CSV)"
            >
              <FileDown className="w-3.5 h-3.5 text-white" />
              <span>Export Survey report & Charts</span>
            </button>
          )}
        </div>
      </div>

      {!renderAllForExport && (
        <>
          {/* 3. The 4 Sub-Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        {[
          { id: 'executive', label: '1. Executive Summary', icon: Sparkles, badge: '5 Core Visuals' },
          { id: 'student', label: '2. Student Journey', icon: GraduationCap, badge: '14 Deep Metrics' },
          { id: 'faculty', label: '3. Faculty & Teachers', icon: Briefcase, badge: '10 Impact Metrics' },
          { id: 'demographics', label: '4. Demographics & Outreach', icon: Building2, badge: '7 Segmentations' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as V2AnalyticsTab)}
              className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </div>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Visual Charts vs Raw Data / Tables Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
          <span className="text-slate-400">Interactive Display Mode:</span>
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-900 font-black">
            {viewMode === 'charts' ? 'Visual Graphics Active' : 'Data Tables Active'}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setViewMode('charts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'charts'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Visual Charts & Graphics</span>
          </button>
          <button
            onClick={() => setViewMode('numbers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'numbers'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Data & Tables View</span>
          </button>
        </div>
      </div>
        </>
      )}

      {/* =========================================================================
          TAB 1: EXECUTIVE SUMMARY
         ========================================================================= */}
      {(renderAllForExport || activeTab === 'executive') && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Executive 6 Core KPI Cards */}
          {isChartAllowed('kpi_cards') && (
            <div
              data-chart-wrapper="true"
              data-chart-id="kpi-summary"
              data-chart-title="Executive Summary & Core Impact KPIs"
              data-chart-subtitle="High-level indicators across students, faculty, certificates, and learning retention."
              data-tab="executive"
              className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs relative overflow-hidden text-slate-900 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                      Executive Summary & Core Impact KPIs
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-medium">
                    Verified participant progression, 12-MCQ pass rates, and QIP weekly time saved benchmarks.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 no-export">
                  <ChartDataHelpButton sourceId="kpi-summary" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Card 1: Total Students */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Students</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-[10px] border border-indigo-200">
                      Pre + Post + Misrouted
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    {(kpi.totalStudents || (kpi.totalStudentPre + kpi.totalStudentPost) || 0).toLocaleString()}
                  </p>
                  <p className="text-xs font-bold text-indigo-700 mt-0.5">
                    {kpi.totalStudentPre || 0} Pre-Assessment · {kpi.totalStudentPost || 0} Post-Assessment
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-snug">
                  <span className="font-bold text-slate-900">What it shows:</span> Verified student participants across baseline & outcome surveys, with student emails in teacher forms auto-corrected.
                </div>
              </div>

              {/* Card 2: Faculty & Teachers */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Faculty & Teachers</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-extrabold text-[10px] border border-amber-200">
                      Pure Faculty
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    {(kpi.totalTeachers || (kpi.totalTeacherPre + kpi.totalTeacherPost) || 0).toLocaleString()}
                  </p>
                  <p className="text-xs font-bold text-amber-800 mt-0.5">
                    {kpi.totalTeacherPre || 0} Pre-Assessment · {kpi.totalTeacherPost || 0} Post-Assessment
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-snug">
                  <span className="font-bold text-slate-900">What it shows:</span> Genuine educators and professors across faculties, excluding misrouted student submissions.
                </div>
              </div>

              {/* Card 3: Certificates Issued */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Certificates Issued</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-[10px] border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verifiable
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1">
                    {(kpi.certificatesIssued || 0).toLocaleString()}
                  </p>
                  <p className="text-xs font-bold text-emerald-700 mt-0.5">
                    100% Verifiable in Official Registry
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-snug">
                  <span className="font-bold text-slate-900">What it shows:</span> Official credentials awarded to students who verified pre & post surveys and passed the competency exam.
                </div>
              </div>

              {/* Card 4: QIP Time Met (≥3H) */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">QIP Time Met (≥3H)</span>
                    <MiniRadialRing percent={kpi.qipTimeMetPct || kpi.targetHoursSavedPct || 0} color="#059669" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    {kpi.qipTimeMetPct || kpi.targetHoursSavedPct || 0}%
                  </p>
                  <p className="text-xs font-bold text-emerald-700 mt-0.5">
                    Saved 3 to 8+ hours weekly
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-snug">
                  <span className="font-bold text-slate-900">What it shows:</span> Proportion of participants meeting the Quality Improvement Plan goal by saving significant weekly prep/study time.
                </div>
              </div>

              {/* Card 5: Quiz Pass Rate */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quiz Pass Rate</span>
                    <MiniRadialRing percent={kpi.quizPassRate || 0} color="#4f46e5" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    {kpi.quizPassRate || 0}%
                  </p>
                  <p className="text-xs font-bold text-indigo-700 mt-0.5">
                    Across {(kpi.quizAttemptsCount || 0).toLocaleString()} recorded attempts
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-snug">
                  <span className="font-bold text-slate-900">What it shows:</span> Percentage of examinees achieving passing competency (≥75%) on the 12-MCQ technical exam.
                </div>
              </div>

              {/* Card 6: Average Quiz Score */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average Quiz Score</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px] border border-slate-200">
                      Target: 9.0 (75%)
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    {kpi.avgQuizScore || 0} <span className="text-base text-slate-400 font-bold">/ 12</span>
                  </p>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">
                    Mean technical score on portal exam
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-snug">
                  <span className="font-bold text-slate-900">What it shows:</span> Average objective assessment score across all student attempts, proving concrete cognitive retention.
                </div>
              </div>

              </div>
              <div className="mt-4 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
                <span className="font-bold text-slate-700">Data Source:</span>{' '}
                <span className="text-slate-600">survey_responses_v2, certificates, and quiz_attempts in Supabase V2 Analytics Engine</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>The AI Bridge · Faculty of Management Sciences · IIUI</span>
                <span>Live Verified Assessment Data</span>
              </div>
            </div>
          )}

          {/* Student 5-Dimensional Impact Radar Chart */}
          {isChartAllowed('student_impact_radar') && (
            <ChartDownloadWrapper tab="executive"
              id="student-impact-radar"
              title="Student Impact Summary (Before and After Training)"
              subtitle="Five core dimensions evaluated across baseline pre-survey measures and post-training outcomes."
              dataForCsv={charts.student_impact_radar}
              selectableCards={(charts.student_impact_radar || []).map((axis: any, idx: number) => ({
                id: axis.axis,
                label: axis.axis,
                index: idx + 1,
                baselinePre: axis.baselinePre,
                postTraining: axis.postTraining,
                gain: axis.postTraining - axis.baselinePre,
              }))}
            >
              {viewMode === 'charts' ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                  {(charts.student_impact_radar || []).map((axis: any, idx: number) => {
                    const gain = axis.postTraining - axis.baselinePre;
                    return (
                      <div key={axis.axis} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700">
                            #{idx + 1}
                          </span>
                          <p className="text-xs font-black text-slate-800">{axis.axis}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-400">Baseline Pre:</span>
                            <span className="text-slate-600">{axis.baselinePre}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full bg-slate-400 rounded-full" style={{ width: `${axis.baselinePre}%` }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-emerald-700">Post Training:</span>
                            <span className="text-emerald-700 font-black">{axis.postTraining}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${axis.postTraining}%` }} />
                          </div>
                        </div>
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                          +{gain}% Competency Gain
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="pt-2 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 rounded-l-xl">Competency Dimension</th>
                        <th className="p-2.5">Pre-Training Baseline</th>
                        <th className="p-2.5">Post-Training Outcome</th>
                        <th className="p-2.5 rounded-r-xl">Net Gain / Improvement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(charts.student_impact_radar || []).map((axis: any) => (
                        <tr key={axis.axis} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{axis.axis}</td>
                          <td className="p-2.5 text-slate-600">{axis.baselinePre}%</td>
                          <td className="p-2.5 font-bold text-emerald-700">{axis.postTraining}%</td>
                          <td className="p-2.5 font-black text-emerald-800">+{axis.postTraining - axis.baselinePre}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <ExplanationCallout data={charts.student_impact_radar} chartId="student-impact-radar" />
            </ChartDownloadWrapper>
          )}

          {/* Hours Saved Distribution */}
          {isChartAllowed('hours_saved_comparison') && (
            <ChartDownloadWrapper tab="executive"
              id="hours-saved-target"
              title="Students’ Weekly Study Hours Saved"
              subtitle="Student post-survey reports grouped by hours saved per week."
              dataForCsv={charts.hours_saved_comparison}
            >
              {viewMode === 'charts' ? (
                <div className="space-y-6 pt-2">
                  {/* Visual Donut Chart */}
                  <SvgDonutChart
                    data={[
                      { label: '< 2 hours', value: (charts.hours_saved_comparison || [])[0]?.count || 0, color: '#667085' },
                      { label: '3 to 5 hours (Target Met)', value: (charts.hours_saved_comparison || [])[1]?.count || 0, color: '#238a7b' },
                      { label: '6 to 8 hours', value: (charts.hours_saved_comparison || [])[2]?.count || 0, color: '#3b6fb6' },
                      { label: '9+ hours', value: (charts.hours_saved_comparison || [])[3]?.count || 0, color: '#e3a23b' },
                    ]}
                    centerText={`${kpi.qipTimeMetPct || kpi.targetHoursSavedPct || 0}%`}
                    centerSub="QIP Target Met"
                  />

                  {/* Horizontal Progress Bars */}
                  <div className="space-y-3">
                    {(charts.hours_saved_comparison || []).map((cat: any) => {
                      const total = (charts.hours_saved_comparison || []).reduce((acc: number, c: any) => acc + (c.count || 0), 0) || 1;
                      const pct = Math.round((cat.count / total) * 100);
                      const isTarget = cat.label?.includes('Target') || cat.key?.includes('3') || cat.key?.includes('6') || cat.key?.includes('9');
                      return (
                        <div key={cat.key} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-extrabold text-slate-800">
                            <span>{cat.label}</span>
                            <span>{cat.count} respondents ({pct}%)</span>
                          </div>
                          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                isTarget ? 'bg-emerald-600' : 'bg-slate-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="pt-2 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 rounded-l-xl">Hours Saved Bracket</th>
                        <th className="p-2.5">QIP Target Status</th>
                        <th className="p-2.5">Total Respondents</th>
                        <th className="p-2.5 rounded-r-xl">Percentage Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(charts.hours_saved_comparison || []).map((cat: any) => {
                        const total = (charts.hours_saved_comparison || []).reduce((acc: number, c: any) => acc + (c.count || 0), 0) || 1;
                        const pct = Math.round((cat.count / total) * 100);
                        const isTarget = cat.label?.includes('Target') || cat.key?.includes('3') || cat.key?.includes('6') || cat.key?.includes('9');
                        return (
                          <tr key={cat.key} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{cat.label}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isTarget ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                {isTarget ? 'Target Achieved' : 'Baseline'}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-slate-800 font-bold">{cat.count}</td>
                            <td className="p-2.5 font-black text-emerald-700">{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <ExplanationCallout data={charts.hours_saved_comparison} chartId="hours-saved-target" />
            </ChartDownloadWrapper>
          )}

          {/* AI Familiarity Shift */}
          {isChartAllowed('ai_familiarity_shift') && (
            <ChartDownloadWrapper tab="executive"
              id="familiarity-shift"
              title="Concept Improvement by Prior AI Experience"
              subtitle="Cross-analyzing student pre-training AI experience against post-training concept understanding gains (Rating 4–5 out of 5)."
              dataForCsv={charts.ai_familiarity_shift}
            >
              {viewMode === 'charts' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  {(charts.ai_familiarity_shift || []).map((lvl: any) => (
                    <div key={lvl.level} className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 text-center space-y-3 hover:border-slate-300 transition-colors shadow-sm">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-800 tracking-tight">{lvl.level}</p>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-600">
                          Baseline: {lvl.prePct}% ({lvl.preCount || 0} students)
                        </span>
                      </div>
                      <div className="py-1">
                        <div className="text-2xl font-black text-emerald-700 tracking-tight">
                          {lvl.postPct}%
                        </div>
                        <div className="text-[11px] font-bold text-slate-600 mt-0.5">
                          High Concept Gain (Rating 4–5)
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, lvl.postPct || 0))}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium pt-0.5">
                        Avg: <span className="font-bold text-slate-600">{lvl.avgRating || 0}/5.0</span> • Matched N={lvl.matchedCount || 0}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-2 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 rounded-l-xl">Prior AI Experience Tier</th>
                        <th className="p-2.5">Baseline Cohort Share (Pre)</th>
                        <th className="p-2.5">Baseline Students (N)</th>
                        <th className="p-2.5">High Concept Gain (Rating 4–5)</th>
                        <th className="p-2.5">Avg Rating (/5.0)</th>
                        <th className="p-2.5 rounded-r-xl">Matched Post (N)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(charts.ai_familiarity_shift || []).map((lvl: any) => (
                        <tr key={lvl.level} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2.5 font-bold text-slate-900">{lvl.level}</td>
                          <td className="p-2.5 text-slate-600 font-bold">{lvl.prePct}%</td>
                          <td className="p-2.5 text-slate-500 font-medium">{lvl.preCount || 0}</td>
                          <td className="p-2.5 font-black text-emerald-700">{lvl.postPct}% ({lvl.highGainCount || 0} students)</td>
                          <td className="p-2.5 font-bold text-slate-700">{lvl.avgRating || 0} / 5.0</td>
                          <td className="p-2.5 text-slate-600 font-semibold">{lvl.matchedCount || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <ExplanationCallout data={charts.ai_familiarity_shift} chartId="familiarity-shift" />
            </ChartDownloadWrapper>
          )}

          {/* Long-Term AI Adoption Intent */}
          {isChartAllowed('future_adoption_intent') && (
            <ChartDownloadWrapper tab="executive"
              id="adoption-intent"
              title="Student and Faculty Plans to Continue Using AI"
              subtitle="Post-survey intentions shown separately for students and faculty."
              dataForCsv={(charts.future_adoption_intent?.students || []).map((s: any, i: number) => ({
                cohort: 'Students',
                category: s.name,
                count: s.count,
                percentage: `${s.pct}%`,
                facultyCategory: charts.future_adoption_intent?.faculty?.[i]?.name || '',
                facultyCount: charts.future_adoption_intent?.faculty?.[i]?.count || 0,
                facultyPercentage: `${charts.future_adoption_intent?.faculty?.[i]?.pct || 0}%`,
              }))}
            >
              {viewMode === 'charts' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-xs font-black text-slate-800">Student Intent (N={kpi.totalStudentPost || 0})</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                        {getCategoryShare(charts.future_adoption_intent?.students, (_item, index) => index < 2)} intend to continue
                      </span>
                    </div>
                    <SvgDonutChart
                      data={(charts.future_adoption_intent?.students || []).map((item: any, idx: number) => ({
                        label: item.name,
                        value: item.count,
                        pct: item.pct,
                        color: DONUT_COLORS[idx % DONUT_COLORS.length]
                      }))}
                      centerText={getCategoryShare(charts.future_adoption_intent?.students, (_item, index) => index < 2)}
                      centerSub="intend to continue"
                      size={155}
                      strokeWidth={18}
                    />
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-xs font-black text-slate-800">Faculty Intent (N={kpi.totalTeacherPost || 0})</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black">
                        {getCategoryShare(charts.future_adoption_intent?.faculty, (_item, index) => index < 2)} intend to continue
                      </span>
                    </div>
                    <SvgDonutChart
                      data={(charts.future_adoption_intent?.faculty || []).map((item: any, idx: number) => ({
                        label: item.name,
                        value: item.count,
                        pct: item.pct,
                        color: DONUT_COLORS[idx % DONUT_COLORS.length]
                      }))}
                      centerText={getCategoryShare(charts.future_adoption_intent?.faculty, (_item, index) => index < 2)}
                      centerSub="intend to continue"
                      size={155}
                      strokeWidth={18}
                    />
                  </div>
                </div>
              ) : (
                <div className="pt-2 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 rounded-l-xl">Adoption Intent</th>
                        <th className="p-2.5">Students Count</th>
                        <th className="p-2.5">Students (%)</th>
                        <th className="p-2.5">Faculty Count</th>
                        <th className="p-2.5 rounded-r-xl">Faculty (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(charts.future_adoption_intent?.students || []).map((s: any, idx: number) => {
                        const f = charts.future_adoption_intent?.faculty?.[idx];
                        return (
                          <tr key={s.name} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{s.name}</td>
                            <td className="p-2.5 font-mono text-slate-700">{s.count}</td>
                            <td className="p-2.5 font-black text-emerald-700">{s.pct}%</td>
                            <td className="p-2.5 font-mono text-slate-700">{f ? f.count : '-'}</td>
                            <td className="p-2.5 font-black text-indigo-700">{f ? `${f.pct}%` : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <ExplanationCallout data={charts.future_adoption_intent} chartId="future_adoption_intent" />
            </ChartDownloadWrapper>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: STUDENT JOURNEY
         ========================================================================= */}
      {(renderAllForExport || activeTab === 'student') && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Obstacles Identified Pre */}
          {isChartAllowed('student_obstacles_pre') && (
            <ChartDownloadWrapper tab="student"
              id="student-obstacles"
              title={`Academic Obstacles Identified Before Training (N=${kpi.totalStudentPre || 0})`}
              subtitle="Key challenges faced in textbooks, dense terminology, and note preparation."
              dataForCsv={charts.student_obstacles_pre}
            >
              {viewMode === 'charts' ? (
                <div className="space-y-3 pt-2">
                  {(charts.student_obstacles_pre || []).map((obs: any) => (
                    <div key={obs.obstacle} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-800">
                        <span>{obs.obstacle}</span>
                        <span>{obs.count} ({obs.pct}%)</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${obs.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-2 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 rounded-l-xl">Identified Academic Obstacle</th>
                        <th className="p-2.5">Affected Students</th>
                        <th className="p-2.5 rounded-r-xl">Prevalence (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(charts.student_obstacles_pre || []).map((obs: any) => (
                        <tr key={obs.obstacle} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{obs.obstacle}</td>
                          <td className="p-2.5 font-mono text-slate-700 font-bold">{obs.count}</td>
                          <td className="p-2.5 font-black text-indigo-700">{obs.pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <ExplanationCallout data={charts.student_obstacles_pre} chartId="student-obstacles" />
            </ChartDownloadWrapper>
          )}

          {/* Needs vs Delivery Alignment */}
          {isChartAllowed('needs_vs_delivery_matrix') && (
            <ChartDownloadWrapper tab="student"
              id="needs-delivery-matrix"
              title="Study Formats Students Requested and Found Helpful"
              subtitle="Student pre-survey preferences compared with post-survey helpful assets."
              dataForCsv={charts.needs_vs_delivery_matrix}
            >
              {viewMode === 'charts' ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2 text-center">
                  {(charts.needs_vs_delivery_matrix || []).map((item: any) => (
                    <div key={item.format} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <p className="text-xs font-extrabold text-slate-900">{item.format}</p>
                      <div className="text-[11px] font-bold">
                        <span className="text-slate-400">Requested: </span>
                        <span className="text-slate-700">{item.preNeedPct}%</span>
                      </div>
                      <div className="text-[11px] font-black">
                        <span className="text-emerald-700">Delivered: </span>
                        <span className="text-emerald-700">{item.postDeliveredPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${item.postDeliveredPct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-2 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 rounded-l-xl">Learning Format / Asset</th>
                        <th className="p-2.5">Pre-Survey Requested</th>
                        <th className="p-2.5">Post-Survey Valued</th>
                        <th className="p-2.5 rounded-r-xl">Curriculum Alignment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(charts.needs_vs_delivery_matrix || []).map((item: any) => (
                        <tr key={item.format} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{item.format}</td>
                          <td className="p-2.5 text-slate-600 font-bold">{item.preNeedPct}%</td>
                          <td className="p-2.5 text-emerald-700 font-extrabold">{item.postDeliveredPct}%</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                              Direct Match
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <ExplanationCallout data={charts.needs_vs_delivery_matrix} chartId="needs-delivery-matrix" />
            </ChartDownloadWrapper>
          )}

          {/* Concept Comprehension & Reading Ease Likert Scales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isChartAllowed('student_concept_improvement') && (
              <ChartDownloadWrapper tab="student"
                id="concept-improvement"
                title="Student-Reported Learning Improvement (1–5)"
                subtitle="Post-survey ratings of perceived improvement in understanding and quiz performance."
                dataForCsv={charts.student_concept_improvement}
              >
                {viewMode === 'charts' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 text-center">
                    {(charts.student_concept_improvement || []).map((item: any) => (
                      <div key={item.rating} className="p-3 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-between text-center space-y-2 shadow-2xs">
                        <MiniRadialRing percent={item.pct} color="#059669" size={52} strokeWidth={5} />
                        <div className="w-full">
                          <p className="text-xs font-black text-slate-900">{item.pct}%</p>
                          <p className="text-[10px] font-bold text-slate-600 truncate mt-0.5" title={item.rating}>{item.rating}</p>
                          <p className="text-[9px] font-mono text-slate-400 mt-0.5">{item.count} students</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2 rounded-l-lg">Rating Level</th>
                          <th className="p-2">Count</th>
                          <th className="p-2 rounded-r-lg">Proportion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.student_concept_improvement || []).map((item: any) => (
                          <tr key={item.rating} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-800">{item.rating}</td>
                            <td className="p-2 font-mono text-slate-600">{item.count}</td>
                            <td className="p-2 font-black text-emerald-700">{item.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.student_concept_improvement} chartId="concept-improvement" />
              </ChartDownloadWrapper>
            )}

            {isChartAllowed('student_reading_comprehension') && (
              <ChartDownloadWrapper tab="student"
                id="reading-ease"
                title="Ease of Reading Complex Texts (1–5)"
                subtitle="Student post-survey ratings of reading and comprehension support."
                dataForCsv={charts.student_reading_comprehension}
              >
                {viewMode === 'charts' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 text-center">
                    {(charts.student_reading_comprehension || []).map((item: any) => (
                      <div key={item.rating} className="p-3 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-between text-center space-y-2 shadow-2xs">
                        <MiniRadialRing percent={item.pct} color="#4f46e5" size={52} strokeWidth={5} />
                        <div className="w-full">
                          <p className="text-xs font-black text-slate-900">{item.pct}%</p>
                          <p className="text-[10px] font-bold text-slate-600 truncate mt-0.5" title={item.rating}>{item.rating}</p>
                          <p className="text-[9px] font-mono text-slate-400 mt-0.5">{item.count} students</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2 rounded-l-lg">Rating Level</th>
                          <th className="p-2">Count</th>
                          <th className="p-2 rounded-r-lg">Proportion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.student_reading_comprehension || []).map((item: any) => (
                          <tr key={item.rating} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-800">{item.rating}</td>
                            <td className="p-2 font-mono text-slate-600">{item.count}</td>
                            <td className="p-2 font-black text-indigo-700">{item.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.student_reading_comprehension} chartId="reading-ease" />
              </ChartDownloadWrapper>
            )}
          </div>

          {/* Preferred Formats Requested vs Actual Assets Helpful */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isChartAllowed('student_learning_formats_pre') && (
              <ChartDownloadWrapper tab="student"
                id="learning-formats-pre"
                title="Learning Formats Students Prefer (Before Training)"
                subtitle="Student pre-survey learning-format preferences."
                dataForCsv={charts.student_learning_formats_pre}
              >
                {viewMode === 'charts' ? (
                  <div className="space-y-3 pt-2">
                    {(charts.student_learning_formats_pre || []).map((item: any) => (
                      <div key={item.format} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-800">
                          <span>{item.format}</span>
                          <span>{item.count} ({item.pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 rounded-l-xl">Requested Format</th>
                          <th className="p-2.5">Students</th>
                          <th className="p-2.5 rounded-r-xl">Proportion (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.student_learning_formats_pre || []).map((item: any) => (
                          <tr key={item.format} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{item.format}</td>
                            <td className="p-2.5 font-mono text-slate-700">{item.count}</td>
                            <td className="p-2.5 font-black text-emerald-700">{item.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.student_learning_formats_pre} chartId="learning-formats-pre" />
              </ChartDownloadWrapper>
            )}

            {isChartAllowed('student_helpful_assets_post') && (
              <ChartDownloadWrapper tab="student"
                id="helpful-assets-post"
                title="AI Study Materials Students Found Helpful"
                subtitle="Student post-survey reports of helpful revision materials."
                dataForCsv={charts.student_helpful_assets_post}
              >
                {viewMode === 'charts' ? (
                  <div className="space-y-3 pt-2">
                    {(charts.student_helpful_assets_post || []).map((item: any) => (
                      <div key={item.asset} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-800">
                          <span>{item.asset}</span>
                          <span>{item.count} ({item.pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 rounded-l-xl">Delivered Asset</th>
                          <th className="p-2.5">Students Valued</th>
                          <th className="p-2.5 rounded-r-xl">Proportion (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.student_helpful_assets_post || []).map((item: any) => (
                          <tr key={item.asset} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{item.asset}</td>
                            <td className="p-2.5 font-mono text-slate-700">{item.count}</td>
                            <td className="p-2.5 font-black text-indigo-700">{item.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.student_helpful_assets_post} chartId="helpful-assets-post" />
              </ChartDownloadWrapper>
            )}
          </div>

          {/* Burnout Relief & Study Pack Reliability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isChartAllowed('student_burnout_reduction') && (
              <ChartDownloadWrapper tab="student"
                id="burnout-reduction"
                title="Student Study Fatigue Rating (1–5)"
                subtitle="Student post-survey rating of study fatigue after using the learning assets."
                dataForCsv={charts.student_burnout_reduction}
              >
                {viewMode === 'charts' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 text-center">
                    {(charts.student_burnout_reduction || []).map((item: any) => (
                      <div key={item.rating} className="p-3 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-between text-center space-y-2 shadow-2xs">
                        <MiniRadialRing percent={item.pct} color="#0d9488" size={52} strokeWidth={5} />
                        <div className="w-full">
                          <p className="text-xs font-black text-slate-900">{item.pct}%</p>
                          <p className="text-[10px] font-bold text-slate-600 truncate mt-0.5" title={item.rating}>{item.rating}</p>
                          <p className="text-[9px] font-mono text-slate-400 mt-0.5">{item.count} students</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2 rounded-l-lg">Relief Level</th>
                          <th className="p-2">Count</th>
                          <th className="p-2 rounded-r-lg">Proportion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.student_burnout_reduction || []).map((item: any) => (
                          <tr key={item.rating} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-800">{item.rating}</td>
                            <td className="p-2 font-mono text-slate-600">{item.count}</td>
                            <td className="p-2 font-black text-emerald-700">{item.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.student_burnout_reduction} chartId="burnout-reduction" />
              </ChartDownloadWrapper>
            )}

            {isChartAllowed('student_study_pack_reliability') && (
              <ChartDownloadWrapper tab="student"
                id="study-pack-reliability"
                title="Student Ratings of AI Study-Pack Reliability"
                subtitle="Perceived reliability compared with general online searching."
                dataForCsv={charts.student_study_pack_reliability}
              >
                {viewMode === 'charts' ? (
                  <SvgDonutChart
                    data={(charts.student_study_pack_reliability || []).map((item: any, idx: number) => ({
                      label: item.name,
                      value: item.count,
                      pct: item.pct,
                      color: DONUT_COLORS[idx % DONUT_COLORS.length]
                    }))}
                    centerText={getCategoryShare(charts.student_study_pack_reliability, (item) => /mostly|extremely/i.test(item.name))}
                    centerSub="mostly or extremely reliable"
                    size={160}
                    strokeWidth={20}
                  />
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 rounded-l-xl">Reliability Rating</th>
                          <th className="p-2.5">Students Count</th>
                          <th className="p-2.5 rounded-r-xl">Proportion (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.student_study_pack_reliability || []).map((item: any) => (
                          <tr key={item.name} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                            <td className="p-2.5 font-mono text-slate-700">{item.count}</td>
                            <td className="p-2.5 font-black text-emerald-700">{item.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.student_study_pack_reliability} chartId="study-pack-reliability" />
              </ChartDownloadWrapper>
            )}
          </div>

          {/* Baseline AI Tools & Prior NotebookLM Awareness */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isChartAllowed('student_pre_ai_tools') && (
              <ChartDownloadWrapper tab="student"
                id="pre-ai-tools"
                title="AI Tools Students Used Before Training"
                subtitle="Student pre-survey reports of commonly used AI tools."
                dataForCsv={charts.student_pre_ai_tools}
              >
                {viewMode === 'charts' ? (
                  <SvgDonutChart
                    data={(charts.student_pre_ai_tools || []).map((t: any, idx: number) => ({
                      label: t.tool,
                      value: t.count,
                      pct: t.pct,
                      color: DONUT_COLORS[idx % DONUT_COLORS.length]
                    }))}
                    centerText={getCategoryShare(charts.student_pre_ai_tools, (item) => /chat ?gpt/i.test(item.tool))}
                    centerSub="reported ChatGPT use"
                    size={160}
                    strokeWidth={20}
                  />
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 rounded-l-xl">AI Assistant</th>
                          <th className="p-2.5">User Count</th>
                          <th className="p-2.5 rounded-r-xl">Market Share (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.student_pre_ai_tools || []).map((t: any) => (
                          <tr key={t.tool} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{t.tool}</td>
                            <td className="p-2.5 font-mono text-slate-700">{t.count}</td>
                            <td className="p-2.5 font-black text-slate-800">{t.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.student_pre_ai_tools} chartId="pre-ai-tools" />
              </ChartDownloadWrapper>
            )}

            {isChartAllowed('student_notebooklm_awareness') && (
              <ChartDownloadWrapper tab="student"
                id="notebooklm-awareness"
                title="Students’ Prior NotebookLM Awareness"
                subtitle="Student pre-survey awareness and use of source-grounded study tools."
                dataForCsv={charts.student_notebooklm_awareness}
              >
                {viewMode === 'charts' ? (
                  <SvgDonutChart
                    data={(charts.student_notebooklm_awareness || []).map((nb: any, idx: number) => ({
                      label: nb.status,
                      value: nb.count,
                      pct: nb.pct,
                      color: DONUT_COLORS[idx % DONUT_COLORS.length]
                    }))}
                    centerText={getCategoryShare(charts.student_notebooklm_awareness, (item) => /unfamiliar/i.test(item.status))}
                    centerSub="unfamiliar before training"
                    size={160}
                    strokeWidth={20}
                  />
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 rounded-l-xl">Prior Awareness Level</th>
                          <th className="p-2.5">Students Count</th>
                          <th className="p-2.5 rounded-r-xl">Proportion (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.student_notebooklm_awareness || []).map((nb: any) => (
                          <tr key={nb.status} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{nb.status}</td>
                            <td className="p-2.5 font-mono text-slate-700">{nb.count}</td>
                            <td className="p-2.5 font-black text-indigo-700">{nb.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.student_notebooklm_awareness} chartId="notebooklm-awareness" />
              </ChartDownloadWrapper>
            )}
          </div>

          {/* Audio Study Aids & Hours Saved vs Familiarity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isChartAllowed('student_audio_aids') && (
              <ChartDownloadWrapper tab="student"
                id="audio-aids"
                title="Student Use of Audio and Digital Study Aids"
                subtitle="Student pre-survey reports of audio and text-to-speech use."
                dataForCsv={charts.student_audio_aids}
              >
                {viewMode === 'charts' ? (
                  <div className="space-y-3 pt-2">
                    {(charts.student_audio_aids || []).map((a: any) => (
                      <div key={a.habit} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-800">
                          <span>{a.habit}</span>
                          <span>{a.count} ({a.pct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-amber-600 rounded-full" style={{ width: `${a.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 rounded-l-xl">Usage Habit</th>
                          <th className="p-2.5">Students</th>
                          <th className="p-2.5 rounded-r-xl">Proportion (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.student_audio_aids || []).map((a: any) => (
                          <tr key={a.habit} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{a.habit}</td>
                            <td className="p-2.5 font-mono text-slate-700">{a.count}</td>
                            <td className="p-2.5 font-black text-amber-700">{a.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.student_audio_aids} chartId="audio-aids" />
              </ChartDownloadWrapper>
            )}

            {isChartAllowed('student_workshop_interest') && (
              <ChartDownloadWrapper tab="student"
                id="workshop-interest"
                title="Student Interest in the Training Workshop"
                subtitle="Student pre-survey interest in joining the workshop."
                dataForCsv={charts.student_workshop_interest}
              >
                {viewMode === 'charts' ? (
                  <SvgDonutChart
                    data={(charts.student_workshop_interest || []).map((item: any, idx: number) => ({
                      label: item.interest,
                      value: item.count,
                      pct: item.pct,
                      color: DONUT_COLORS[idx % DONUT_COLORS.length]
                    }))}
                    centerText={getCategoryShare(charts.student_workshop_interest, (item) => /highly interested/i.test(item.interest))}
                    centerSub="highly interested"
                    size={160}
                    strokeWidth={20}
                  />
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 rounded-l-xl">Workshop Interest Level</th>
                          <th className="p-2.5">Students Count</th>
                          <th className="p-2.5 rounded-r-xl">Proportion (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.student_workshop_interest || []).map((item: any) => (
                          <tr key={item.interest} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{item.interest}</td>
                            <td className="p-2.5 font-mono text-slate-700">{item.count}</td>
                            <td className="p-2.5 font-black text-emerald-700">{item.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.student_workshop_interest} chartId="workshop-interest" />
              </ChartDownloadWrapper>
            )}
          </div>

          {/* Hours Saved vs Baseline Familiarity */}
          {isChartAllowed('student_hours_vs_familiarity') && (
            <ChartDownloadWrapper tab="student"
              id="hours-vs-familiarity"
              title="Estimated Study Hours Saved by Prior AI Experience"
              subtitle="Post-survey hour-range midpoints grouped by baseline familiarity."
              dataForCsv={charts.student_hours_vs_familiarity}
            >
              {viewMode === 'charts' ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center">
                  {(charts.student_hours_vs_familiarity || []).map((lvl: any) => (
                    <div key={lvl.level} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
                      <p className="text-2xl font-black text-emerald-700">{lvl.avgHoursSaved}h</p>
                      <p className="text-xs font-black text-slate-800">{lvl.level}</p>
                      <p className="text-[10px] font-bold text-slate-400">Avg Weekly Saved</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-2 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 rounded-l-xl">Baseline AI Experience</th>
                        <th className="p-2.5 rounded-r-xl text-right">Avg Weekly Hours Saved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(charts.student_hours_vs_familiarity || []).map((lvl: any) => (
                        <tr key={lvl.level} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{lvl.level}</td>
                          <td className="p-2.5 font-mono font-black text-right text-emerald-700">{lvl.avgHoursSaved} hours</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <ExplanationCallout data={charts.student_hours_vs_familiarity} chartId="hours-vs-familiarity" />
            </ChartDownloadWrapper>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: FACULTY & TEACHERS
         ========================================================================= */}
      {(renderAllForExport || activeTab === 'faculty') && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Faculty Multi-Axis Radar */}
          {isChartAllowed('teacher_impact_radar') && (
            <ChartDownloadWrapper tab="faculty"
              id="faculty-radar"
              title="Faculty Impact Summary"
              subtitle="Faculty post-survey outcomes; some radar reference values are estimates."
              dataForCsv={charts.teacher_impact_radar}
              selectableCards={(charts.teacher_impact_radar || []).map((axis: any, idx: number) => ({
                id: axis.axis,
                label: axis.axis,
                index: idx + 1,
                baselinePre: axis.baselinePre,
                postTraining: axis.postTraining,
                gain: axis.postTraining - axis.baselinePre,
              }))}
            >
              {viewMode === 'charts' ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                  {(charts.teacher_impact_radar || []).map((axis: any, idx: number) => {
                    const gain = axis.postTraining - axis.baselinePre;
                    return (
                      <div key={axis.axis} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700">
                            #{idx + 1}
                          </span>
                          <p className="text-xs font-black text-slate-800">{axis.axis}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-400">Pre:</span>
                            <span className="text-slate-600">{axis.baselinePre}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full bg-slate-400 rounded-full" style={{ width: `${axis.baselinePre}%` }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-indigo-700">Post:</span>
                            <span className="text-indigo-700 font-black">{axis.postTraining}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${axis.postTraining}%` }} />
                          </div>
                        </div>
                        <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black">
                          +{gain}% Faculty Gain
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="pt-2 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 rounded-l-xl">Faculty Impact Metric</th>
                        <th className="p-2.5">Baseline (Pre)</th>
                        <th className="p-2.5">Post-Training Outcome</th>
                        <th className="p-2.5 rounded-r-xl">Net Gain</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(charts.teacher_impact_radar || []).map((axis: any) => (
                        <tr key={axis.axis} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{axis.axis}</td>
                          <td className="p-2.5 text-slate-600">{axis.baselinePre}%</td>
                          <td className="p-2.5 font-bold text-indigo-700">{axis.postTraining}%</td>
                          <td className="p-2.5 font-black text-indigo-800">+{axis.postTraining - axis.baselinePre}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <ExplanationCallout data={charts.teacher_impact_radar} chartId="faculty-radar" />
            </ChartDownloadWrapper>
          )}

          {/* Multilingual Burden & Lesson Prep Reduction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isChartAllowed('teacher_multilingual_burden') && (
              <ChartDownloadWrapper tab="faculty"
                id="multilingual-burden"
                title="Faculty Need for Multilingual Teaching Support"
                subtitle="Teacher pre-survey reports of translation and explanation needs."
                dataForCsv={charts.teacher_multilingual_burden}
              >
                {viewMode === 'charts' ? (
                  <SvgDonutChart
                    data={(charts.teacher_multilingual_burden || []).map((item: any, idx: number) => ({
                      label: item.frequency,
                      value: item.count,
                      pct: item.pct,
                      color: DONUT_COLORS[idx % DONUT_COLORS.length]
                    }))}
                    centerText={getCategoryShare(charts.teacher_multilingual_burden, (item) => !/rarely|not applicable/i.test(item.frequency))}
                    centerSub="report a translation need"
                    size={160}
                    strokeWidth={20}
                  />
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 rounded-l-xl">Translation Demand Frequency</th>
                          <th className="p-2.5">Faculty Count</th>
                          <th className="p-2.5 rounded-r-xl">Proportion (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.teacher_multilingual_burden || []).map((item: any) => (
                          <tr key={item.frequency} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{item.frequency}</td>
                            <td className="p-2.5 font-mono text-slate-700">{item.count}</td>
                            <td className="p-2.5 font-black text-amber-700">{item.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.teacher_multilingual_burden} chartId="multilingual-burden" />
              </ChartDownloadWrapper>
            )}

            {isChartAllowed('teacher_prep_reduction') && (
              <ChartDownloadWrapper tab="faculty"
                id="prep-reduction"
                title="Faculty-Reported Lesson Preparation Time Reduction (1–5)"
                subtitle="Distribution of text processing and course preparation time reduction."
                dataForCsv={charts.teacher_prep_reduction}
              >
                {viewMode === 'charts' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 text-center">
                    {(charts.teacher_prep_reduction || []).map((item: any) => (
                      <div key={item.rating} className="p-3 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-between text-center space-y-2 shadow-2xs">
                        <MiniRadialRing percent={item.pct} color="#4f46e5" size={52} strokeWidth={5} />
                        <div className="w-full">
                          <p className="text-xs font-black text-slate-900">{item.pct}%</p>
                          <p className="text-[10px] font-bold text-slate-600 truncate mt-0.5" title={item.rating}>{item.rating}</p>
                          <p className="text-[9px] font-mono text-slate-400 mt-0.5">{item.count} faculty</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2 rounded-l-lg">Rating Level</th>
                          <th className="p-2">Count</th>
                          <th className="p-2 rounded-r-lg">Proportion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.teacher_prep_reduction || []).map((item: any) => (
                          <tr key={item.rating} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-800">{item.rating}</td>
                            <td className="p-2 font-mono text-slate-600">{item.count}</td>
                            <td className="p-2 font-black text-indigo-700">{item.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.teacher_prep_reduction} chartId="prep-reduction" />
              </ChartDownloadWrapper>
            )}
          </div>

          {/* Faculty Burnout & Output Accuracy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isChartAllowed('teacher_burnout') && (
              <ChartDownloadWrapper tab="faculty"
                id="faculty-burnout"
                title="Faculty-Reported Teaching Fatigue (1–5)"
                subtitle="Teacher post-survey ratings of fatigue after using AI tools."
                dataForCsv={charts.teacher_burnout}
              >
                {viewMode === 'charts' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 text-center">
                    {(charts.teacher_burnout || []).map((item: any) => (
                      <div key={item.rating} className="p-3 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-between text-center space-y-2 shadow-2xs">
                        <MiniRadialRing percent={item.pct} color="#059669" size={52} strokeWidth={5} />
                        <div className="w-full">
                          <p className="text-xs font-black text-slate-900">{item.pct}%</p>
                          <p className="text-[10px] font-bold text-slate-600 truncate mt-0.5" title={item.rating}>{item.rating}</p>
                          <p className="text-[9px] font-mono text-slate-400 mt-0.5">{item.count} faculty</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2 rounded-l-lg">Fatigue Relief Level</th>
                          <th className="p-2">Count</th>
                          <th className="p-2 rounded-r-lg">Proportion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.teacher_burnout || []).map((item: any) => (
                          <tr key={item.rating} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-800">{item.rating}</td>
                            <td className="p-2 font-mono text-slate-600">{item.count}</td>
                            <td className="p-2 font-black text-emerald-700">{item.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.teacher_burnout} chartId="faculty-burnout" />
              </ChartDownloadWrapper>
            )}

            {isChartAllowed('teacher_output_accuracy') && (
              <ChartDownloadWrapper tab="faculty"
                id="faculty-accuracy"
                title="Faculty Ratings of AI Output Accuracy"
                subtitle="Source-grounded verification rating from university educators."
                dataForCsv={charts.teacher_output_accuracy}
              >
                {viewMode === 'charts' ? (
                  <SvgDonutChart
                    data={(charts.teacher_output_accuracy || []).map((item: any, idx: number) => ({
                      label: item.name,
                      value: item.count,
                      pct: item.pct,
                      color: DONUT_COLORS[idx % DONUT_COLORS.length]
                    }))}
                    centerText={getCategoryShare(charts.teacher_output_accuracy, (item) => !/inaccurate|hallucination/i.test(item.name))}
                    centerSub="rated at least moderately accurate"
                    size={160}
                    strokeWidth={20}
                  />
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 rounded-l-xl">Rigor & Accuracy Rating</th>
                          <th className="p-2.5">Faculty Count</th>
                          <th className="p-2.5 rounded-r-xl">Proportion (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.teacher_output_accuracy || []).map((item: any) => (
                          <tr key={item.name} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                            <td className="p-2.5 font-mono text-slate-700">{item.count}</td>
                            <td className="p-2.5 font-black text-indigo-700">{item.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.teacher_output_accuracy} chartId="faculty-accuracy" />
              </ChartDownloadWrapper>
            )}
          </div>

          {/* Goals vs Measured Outcomes */}
          {isChartAllowed('teacher_goals_vs_outcomes') && (
            <ChartDownloadWrapper tab="faculty"
              id="faculty-goals-outcomes"
              title="Faculty Workshop Goals and Post-Training Responses"
              subtitle="Teacher pre-survey goals compared with related post-survey responses."
              dataForCsv={charts.teacher_goals_vs_outcomes}
            >
              {viewMode === 'charts' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-center">
                  {(charts.teacher_goals_vs_outcomes || []).map((item: any) => (
                    <div key={item.goal} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
                      <p className="text-xs font-black text-slate-900 line-clamp-2">{item.goal}</p>
                      <div className="flex items-center justify-between text-[11px] font-bold px-1">
                        <span className="text-slate-400">Pre Goal: {item.requestedPct}%</span>
                        <span className="text-emerald-700 font-black">Post: {item.achievedPct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${item.achievedPct}%` }} />
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                        +{Number((item.achievedPct - item.requestedPct).toFixed(1))}% Net Gain
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-2 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 rounded-l-xl">Pedagogical Goal</th>
                        <th className="p-2.5">Pre-Survey Requested</th>
                        <th className="p-2.5">Post-Survey Measured Outcome</th>
                        <th className="p-2.5 rounded-r-xl">Achievement Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(charts.teacher_goals_vs_outcomes || []).map((item: any) => (
                        <tr key={item.goal} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{item.goal}</td>
                          <td className="p-2.5 text-slate-600 font-bold">{item.requestedPct}%</td>
                          <td className="p-2.5 text-emerald-700 font-extrabold">{item.achievedPct}%</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                              Exceeded
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <ExplanationCallout data={charts.teacher_goals_vs_outcomes} chartId="faculty-goals-outcomes" />
            </ChartDownloadWrapper>
          )}

          {/* Faculty Future Adoption & Institutional Affiliation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isChartAllowed('teacher_future_adoption') && (
              <ChartDownloadWrapper tab="faculty"
                id="faculty-future-adoption"
                title="Faculty Plans to Continue Using NotebookLM"
                subtitle="Teacher post-survey intentions for future use."
                dataForCsv={charts.teacher_future_adoption}
              >
                {viewMode === 'charts' ? (
                  <SvgDonutChart
                    data={(charts.teacher_future_adoption || []).map((item: any, idx: number) => ({
                      label: item.name,
                      value: item.count,
                      pct: item.pct,
                      color: DONUT_COLORS[idx % DONUT_COLORS.length]
                    }))}
                    centerText={getCategoryShare(charts.teacher_future_adoption, (_item, index) => index < 2)}
                    centerSub="intend to continue"
                    size={160}
                    strokeWidth={20}
                  />
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 rounded-l-xl">Adoption Intent</th>
                          <th className="p-2.5">Faculty Count</th>
                          <th className="p-2.5 rounded-r-xl">Proportion (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.teacher_future_adoption || []).map((item: any) => (
                          <tr key={item.name} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                            <td className="p-2.5 font-mono text-slate-700">{item.count}</td>
                            <td className="p-2.5 font-black text-indigo-700">{item.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.teacher_future_adoption} chartId="faculty-future-adoption" />
              </ChartDownloadWrapper>
            )}

            {isChartAllowed('institution_breakdown_teachers') && (
              <ChartDownloadWrapper tab="faculty"
                id="faculty-affiliation"
                title="Faculty Institution (IIUI or Other)"
                subtitle="Teacher pre- and post-survey affiliation estimates."
                dataForCsv={charts.institution_breakdown_teachers}
              >
                {viewMode === 'charts' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {(charts.institution_breakdown_teachers || []).map((item: any, idx: number) => (
                      <div key={item.institution} className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-slate-900 leading-snug">{item.institution}</p>
                          <MiniRadialRing percent={item.postPct} color={idx === 0 ? '#059669' : '#6366f1'} size={48} strokeWidth={5} />
                        </div>
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-xs font-bold text-slate-600">
                            <span>Pre-Survey:</span>
                            <span className="font-mono">{item.prePct}%</span>
                          </div>
                          <div className="flex justify-between text-xs font-black text-slate-900">
                            <span>Post-Survey:</span>
                            <span className="font-mono text-emerald-700">{item.postPct}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 rounded-l-xl">Institution Cohort</th>
                          <th className="p-2.5">Pre-Survey (%)</th>
                          <th className="p-2.5 rounded-r-xl">Post-Survey (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.institution_breakdown_teachers || []).map((item: any) => (
                          <tr key={item.institution} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{item.institution}</td>
                            <td className="p-2.5 font-mono text-slate-700">{item.prePct}%</td>
                            <td className="p-2.5 font-black text-emerald-700">{item.postPct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.institution_breakdown_teachers} chartId="faculty-affiliation" />
              </ChartDownloadWrapper>
            )}
          </div>

          {/* Teacher Seniority / Experience Levels */}
          {isChartAllowed('teacher_experience_levels') && (
            <ChartDownloadWrapper tab="faculty"
              id="teacher-experience"
              title="Faculty Teaching Experience"
              subtitle="Distribution based on available teacher survey answers."
              dataForCsv={charts.teacher_experience_levels}
            >
              {viewMode === 'charts' ? (
                charts.teacher_experience_levels?.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-center">
                    {charts.teacher_experience_levels.map((item: any, idx: number) => (
                      <div key={item.range} className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-between text-center space-y-2 shadow-2xs">
                        <MiniRadialRing percent={item.pct} color={DONUT_COLORS[idx % DONUT_COLORS.length]} size={56} strokeWidth={5} />
                        <div className="w-full">
                          <p className="text-sm font-black text-slate-900">{item.pct}%</p>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">{item.range}</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">{item.count} educators</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm font-medium text-slate-500">
                    No teaching-experience answers are available in the teacher pre-survey data.
                  </p>
                )
              ) : (
                charts.teacher_experience_levels?.length ? (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 rounded-l-xl">Experience Tier</th>
                          <th className="p-2.5">Faculty Count</th>
                          <th className="p-2.5 rounded-r-xl">Proportion (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {charts.teacher_experience_levels.map((item: any) => (
                          <tr key={item.range} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{item.range}</td>
                            <td className="p-2.5 font-mono text-slate-700">{item.count}</td>
                            <td className="p-2.5 font-black text-indigo-700">{item.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm font-medium text-slate-500">
                    No teaching-experience answers are available in the teacher pre-survey data.
                  </p>
                )
              )}
              <ExplanationCallout data={charts.teacher_experience_levels} chartId="teacher-experience" />
            </ChartDownloadWrapper>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: DEMOGRAPHICS & OUTREACH
         ========================================================================= */}
      {(renderAllForExport || activeTab === 'demographics') && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isChartAllowed('department_participation') && (
              <ChartDownloadWrapper tab="demographics"
                id="dept-participation"
                title="Responses by Department"
                subtitle="Departmental reach across participating faculties."
                dataForCsv={charts.department_participation}
              >
                {viewMode === 'charts' ? (
                  <div className="space-y-2 pt-2">
                    {(charts.department_participation || []).map((d: any) => (
                      <div key={d.department} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold">
                        <span>{d.department}</span>
                        <span className="text-emerald-700 font-extrabold">{d.count} responses</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2 rounded-l-lg">Academic Department</th>
                          <th className="p-2 rounded-r-lg text-right">Responses</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.department_participation || []).map((d: any) => (
                          <tr key={d.department} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-900">{d.department}</td>
                            <td className="p-2 font-mono text-right font-extrabold text-emerald-700">{d.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.department_participation} chartId="dept-participation" />
              </ChartDownloadWrapper>
            )}

            {isChartAllowed('semester_participation') && (
              <ChartDownloadWrapper tab="demographics"
                id="semester-distribution"
                title="Student Responses by Semester"
                subtitle="Student pre-survey cohort distribution."
                dataForCsv={charts.semester_participation}
              >
                {viewMode === 'charts' ? (
                  <div className="space-y-2 pt-2">
                    {(charts.semester_participation || []).map((s: any) => (
                      <div key={s.semester} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold">
                        <span>{s.semester}</span>
                        <span className="text-indigo-700 font-extrabold">{s.count} students</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2 rounded-l-lg">Intake Semester</th>
                          <th className="p-2 rounded-r-lg text-right">Enrolled Students</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.semester_participation || []).map((s: any) => (
                          <tr key={s.semester} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-900">{s.semester}</td>
                            <td className="p-2 font-mono text-right font-extrabold text-indigo-700">{s.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.semester_participation} chartId="semester-distribution" />
              </ChartDownloadWrapper>
            )}
          </div>

          {/* Misrouted Submissions Quality Audit */}
          {isChartAllowed('misrouted_submissions_audit') && (
            <ChartDownloadWrapper tab="demographics"
              id="misrouted-audit"
              title="Survey Routing Check"
              subtitle="Counts records identified and corrected by the survey pipeline."
              dataForCsv={charts.misrouted_submissions_audit}
            >
              {viewMode === 'charts' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-center">
                  {(charts.misrouted_submissions_audit || []).map((audit: any) => (
                    <div key={audit.category} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                        {audit.status}
                      </span>
                      <p className="text-xs font-extrabold text-slate-800">{audit.category}</p>
                      <p className="text-lg font-black text-slate-900">{audit.count}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-2 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 rounded-l-xl">Audit Category</th>
                        <th className="p-2.5">Data Pipeline Status</th>
                        <th className="p-2.5 rounded-r-xl text-right">Record Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(charts.misrouted_submissions_audit || []).map((audit: any) => (
                        <tr key={audit.category} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{audit.category}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                              {audit.status}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-right font-black text-slate-900">{audit.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <ExplanationCallout data={charts.misrouted_submissions_audit} chartId="misrouted-audit" />
            </ChartDownloadWrapper>
          )}

          {/* Institutional Breakdown (Students) & Department Heatmap */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isChartAllowed('institution_breakdown_students') && (
              <ChartDownloadWrapper tab="demographics"
                id="student-institution"
                title="Student Institution (IIUI or Other)"
                subtitle="Student post-survey institution responses."
                dataForCsv={charts.institution_breakdown_students}
              >
                {viewMode === 'charts' ? (
                  <SvgDonutChart
                    data={(charts.institution_breakdown_students || []).map((item: any, idx: number) => ({
                      label: item.institution,
                      value: item.count,
                      pct: item.pct,
                      color: DONUT_COLORS[idx % DONUT_COLORS.length]
                    }))}
                    centerText={getCategoryShare(charts.institution_breakdown_students, (item) => /iiui|islamic/i.test(item.institution))}
                    centerSub="from IIUI"
                    size={160}
                    strokeWidth={20}
                  />
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 rounded-l-xl">Affiliated Institution</th>
                          <th className="p-2.5">Participant Count</th>
                          <th className="p-2.5 rounded-r-xl">Proportion (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.institution_breakdown_students || []).map((item: any) => (
                          <tr key={item.institution} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{item.institution}</td>
                            <td className="p-2.5 font-mono text-slate-700">{item.count}</td>
                            <td className="p-2.5 font-black text-emerald-700">{item.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.institution_breakdown_students} chartId="student-institution" />
              </ChartDownloadWrapper>
            )}

            {isChartAllowed('department_familiarity_heatmap') && (
              <ChartDownloadWrapper tab="demographics"
                id="dept-heatmap"
                title="Approximate AI Familiarity by Department"
                subtitle="Average familiarity score mapped from available pre-survey answers."
                dataForCsv={charts.department_familiarity_heatmap}
              >
                {viewMode === 'charts' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center">
                    {(charts.department_familiarity_heatmap || []).map((d: any) => (
                      <div key={d.dept} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <p className="text-base font-black text-indigo-700">{d.avgScore}/5</p>
                        <p className="text-[10px] font-bold text-slate-700 truncate">{d.dept}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2 overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 rounded-l-xl">Academic Department</th>
                          <th className="p-2.5 rounded-r-xl text-right">Avg AI Competency Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(charts.department_familiarity_heatmap || []).map((d: any) => (
                          <tr key={d.dept} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{d.dept}</td>
                            <td className="p-2.5 font-mono font-black text-right text-indigo-700">{d.avgScore} / 5.0</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ExplanationCallout data={charts.department_familiarity_heatmap} chartId="dept-heatmap" />
              </ChartDownloadWrapper>
            )}
          </div>

          {/* Timeline Velocity from Google Form Timestamps */}
          {isChartAllowed('timeline_velocity') && (
            <ChartDownloadWrapper tab="demographics"
              id="timeline-velocity"
              title="Survey Responses by Week"
              subtitle="Response counts grouped into the configured survey weeks."
              dataForCsv={charts.timeline_velocity}
            >
              {viewMode === 'charts' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-center">
                  {(charts.timeline_velocity || []).map((tw: any) => (
                    <div key={tw.week} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                      <p className="text-xl font-black text-emerald-700">{tw.responses}</p>
                      <p className="text-xs font-extrabold text-slate-800">{tw.week}</p>
                      <p className="text-[10px] text-slate-400">Verified Submissions</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-2 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 rounded-l-xl">Training Timeline Phase</th>
                        <th className="p-2.5 rounded-r-xl text-right">Total Submissions Recorded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(charts.timeline_velocity || []).map((tw: any) => (
                        <tr key={tw.week} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{tw.week}</td>
                          <td className="p-2.5 font-mono font-black text-right text-emerald-700">{tw.responses}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <ExplanationCallout data={charts.timeline_velocity} chartId="timeline-velocity" />
            </ChartDownloadWrapper>
          )}
        </div>
      )}

      {/* =========================================================================
          OPERATIONAL SECTION (Bottom): Certificate Registry & Webhook Sync
         ========================================================================= */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900">Official Certificate Verification Registry</h3>
            <p className="text-[11px] text-slate-500">Live issued certificates linked to verified assessments.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search certificate or name..."
                value={certSearch}
                onChange={e => setCertSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* Sync Trigger */}
            <button
              onClick={handleManualSync}
              disabled={syncingSheets}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingSheets ? 'animate-spin' : ''}`} />
              <span>{syncingSheets ? 'Syncing...' : 'Sync Engine Check'}</span>
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Certificate Table */}
        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
          {filteredCerts.length > 0 ? (
            filteredCerts.slice(0, 15).map((c: any, idx: number) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-slate-900">{c.recipient_name}</p>
                    {c.name_change_used && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        Edited (1x)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">{c.department}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {c.certificate_id}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{c.completion_date}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs font-bold">
              No certificates match your search query.
            </div>
          )}
        </div>
      </div>

      {/* Admin Modals */}
      <MemberChartPermissionsModal
        isOpen={showPermsModal}
        onClose={() => setShowPermsModal(false)}
      />

      <GuestAccessModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
      />
    </div>
    </ChartDataHelpProvider>
  );
}
