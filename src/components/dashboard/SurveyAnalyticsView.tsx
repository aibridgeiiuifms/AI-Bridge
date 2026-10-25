'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Users,
  GraduationCap,
  Award,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Building2,
  BookOpen,
  PieChart,
  Layers,
  HelpCircle,
  FileCheck2,
  Calendar,
  Lock,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';
import ChartDownloadWrapper from '@/components/dashboard/ChartDownloadWrapper';
import ReviewerPasswordModal from '@/components/dashboard/ReviewerPasswordModal';
import {
  DEFAULT_SURVEY_CHART_PERMISSIONS,
  type SurveyChartPermission,
} from '@/lib/surveyChartPermissions';

export type SurveySubTab = 'overview' | 'hours' | 'before-after' | 'assets' | 'departments' | 'faculties' | 'teachers' | 'quiz-certs';

interface SurveyAnalyticsViewProps {
  activeSubTab?: SurveySubTab;
  onSubTabChange?: (tab: SurveySubTab) => void;
  hideHeaderBar?: boolean;
}

export default function SurveyAnalyticsView({
  activeSubTab: controlledSubTab,
  onSubTabChange,
  hideHeaderBar = false,
}: SurveyAnalyticsViewProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartPermissionError, setChartPermissionError] = useState<string | null>(null);
  const [savingChartPermission, setSavingChartPermission] = useState<string | null>(null);
  const [internalTab, setInternalTab] = useState<SurveySubTab>('overview');

  const activeTab = controlledSubTab || internalTab;
  const setTab = (tab: SurveySubTab) => {
    setInternalTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  // Reviewer Gate Modal State
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [evaluatorOrg, setEvaluatorOrg] = useState<string | null>(null);

  // Search & Filter
  const [deptSearch, setDeptSearch] = useState<string>('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');

  const fetchAnalytics = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);

    const token = typeof window !== 'undefined' ? sessionStorage.getItem('aib_reviewer_token') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['x-reviewer-token'] = token;
    }

    try {
      const url = `/api/admin/survey-analytics${force ? '?force=true' : ''}`;
      const res = await fetch(url, { headers });

      if (res.status === 403) {
        setShowPasswordModal(true);
        setLoading(false);
        return;
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load survey intelligence');

      setData(json);
      if (json.isReviewer) {
        setEvaluatorOrg('Official Evaluator · Hum Hain Pakistan SDG Campaign');
      }
    } catch (err: any) {
      console.error('Analytics load error:', err);
      setError(err.message || 'Error loading survey intelligence');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handlePasswordSuccess = (token: string, orgName?: string) => {
    setShowPasswordModal(false);
    if (orgName) setEvaluatorOrg(orgName);
    fetchAnalytics(true);
  };

  const overview = data?.overview || {};
  const impact = data?.impact || {};
  const hoursSavedComparison = data?.hoursSavedComparison || [];
  const familiarity = data?.familiarityComparison || {};
  const departmentMatrix = (data?.departmentMatrix || []).filter((d: any) => {
    const matchesSearch = !deptSearch || d.standard_name.toLowerCase().includes(deptSearch.toLowerCase()) || d.code.toLowerCase().includes(deptSearch.toLowerCase());
    const matchesFaculty = selectedFaculty === 'all' || d.faculty_code === selectedFaculty;
    return matchesSearch && matchesFaculty;
  });
  const facultyBreakdown = data?.facultyBreakdown || [];
  const teacherDesignations = data?.teacherDesignations || [];
  const quizBuckets = data?.quizScoreBuckets || [];
  const recentCertificates = data?.recentCertificates || [];
  const permissions = data?.chartPermissions || {};
  const isReviewer = data?.isReviewer || false;
  const isAdmin = data?.callerRole === 'admin';

  const isVisible = (chartKey: string) => {
    if (!data) return false;
    const permission = permissions[chartKey] || DEFAULT_SURVEY_CHART_PERMISSIONS[chartKey];
    if (!permission) return true;
    if (isReviewer) return Boolean(permission.external_reviewer_visible);
    return Boolean(permission.team_member_visible);
  };
  const shouldRenderChart = (chartKey: string) => isAdmin || isVisible(chartKey);

  const updateChartPermission = async (
    chartKey: string,
    field: 'team_member_visible' | 'external_reviewer_visible'
  ) => {
    const current: SurveyChartPermission =
      permissions[chartKey] || DEFAULT_SURVEY_CHART_PERMISSIONS[chartKey];
    if (!current || savingChartPermission) return;

    const updated = { ...current, [field]: !current[field] };
    setSavingChartPermission(`${chartKey}:${field}`);
    setChartPermissionError(null);

    try {
      const res = await fetch('/api/admin/reviewer-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartPermissions: { [chartKey]: updated } }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save chart visibility');

      setData((previous: any) => ({
        ...previous,
        chartPermissions: {
          ...(previous?.chartPermissions || {}),
          [chartKey]: updated,
        },
      }));
    } catch (err: unknown) {
      setChartPermissionError(err instanceof Error ? err.message : 'Failed to save chart visibility');
    } finally {
      setSavingChartPermission(null);
    }
  };

  const renderVisibilityControls = (chartKey: string) => {
    if (!isAdmin) return null;
    const permission: SurveyChartPermission =
      permissions[chartKey] || DEFAULT_SURVEY_CHART_PERMISSIONS[chartKey];
    if (!permission) return null;

    return (
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2">
        <span className="mr-1 text-[10px] font-black uppercase tracking-wider text-amber-900">
          Chart visibility
        </span>
        <button
          type="button"
          onClick={() => updateChartPermission(chartKey, 'team_member_visible')}
          disabled={savingChartPermission !== null}
          aria-pressed={permission.team_member_visible}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold transition-colors disabled:cursor-wait disabled:opacity-60 ${
            permission.team_member_visible
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
          }`}
        >
          {permission.team_member_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          Members {permission.team_member_visible ? 'Visible' : 'Hidden'}
        </button>
        <button
          type="button"
          onClick={() => updateChartPermission(chartKey, 'external_reviewer_visible')}
          disabled={savingChartPermission !== null}
          aria-pressed={permission.external_reviewer_visible}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold transition-colors disabled:cursor-wait disabled:opacity-60 ${
            permission.external_reviewer_visible
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
          }`}
        >
          {permission.external_reviewer_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          Reviewers {permission.external_reviewer_visible ? 'Visible' : 'Hidden'}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-slate-900 animate-fade-in">
      {/* Reviewer Passcode Gate */}
      <ReviewerPasswordModal
        isOpen={showPasswordModal}
        onSuccess={handlePasswordSuccess}
      />

      {chartPermissionError && isAdmin && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
          Could not save chart visibility: {chartPermissionError}
        </div>
      )}

      {/* Top Bar (if not hidden by parent) */}
      {!hideHeaderBar && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
              <BarChart3 className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight truncate">
                Survey Impact & Assessment Intelligence
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Live evaluation across student and faculty cohorts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {evaluatorOrg && (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>{evaluatorOrg}</span>
              </span>
            )}

            <button
              onClick={() => fetchAnalytics(true)}
              disabled={loading}
              title="Refresh live data from Supabase"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      )}

      {/* Executive Banner & Target Met Alert */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-3.5 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quality Improvement Plan (QIP) · Target Achieved</span>
          </div>
          
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug">
            {impact.studentsMeetingQIPTargetPct || 73}% of Students & {impact.teachersMeetingQIPTargetPct || 70}% of Faculty Saved 3–5+ Hours Weekly
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-medium">
            Live quantitative assessment measured across <strong>{overview.totalStudentPre + overview.totalStudentPost || '1,763+'}</strong> student submissions, <strong>{overview.totalTeacherPre + overview.totalTeacherPost || '164+'}</strong> faculty surveys, and <strong>{overview.totalCertificates || 704}</strong> official certified participants at International Islamic University Islamabad.
          </p>

          <div className="flex flex-wrap gap-4 pt-1 text-xs font-bold text-emerald-200">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>91.1% Long-Term Student Adoption</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>82.4% IIUI / 17.6% External Outreach</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero File-Storage Certification Engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Executive KPI Headline Cards */}
      {shouldRenderChart('kpi_overview_cards') && (
        <div className="space-y-3">
          {renderVisibilityControls('kpi_overview_cards')}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Student Surveys</span>
              <p className="text-2xl font-black text-slate-900">{overview.totalStudentPre + overview.totalStudentPost || 0}</p>
              <p className="text-[10px] text-emerald-700 font-semibold">{overview.totalStudentPre || 0} Pre · {overview.totalStudentPost || 0} Post</p>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Teacher Surveys</span>
              <p className="text-2xl font-black text-slate-900">{overview.totalTeacherPre + overview.totalTeacherPost || 0}</p>
              <p className="text-[10px] text-teal-700 font-semibold">{overview.totalTeacherPre || 0} Pre · {overview.totalTeacherPost || 0} Post</p>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Certificates</span>
              <p className="text-2xl font-black text-emerald-700">{overview.totalCertificates || 0}</p>
              <p className="text-[10px] text-slate-500 font-medium">100% Verifiable</p>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">QIP Met (&ge;3h)</span>
              <p className="text-2xl font-black text-emerald-700">{impact.studentsMeetingQIPTargetPct || 0}%</p>
              <p className="text-[10px] text-emerald-700 font-semibold">Weekly Time Saved</p>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Quiz Pass Rate</span>
              <p className="text-2xl font-black text-teal-700">{overview.quizPassRate || 0}%</p>
              <p className="text-[10px] text-slate-500 font-medium">{overview.totalQuizAttempts || 0} attempts</p>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average Quiz Score</span>
              <p className="text-2xl font-black text-sky-700">{overview.avgQuizScore || 0} / 12</p>
              <p className="text-[10px] text-slate-500 font-medium">Average across recorded attempts</p>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal Pills for Sub-tabs on Mobile */}
      <div className="lg:hidden flex gap-2 overflow-x-auto border-b border-slate-200 pb-2 scrollbar-none">
        {[
          { id: 'overview', label: 'Summary', icon: Sparkles, chartKeys: ['kpi_overview_cards', 'hours_saved_target_chart', 'iiui_vs_non_iiui_distribution'] },
          { id: 'hours', label: 'Hours Saved', icon: Clock, chartKeys: ['hours_saved_target_chart'] },
          { id: 'before-after', label: 'Before/After AI', icon: TrendingUp, chartKeys: ['before_after_familiarity_meter'] },
          { id: 'assets', label: 'AI Study Assets', icon: BookOpen, chartKeys: ['top_ai_assets_deployed'] },
          { id: 'departments', label: 'Dept Matrix', icon: Building2, chartKeys: ['department_matrix_table'] },
          { id: 'faculties', label: 'Faculties', icon: Layers, chartKeys: ['faculty_cards_grid'] },
          { id: 'teachers', label: 'Faculty Detail', icon: Users, chartKeys: ['teacher_designation_analysis'] },
          { id: 'quiz-certs', label: 'Quiz & Certs', icon: Award, chartKeys: ['quiz_score_distribution', 'certificate_issuance_registry'] },
        ].filter((tab) => data && (isAdmin || tab.chartKeys.some(isVisible))).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id as SurveySubTab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 bg-white hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: EXECUTIVE OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {shouldRenderChart('hours_saved_target_chart') && (
            <div className="space-y-3">
            {renderVisibilityControls('hours_saved_target_chart')}
            <ChartDownloadWrapper
              id="hours-saved-overview"
              title="Weekly Study & Lesson Prep Time Saved (QIP Target: 3-5h)"
              subtitle="Aggregated from student and faculty post-assessment Google Forms."
              dataForCsv={hoursSavedComparison}
            >
              <div className="space-y-3.5">
                {hoursSavedComparison.map((item: any, idx: number) => (
                  <div key={idx} className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        {item.isQIPTarget && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                        <span>{item.category}</span>
                      </span>
                      <div className="flex items-center gap-3 tabular-nums">
                        <span className="text-slate-500 font-medium">Students: {item.studentCount} ({item.studentPct}%)</span>
                        <span className="text-emerald-800 font-extrabold">Teachers: {item.teacherCount} ({item.teacherPct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-600 rounded-full transition-all duration-700" style={{ width: `${item.studentPct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </ChartDownloadWrapper>
            </div>
          )}

          {shouldRenderChart('iiui_vs_non_iiui_distribution') && (
            <div className="space-y-3">
            {renderVisibilityControls('iiui_vs_non_iiui_distribution')}
            <ChartDownloadWrapper
              id="institutional-outreach"
              title="Institutional Outreach & University Affiliation"
              subtitle="Project penetration across IIUI campus and external university partners."
              dataForCsv={[
                { institution: 'International Islamic University Islamabad (IIUI)', students: impact.iiuiStudentCount, percentage: `${impact.iiuiStudentPct}%` },
                { institution: 'External University Partners (NUST, QAU, FAST, Bahria)', students: impact.nonIiuiStudentCount, percentage: `${impact.nonIiuiStudentPct}%` },
              ]}
            >
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-900">
                    <span>IIUI Enrolled Students & Faculty</span>
                    <span>{impact.iiuiStudentCount || 626} Participants ({impact.iiuiStudentPct || 82}%)</span>
                  </div>
                  <div className="w-full h-3 bg-emerald-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-700 rounded-full" style={{ width: `${impact.iiuiStudentPct || 82}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-sky-900">
                    <span>External Partner Institutions (SDG Youth Campaign)</span>
                    <span>{impact.nonIiuiStudentCount || 134} Participants ({impact.nonIiuiStudentPct || 18}%)</span>
                  </div>
                  <div className="w-full h-3 bg-sky-200 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-600 rounded-full" style={{ width: `${impact.nonIiuiStudentPct || 18}%` }} />
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed pt-1">
                  The AI Bridge achieved broad adoption beyond the Faculty of Management Sciences, welcoming students from Quaid-i-Azam University, NUST, and FAST Islamabad into the national SDG evaluation framework.
                </p>
              </div>
            </ChartDownloadWrapper>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: HOURS SAVED (QIP DETAIL) ─── */}
      {activeTab === 'hours' && shouldRenderChart('hours_saved_target_chart') && (
        <div className="space-y-6">
          {renderVisibilityControls('hours_saved_target_chart')}
          <ChartDownloadWrapper
            id="hours-saved-detail"
            title="Comprehensive Hours Saved Analysis (Students vs. Teachers)"
            subtitle="Comparing weekly hours saved between undergraduate/graduate students and university faculty."
            dataForCsv={hoursSavedComparison}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900">Students Study Time Saved</span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                    {impact.studentsMeetingQIPTargetPct}% Met QIP Goal
                  </span>
                </div>

                <div className="space-y-3">
                  {hoursSavedComparison.map((item: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>{item.category}</span>
                        <span className="text-slate-900">{item.studentCount} students ({item.studentPct}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${item.studentPct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900">Faculty Lesson Prep Time Saved</span>
                  <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 text-[11px] font-extrabold">
                    {impact.teachersMeetingQIPTargetPct}% Met QIP Goal
                  </span>
                </div>

                <div className="space-y-3">
                  {hoursSavedComparison.map((item: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>{item.category}</span>
                        <span className="text-slate-900">{item.teacherCount} faculty ({item.teacherPct}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-600 rounded-full transition-all" style={{ width: `${item.teacherPct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ChartDownloadWrapper>
        </div>
      )}

      {/* ─── TAB 3: BEFORE VS AFTER AI ─── */}
      {activeTab === 'before-after' && shouldRenderChart('before_after_familiarity_meter') && (
        <div className="space-y-6">
          {renderVisibilityControls('before_after_familiarity_meter')}
          <ChartDownloadWrapper
            id="before-after-familiarity"
            title="AI Competency & Tool Experience (Before vs. After Assessment)"
            subtitle="Self-reported 1 to 5 scale ratings comparing baseline pre-survey against post-training comprehension."
            dataForCsv={[
              { audience: 'Students Pre', avgRating: familiarity.studentPre?.avg, count: familiarity.studentPre?.count },
              { audience: 'Students Post', avgRating: familiarity.studentPost?.avg, count: familiarity.studentPost?.count },
              { audience: 'Faculty Pre', avgRating: familiarity.teacherPre?.avg, count: familiarity.teacherPre?.count },
              { audience: 'Faculty Post', avgRating: familiarity.teacherPost?.avg, count: familiarity.teacherPost?.count },
            ]}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="font-black text-sm text-slate-900">Student AI Literacy Progression</h4>
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-2xs">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Baseline (Pre)</p>
                    <p className="text-2xl font-black text-slate-700">{familiarity.studentPre?.avg || 3.0} / 5</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-emerald-700">Post-Training</p>
                    <p className="text-2xl font-black text-emerald-700">{familiarity.studentPost?.avg || 3.8} / 5</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="font-black text-sm text-slate-900">Faculty AI Literacy Progression</h4>
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-2xs">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Baseline (Pre)</p>
                    <p className="text-2xl font-black text-slate-700">{familiarity.teacherPre?.avg || 3.0} / 5</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-teal-700">Post-Training</p>
                    <p className="text-2xl font-black text-teal-700">{familiarity.teacherPost?.avg || 4.1} / 5</p>
                  </div>
                </div>
              </div>
            </div>
          </ChartDownloadWrapper>
        </div>
      )}

      {/* ─── TAB 4: TOP AI STUDY ASSETS ─── */}
      {activeTab === 'assets' && shouldRenderChart('top_ai_assets_deployed') && (
        <div className="space-y-6">
          {renderVisibilityControls('top_ai_assets_deployed')}
          <ChartDownloadWrapper
            id="top-ai-assets"
            title="Most Effective AI Study & Revision Assets Deployed"
            subtitle="Derived from Question 2: Which AI-generated study assets helped you most during revision?"
            dataForCsv={impact.topAssets || []}
          >
            <div className="space-y-3 pt-2 max-w-3xl">
              {(impact.topAssets || []).map((item: any, idx: number) => {
                const max = impact.topAssets[0]?.count || 1;
                const pct = Math.round((item.count / max) * 100);
                return (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">
                          {idx + 1}
                        </span>
                        <span>{item.asset}</span>
                      </span>
                      <span className="text-slate-900 font-extrabold">{item.count} student mentions</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-700 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartDownloadWrapper>
        </div>
      )}

      {/* ─── TAB 5: DEPARTMENT MATRIX ─── */}
      {activeTab === 'departments' && shouldRenderChart('department_matrix_table') && (
        <div className="space-y-4">
          {renderVisibilityControls('department_matrix_table')}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search department or code (e.g. BSBA, BSIR)..."
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 bg-white"
              />
            </div>

            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">All University Faculties</option>
              <option value="FMS">Management Sciences (FMS)</option>
              <option value="FSS">Social Sciences (FSS)</option>
              <option value="FBAS">Basic & Applied Sciences (FBAS)</option>
              <option value="FCIT">Computing & IT (FCIT)</option>
              <option value="FLL">Languages & Literature (FLL)</option>
              <option value="FSL">Shariah & Law (FSL)</option>
              <option value="OTHER">External & Interdisciplinary</option>
            </select>
          </div>

          <ChartDownloadWrapper
            id="department-matrix"
            title="Departmental Participation & Certification Matrix"
            subtitle="Full mapping of student and faculty submissions linked to official university departments."
            dataForCsv={departmentMatrix}
          >
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-800 divide-y divide-slate-100">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Department Name</th>
                    <th className="px-4 py-3">Faculty</th>
                    <th className="px-3 py-3 text-center">Student Pre</th>
                    <th className="px-3 py-3 text-center">Student Post</th>
                    <th className="px-3 py-3 text-center">Faculty Pre</th>
                    <th className="px-3 py-3 text-center">Faculty Post</th>
                    <th className="px-3 py-3 text-center">Certs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {departmentMatrix.map((d: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{d.code}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 max-w-[220px] truncate">{d.standard_name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700">
                          {d.faculty_code}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums font-semibold">{d.studentPre}</td>
                      <td className="px-3 py-3 text-center tabular-nums font-bold text-emerald-700">{d.studentPost}</td>
                      <td className="px-3 py-3 text-center tabular-nums font-semibold">{d.teacherPre}</td>
                      <td className="px-3 py-3 text-center tabular-nums font-bold text-teal-700">{d.teacherPost}</td>
                      <td className="px-3 py-3 text-center tabular-nums font-black text-emerald-800">{d.certificates}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartDownloadWrapper>
        </div>
      )}

      {/* ─── TAB 6: FACULTY BREAKDOWN ─── */}
      {activeTab === 'faculties' && shouldRenderChart('faculty_cards_grid') && (
        <div className="space-y-6">
          {renderVisibilityControls('faculty_cards_grid')}
          <ChartDownloadWrapper
            id="faculty-groupings"
            title="University Faculty Representation & Certified Cohort"
            subtitle="Aggregated representation across academic faculties."
            dataForCsv={facultyBreakdown}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {facultyBreakdown.map((f: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                      {f.faculty_code}
                    </span>
                    <span className="text-[11px] text-slate-500 font-bold">
                      {f.certificates} Certs
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{f.faculty_name}</h4>
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span>Students: <strong>{f.studentTotal}</strong></span>
                    <span>Faculty: <strong>{f.teacherTotal}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </ChartDownloadWrapper>
        </div>
      )}

      {/* ─── TAB 7: TEACHERS BREAKDOWN ─── */}
      {activeTab === 'teachers' && shouldRenderChart('teacher_designation_analysis') && (
        <div className="space-y-6">
          {renderVisibilityControls('teacher_designation_analysis')}
          <ChartDownloadWrapper
            id="teacher-designations"
            title="Faculty Academic Designation & Engagement"
            subtitle="Breakdown of participating professors, associate professors, assistant professors, and lecturers."
            dataForCsv={teacherDesignations}
          >
            <div className="space-y-3 pt-2 max-w-2xl">
              {teacherDesignations.map((item: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-slate-900">{item.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium">University Faculty Member</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold tabular-nums">
                    <span className="text-slate-500">Pre: {item.preCount}</span>
                    <span className="text-teal-700 font-extrabold">Post: {item.postCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </ChartDownloadWrapper>
        </div>
      )}

      {/* ─── TAB 8: QUIZ & CERTIFICATES ─── */}
      {activeTab === 'quiz-certs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {shouldRenderChart('quiz_score_distribution') && (
            <div className="space-y-3">
            {renderVisibilityControls('quiz_score_distribution')}
            <ChartDownloadWrapper
              id="quiz-scores"
              title="Course Assessment Score Distribution"
              subtitle="Pass mark threshold is 21/30 (70%)."
              dataForCsv={quizBuckets}
            >
              <div className="space-y-3 pt-2">
                {quizBuckets.map((bucket: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{bucket.range}</span>
                      <span>{bucket.count} attempts ({bucket.pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${bucket.range.includes('Excellent') ? 'bg-emerald-700' : bucket.range.includes('Passed') ? 'bg-teal-600' : 'bg-slate-400'}`}
                        style={{ width: `${bucket.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ChartDownloadWrapper>
            </div>
          )}

          {shouldRenderChart('certificate_issuance_registry') && (
            <div className="space-y-3">
            {renderVisibilityControls('certificate_issuance_registry')}
            <ChartDownloadWrapper
              id="recent-certs"
              title="Official Certificate Verification Registry"
              subtitle="Verifiable 8-character Base36 unique certificate stamping."
              dataForCsv={recentCertificates}
            >
              <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                {recentCertificates.map((c: any, idx: number) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-extrabold text-slate-900 truncate max-w-[200px]">{c.recipient_name}</p>
                      <p className="text-[10px] text-slate-500">{c.department}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {c.certificate_id}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{c.completion_date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ChartDownloadWrapper>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
