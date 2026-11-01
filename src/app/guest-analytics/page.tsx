'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  GraduationCap,
  Briefcase,
  Building2,
  Clock,
  Award,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import SdgLoading from '@/components/SdgLoading';
import ChartDownloadWrapper from '@/components/dashboard/ChartDownloadWrapper';

export default function GuestAnalyticsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'executive' | 'student' | 'faculty' | 'demographics'>('executive');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const res = await fetch('/api/admin/survey-analytics-v2');
      if (res.ok) {
        const json = await res.json();
        setAnalyticsData(json);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setVerifying(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/guest-analytics/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Authentication failed');
      }

      setIsAuthenticated(true);
      fetchAnalyticsData();
    } catch (err: any) {
      setAuthError(err.message || 'Invalid passcode. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const fetchAnalyticsData = async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/admin/survey-analytics-v2');
      const json = await res.json();
      setAnalyticsData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'aib_guest_session=; Max-Age=0; path=/;';
    setIsAuthenticated(false);
    setAnalyticsData(null);
  };

  // 1. Password Protection Gate
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <SdgLoading size={32} label="Checking verification" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 animate-fade-in">
          
          {/* Emblem & Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Evaluator Access Verification
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Please enter the official project passcode provided on the evaluation report or binder to inspect live assessment data.
            </p>
          </div>

          {/* Institutional Badge */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <div className="text-[11px] leading-tight">
              <p className="font-extrabold text-slate-900">The AI Bridge · IIUI FMS</p>
              <p className="text-slate-500 font-medium">Hum Hain Pakistan National SDG Campaign</p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Evaluator Access Passcode
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPasscode ? 'text' : 'password'}
                  placeholder="Enter access passcode..."
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  autoFocus
                  disabled={verifying}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying || !passcode.trim()}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <SdgLoading size={16} label="Verifying access" />
                  <span>Verifying Passcode...</span>
                </>
              ) : (
                <>
                  <span>Unlock Live Assessment Data</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-[10px] text-slate-400 text-center">
            Authorized team members with Supabase accounts bypass this gate automatically.
          </p>
        </div>
      </div>
    );
  }

  // 2. Authenticated Evaluator Dashboard View
  const charts = analyticsData?.charts || {};
  const kpi = analyticsData?.kpiSummary || {};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white px-4 py-3 sm:px-8 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight">The AI Bridge · Evaluator Portal</h1>
            <p className="text-[10px] text-slate-400">Live Training Impact & Research Assessment (Read-Only)</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Session</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
        
        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          {[
            { id: 'executive', label: 'Executive Summary', icon: Sparkles },
            { id: 'student', label: 'Student Journey', icon: GraduationCap },
            { id: 'faculty', label: 'Faculty & Teachers', icon: Briefcase },
            { id: 'demographics', label: 'Demographics & Outreach', icon: Building2 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: EXECUTIVE SUMMARY */}
        {activeTab === 'executive' && (
          <div className="space-y-6 animate-fade-in">
            {/* 6 Executive KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Card 1: Total Students */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Students</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-[10px] border border-indigo-200">
                      Pre + Post
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
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                      {kpi.qipTimeMetPct || kpi.targetHoursSavedPct || 0}%
                    </span>
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
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-black text-[10px]">
                      {kpi.quizPassRate || 0}%
                    </span>
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

            {/* Hours Saved Chart */}
            <ChartDownloadWrapper
              id="guest-hours-saved"
              title="Weekly Study & Lesson Prep Time Saved (Target Met)"
              subtitle="Comparing study hours saved using source-grounded NotebookLM packs."
              dataForCsv={charts.hours_saved_comparison}
            >
              <div className="space-y-4 pt-2">
                {(charts.hours_saved_comparison || []).map((cat: any) => {
                  const pct = Math.round((cat.count / (kpi.totalStudentPost || 824)) * 100);
                  const isTarget = cat.label?.includes('Target');
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
            </ChartDownloadWrapper>

            {/* AI Familiarity Shift */}
            <ChartDownloadWrapper
              id="guest-familiarity-shift"
              title="AI Competency Shift: Before vs After Training"
              subtitle="Transition from Complete Beginner to Intermediate & Advanced regular AI usage."
              dataForCsv={charts.ai_familiarity_shift}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                {(charts.ai_familiarity_shift || []).map((lvl: any) => (
                  <div key={lvl.level} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                    <p className="text-xs font-black text-slate-800">{lvl.level}</p>
                    <div className="flex justify-center items-baseline gap-2">
                      <span className="text-sm font-bold text-slate-400">{lvl.prePct}% (Pre)</span>
                      <span className="text-sm text-slate-400">→</span>
                      <span className="text-xl font-black text-emerald-700">{lvl.postPct}% (Post)</span>
                    </div>
                  </div>
                ))}
              </div>
            </ChartDownloadWrapper>
          </div>
        )}

        {/* TAB 2: STUDENT JOURNEY */}
        {activeTab === 'student' && (
          <div className="space-y-6 animate-fade-in">
            {/* Academic Obstacles Pre */}
            <ChartDownloadWrapper
              id="guest-student-obstacles"
              title="Academic Obstacles Identified Before Training (N=1,271)"
              subtitle="Root problems students faced preparing for exams and weekly assignments."
              dataForCsv={charts.student_obstacles_pre}
            >
              <div className="space-y-3 pt-2">
                {(charts.student_obstacles_pre || []).map((obs: any) => (
                  <div key={obs.obstacle} className="space-y-1">
                    <div className="flex justify-between text-xs font-extrabold text-slate-800">
                      <span>{obs.obstacle}</span>
                      <span>{obs.count} ({obs.pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${obs.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </ChartDownloadWrapper>

            {/* Concept Improvement Rating */}
            <ChartDownloadWrapper
              id="guest-concept-improvement"
              title="Self-Reported Concept Comprehension Improvement (1 to 5)"
              subtitle="62.4% rated academic comprehension improvement 4 or 5 out of 5."
              dataForCsv={charts.student_concept_improvement}
            >
              <div className="grid grid-cols-5 gap-2 pt-2 text-center">
                {(charts.student_concept_improvement || []).map((item: any) => (
                  <div key={item.rating} className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-lg font-black text-emerald-800">{item.pct}%</p>
                    <p className="text-[10px] font-bold text-slate-600">{item.rating}</p>
                    <p className="text-[10px] text-slate-400">{item.count} students</p>
                  </div>
                ))}
              </div>
            </ChartDownloadWrapper>
          </div>
        )}

        {/* TAB 3: FACULTY & TEACHERS */}
        {activeTab === 'faculty' && (
          <div className="space-y-6 animate-fade-in">
            <ChartDownloadWrapper
              id="guest-faculty-prep"
              title="Faculty Lesson Prep Time Reduction (1 to 5 Scale)"
              subtitle="Measured efficiency gain in course preparation and lecture material generation."
              dataForCsv={charts.teacher_prep_reduction}
            >
              <div className="grid grid-cols-5 gap-2 pt-2 text-center">
                {(charts.teacher_prep_reduction || []).map((item: any) => (
                  <div key={item.rating} className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-lg font-black text-indigo-800">{item.pct}%</p>
                    <p className="text-[10px] font-bold text-slate-600">{item.rating}</p>
                  </div>
                ))}
              </div>
            </ChartDownloadWrapper>

            <ChartDownloadWrapper
              id="guest-faculty-multilingual"
              title="Multilingual Classical Text Burden (Pre-Training)"
              subtitle="83.3% of teachers frequently translate between Arabic/Urdu and English during lectures."
              dataForCsv={charts.teacher_multilingual_burden}
            >
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
            </ChartDownloadWrapper>
          </div>
        )}

        {/* TAB 4: DEMOGRAPHICS */}
        {activeTab === 'demographics' && (
          <div className="space-y-6 animate-fade-in">
            <ChartDownloadWrapper
              id="guest-dept-rank"
              title="Top Academic Departments Enrolled"
              subtitle="Participation distribution across university faculties."
              dataForCsv={charts.department_participation}
            >
              <div className="space-y-2.5 pt-2">
                {(charts.department_participation || []).map((d: any) => (
                  <div key={d.department} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold">
                    <span>{d.department}</span>
                    <span className="text-emerald-700 font-extrabold">{d.count} responses</span>
                  </div>
                ))}
              </div>
            </ChartDownloadWrapper>
          </div>
        )}
      </div>
    </div>
  );
}
