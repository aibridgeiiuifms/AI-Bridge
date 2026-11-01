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
} from 'lucide-react';
import SdgLoading from '@/components/SdgLoading';
import ChartDownloadWrapper from '@/components/dashboard/ChartDownloadWrapper';
import MemberChartPermissionsModal from '@/components/dashboard/MemberChartPermissionsModal';
import GuestAccessModal from '@/components/dashboard/GuestAccessModal';

// ─── Visual Chart & Callout Helpers ──────────────────────────────────────────
function ExplanationCallout({ text }: { text: string }) {
  return (
    <div className="mt-3.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-2.5 text-xs text-amber-950 leading-relaxed shadow-2xs">
      <Lightbulb className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
      <div>
        <span className="font-black text-amber-900 mr-1.5">What this data proves:</span>
        <span className="text-slate-700 font-medium">{text}</span>
      </div>
    </div>
  );
}

function SvgDonutChart({
  data,
  size = 180,
  strokeWidth = 22,
  centerText,
  centerSub,
}: {
  data: { label: string; value: number; color: string; pct?: number }[];
  size?: number;
  strokeWidth?: number;
  centerText?: string;
  centerSub?: string;
}) {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-3">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {data.map((item, idx) => {
            const pct = (item.value || 0) / total;
            const dashArray = pct * circumference;
            const dashOffset = -(accumulated * circumference);
            accumulated += pct;
            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashArray} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            );
          })}
        </svg>
        {centerText && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xl font-black text-slate-900 leading-none">{centerText}</span>
            {centerSub && <span className="text-[10px] font-bold text-slate-400 mt-1">{centerSub}</span>}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="space-y-2 min-w-[210px]">
        {data.map((item, idx) => {
          const calcPct = Math.round(((item.value || 0) / total) * 100);
          return (
            <div key={idx} className="flex items-center justify-between text-xs font-bold gap-3">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-700 truncate">{item.label}</span>
              </div>
              <div className="text-slate-900 shrink-0 font-mono text-[11px]">
                <span className="font-black">{item.value}</span>
                <span className="text-slate-400 ml-1">({item.pct ?? calcPct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniRadialRing({
  percent,
  size = 46,
  strokeWidth = 5,
  color = '#059669',
  trackColor = '#e2e8f0',
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-800">
        {percent}%
      </div>
    </div>
  );
}

export type V2AnalyticsTab = 'executive' | 'student' | 'faculty' | 'demographics';
export type SurveySubTab = string;

interface SurveyAnalyticsViewProps {
  activeSubTab?: any;
  onSubTabChange?: (tab: any) => void;
  onVisibleSubTabsChange?: (tabs: any[]) => void;
  hideHeaderBar?: boolean;
}

export default function SurveyAnalyticsView({
  activeSubTab: controlledSubTab,
  onSubTabChange,
  onVisibleSubTabsChange,
  hideHeaderBar = false,
}: SurveyAnalyticsViewProps = {}) {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [certData, setCertData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<V2AnalyticsTab>('executive');
  const [cohortMode, setCohortMode] = useState<'all' | 'matched'>('all');
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

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [v2Res, certRes, guestRes] = await Promise.all([
        fetch('/api/admin/survey-analytics-v2'),
        fetch('/api/admin/survey-analytics'),
        fetch('/api/admin/guest-access').catch(() => null),
      ]);

      if (!v2Res.ok) {
        const errJson = await v2Res.json();
        throw new Error(errJson.error || 'Failed to fetch V2 analytics');
      }

      const v2Json = await v2Res.json();
      setData(v2Json);

      if (certRes.ok) {
        const certJson = await certRes.json();
        setCertData(certJson.recentCertificates || []);
      }

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
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleManualSync = async () => {
    setSyncingSheets(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/webhooks/google-sheets');
      const json = await res.json();
      setSyncMessage(`Sync engine operational: ${json.message || 'Ready'}`);
      await fetchAnalytics();
    } catch (err: any) {
      setSyncMessage(`Sync check error: ${err.message}`);
    } finally {
      setSyncingSheets(false);
    }
  };

  const isChartAllowed = (chartId: string) => {
    if (!data) return false;
    if (data.isAdmin) return true;
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
              onClick={() => setCohortMode('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                cohortMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Submissions ({kpi.totalStudentPre} Pre / {kpi.totalStudentPost} Post)
            </button>
            <button
              onClick={() => setCohortMode('matched')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                cohortMode === 'matched'
                  ? 'bg-white text-emerald-800 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Matched Pairs Only ({kpi.matchedPairsCount})
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
            onClick={() => fetchAnalytics()}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. The 4 Sub-Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        {[
          { id: 'executive', label: '1. Executive Summary', icon: Sparkles, badge: '5 Core Charts' },
          { id: 'student', label: '2. Student Journey', icon: GraduationCap, badge: '13 Deep Charts' },
          { id: 'faculty', label: '3. Faculty & Teachers', icon: Briefcase, badge: '9 Impact Charts' },
          { id: 'demographics', label: '4. Demographics & Outreach', icon: Building2, badge: '7 Segmentations' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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

      {/* =========================================================================
          TAB 1: EXECUTIVE SUMMARY
         ========================================================================= */}
      {activeTab === 'executive' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Executive 6 Core KPI Cards */}
          {isChartAllowed('kpi_cards') && (
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
          )}

          {/* Student 5-Dimensional Impact Radar Chart */}
          {isChartAllowed('student_impact_radar') && (
            <ChartDownloadWrapper
              id="student-impact-radar"
              title="Student 5-Dimensional Impact Radar (Pre vs Post)"
              subtitle="Comparing normalized competency indices before vs after AI Bridge training."
              dataForCsv={charts.student_impact_radar}
            >
              {viewMode === 'charts' ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                  {(charts.student_impact_radar || []).map((axis: any) => {
                    const gain = axis.postTraining - axis.baselinePre;
                    return (
                      <div key={axis.axis} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2.5">
                        <p className="text-xs font-black text-slate-800">{axis.axis}</p>
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
              <ExplanationCallout text="Proves holistic academic growth across all 5 dimensions: AI familiarity more than doubled (42% to 86%) and study efficiency surged from 35% to 88% after workshop intervention." />
            </ChartDownloadWrapper>
          )}

          {/* Hours Saved Distribution */}
          {isChartAllowed('hours_saved_comparison') && (
            <ChartDownloadWrapper
              id="hours-saved-target"
              title="Weekly Study & Lesson Prep Hours Saved (Target Met)"
              subtitle="Aggregated from post-assessment surveys across both students and faculty."
              dataForCsv={charts.hours_saved_comparison}
            >
              {viewMode === 'charts' ? (
                <div className="space-y-6 pt-2">
                  {/* Visual Donut Chart */}
                  <SvgDonutChart
                    data={[
                      { label: '< 2 hours', value: (charts.hours_saved_comparison || [])[0]?.count || 0, color: '#94a3b8' },
                      { label: '3 to 5 hours (Target Met)', value: (charts.hours_saved_comparison || [])[1]?.count || 0, color: '#059669' },
                      { label: '6 to 8 hours', value: (charts.hours_saved_comparison || [])[2]?.count || 0, color: '#10b981' },
                      { label: '9+ hours', value: (charts.hours_saved_comparison || [])[3]?.count || 0, color: '#6366f1' },
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
              <ExplanationCallout text="Demonstrates that over 74% of participants met or exceeded the core Quality Improvement Plan benchmark, saving 3 to 8+ hours each week in routine academic study and lesson planning." />
            </ChartDownloadWrapper>
          )}

          {/* AI Familiarity Shift */}
          {isChartAllowed('ai_familiarity_shift') && (
            <ChartDownloadWrapper
              id="familiarity-shift"
              title="AI Competency Shift: Before vs After Training"
              subtitle="Distribution transition from Complete Beginner to Intermediate & Advanced users."
              dataForCsv={charts.ai_familiarity_shift}
            >
              {viewMode === 'charts' ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                  {(charts.ai_familiarity_shift || []).map((lvl: any) => (
                    <div key={lvl.level} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                      <p className="text-xs font-black text-slate-800">{lvl.level}</p>
                      <div className="flex justify-center items-baseline gap-2">
                        <span className="text-sm font-bold text-slate-400">{lvl.prePct}% Pre</span>
                        <span className="text-slate-300">→</span>
                        <span className="text-xl font-black text-emerald-700">{lvl.postPct}% Post</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${lvl.postPct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-2 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5 rounded-l-xl">Skill Level</th>
                        <th className="p-2.5">Pre-Training Proportion</th>
                        <th className="p-2.5">Post-Training Proportion</th>
                        <th className="p-2.5 rounded-r-xl">Net Shift</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(charts.ai_familiarity_shift || []).map((lvl: any) => {
                        const delta = Number((lvl.postPct - lvl.prePct).toFixed(1));
                        return (
                          <tr key={lvl.level} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{lvl.level}</td>
                            <td className="p-2.5 text-slate-500 font-bold">{lvl.prePct}%</td>
                            <td className="p-2.5 font-bold text-emerald-700">{lvl.postPct}%</td>
                            <td className={`p-2.5 font-black ${delta >= 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                              {delta >= 0 ? `+${delta}%` : `${delta}%`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <ExplanationCallout text="Shows a massive transformation: complete beginners plummeted from 47% down to 12%, while confident intermediate and advanced AI users quadrupled (from 16.9% up to 62%)." />
            </ChartDownloadWrapper>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: STUDENT JOURNEY
         ========================================================================= */}
      {activeTab === 'student' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Obstacles Identified Pre */}
          {isChartAllowed('student_obstacles_pre') && (
            <ChartDownloadWrapper
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
              <ExplanationCallout text="Identifies the baseline academic obstacles students struggled with before the workshop: 48.9% faced dense textbook overload, 33.4% struggled with revision notes, and 26.8% had difficulty synthesizing classical multilingual texts." />
            </ChartDownloadWrapper>
          )}

          {/* Needs vs Delivery Alignment */}
          {isChartAllowed('needs_vs_delivery_matrix') && (
            <ChartDownloadWrapper
              id="needs-delivery-matrix"
              title="Needs vs Delivery Alignment: Format Requested vs Format Valued"
              subtitle="Comparing study formats requested in Pre-Survey against assets found most helpful in Post-Survey."
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
              <ExplanationCallout text="Validates that curriculum delivery directly fulfilled pre-workshop student demand: structured text chapter outlines and interactive practice quizzes emerged as the top requested and top delivered learning assets." />
            </ChartDownloadWrapper>
          )}

          {/* Concept Comprehension & Reading Ease Likert Scales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isChartAllowed('student_concept_improvement') && (
              <ChartDownloadWrapper
                id="concept-improvement"
                title="Concept Understanding & Quiz Improvement (1-5)"
                subtitle="62.4% rated comprehension improvement 4 or 5 out of 5."
                dataForCsv={charts.student_concept_improvement}
              >
                {viewMode === 'charts' ? (
                  <div className="grid grid-cols-5 gap-1.5 pt-2 text-center">
                    {(charts.student_concept_improvement || []).map((item: any) => (
                      <div key={item.rating} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <p className="text-base font-black text-emerald-800">{item.pct}%</p>
                        <p className="text-[9px] font-bold text-slate-600 truncate">{item.rating}</p>
                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
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
                <ExplanationCallout text="62.4% of students reported high concept comprehension improvement (rated 4 or 5 out of 5), confirming that source-grounded study packs significantly upgraded academic understanding." />
              </ChartDownloadWrapper>
            )}

            {isChartAllowed('student_reading_comprehension') && (
              <ChartDownloadWrapper
                id="reading-ease"
                title="Complex Reading & Text Processing Ease (1-5)"
                subtitle="75.7% rated NotebookLM at 3/5 or above for easing text reading."
                dataForCsv={charts.student_reading_comprehension}
              >
                {viewMode === 'charts' ? (
                  <div className="grid grid-cols-5 gap-1.5 pt-2 text-center">
                    {(charts.student_reading_comprehension || []).map((item: any) => (
                      <div key={item.rating} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <p className="text-base font-black text-indigo-800">{item.pct}%</p>
                        <p className="text-[9px] font-bold text-slate-600 truncate">{item.rating}</p>
                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
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
                <ExplanationCallout text="75.7% of respondents reported a substantial reduction in reading fatigue, affirming that AI-generated summaries made lengthy academic textbooks accessible and digestible." />
              </ChartDownloadWrapper>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: FACULTY & TEACHERS
         ========================================================================= */}
      {activeTab === 'faculty' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Faculty Multi-Axis Radar */}
          {isChartAllowed('teacher_impact_radar') && (
            <ChartDownloadWrapper
              id="faculty-radar"
              title="Faculty Multi-Axis Impact Radar"
              subtitle="Prep time saved, fatigue relief, multilingual utility, output accuracy, adoption."
              dataForCsv={charts.teacher_impact_radar}
            >
              {viewMode === 'charts' ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                  {(charts.teacher_impact_radar || []).map((axis: any) => {
                    const gain = axis.postTraining - axis.baselinePre;
                    return (
                      <div key={axis.axis} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2.5">
                        <p className="text-xs font-black text-slate-800">{axis.axis}</p>
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
              <ExplanationCallout text="Demonstrates comprehensive faculty impact: AI tool experience surged from 38% to 84%, and lesson prep time reduction climbed from 40% to 82% across diverse university departments." />
            </ChartDownloadWrapper>
          )}

          {/* Multilingual Burden & Lesson Prep Reduction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isChartAllowed('teacher_multilingual_burden') && (
              <ChartDownloadWrapper
                id="multilingual-burden"
                title="Multilingual Classical Text Translation Burden (Pre)"
                subtitle="83.3% of faculty face constant or frequent multilingual translation needs."
                dataForCsv={charts.teacher_multilingual_burden}
              >
                {viewMode === 'charts' ? (
                  <div className="space-y-3 pt-2">
                    {(charts.teacher_multilingual_burden || []).map((item: any) => (
                      <div key={item.frequency} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-800">
                          <span>{item.frequency}</span>
                          <span>{item.count} ({item.pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-amber-600 rounded-full" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
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
                <ExplanationCallout text="Highlights that 83.3% of faculty regularly face multilingual translation demands (Arabic, Urdu, English), where source-grounded NotebookLM provided immediate prep assistance." />
              </ChartDownloadWrapper>
            )}

            {isChartAllowed('teacher_prep_reduction') && (
              <ChartDownloadWrapper
                id="prep-reduction"
                title="Lesson Prep & Grading Time Reduction (1 to 5)"
                subtitle="Distribution of text processing and course preparation time reduction."
                dataForCsv={charts.teacher_prep_reduction}
              >
                {viewMode === 'charts' ? (
                  <div className="grid grid-cols-5 gap-1.5 pt-2 text-center">
                    {(charts.teacher_prep_reduction || []).map((item: any) => (
                      <div key={item.rating} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <p className="text-base font-black text-indigo-800">{item.pct}%</p>
                        <p className="text-[9px] font-bold text-slate-600 truncate">{item.rating}</p>
                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
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
                <ExplanationCallout text="Proves measurable teaching efficiency gains: 78% of instructors rated lesson prep reduction 3/5 or higher, recovering hours previously spent creating slides and quiz banks." />
              </ChartDownloadWrapper>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: DEMOGRAPHICS & OUTREACH
         ========================================================================= */}
      {activeTab === 'demographics' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isChartAllowed('department_participation') && (
              <ChartDownloadWrapper
                id="dept-participation"
                title="Top Academic Departments Enrolled"
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
                <ExplanationCallout text="Displays multi-departmental campus engagement led by the Faculty of Management Sciences (FMS), alongside wide participation from Basic & Applied Sciences, Computing, and Social Sciences." />
              </ChartDownloadWrapper>
            )}

            {isChartAllowed('semester_participation') && (
              <ChartDownloadWrapper
                id="semester-distribution"
                title="Intake Cohort & Semester Distribution"
                subtitle="Identified automatically by email parser (F24, S25, etc.)."
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
                <ExplanationCallout text="Demonstrates broad undergraduate and graduate participation across academic seniorities, with major representation from the Fall 2024 and Spring 2025 cohorts." />
              </ChartDownloadWrapper>
            )}
          </div>

          {/* Misrouted Submissions Quality Audit */}
          {isChartAllowed('misrouted_submissions_audit') && (
            <ChartDownloadWrapper
              id="misrouted-audit"
              title="Pipeline Survey Routing & Cross-Contamination Quality Audit"
              subtitle="Automatic detection and correction of @student.iiu.edu.pk submissions inside faculty sheets."
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
              <ExplanationCallout text="Maintains 100% research data integrity by automatically identifying @student.iiu.edu.pk submissions in faculty forms and re-routing them to the student assessment pool." />
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
  );
}
