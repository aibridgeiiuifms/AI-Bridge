'use client';

import SdgLoading from '@/components/SdgLoading';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  BarChart3, 
  Users, 
  Eye, 
  Heart, 
  Clock, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Globe2, 
  RefreshCw, 
  TrendingUp, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  Activity, 
  CheckCircle2, 
  Layers, 
  Compass, 
  GraduationCap, 
  FileCheck2, 
  Lock, 
  Search,
  Calendar
} from 'lucide-react';

export default function AnalyticsDashboardPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'gallery' | 'activity' | 'access'>('overview');
  const [togglingProfileId, setTogglingProfileId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activitySearch, setActivitySearch] = useState<string>('');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.status === 403) {
        setError('UNAUTHORIZED');
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load analytics');
      setData(json);
    } catch (err: any) {
      console.error('Analytics load error:', err);
      setError(err.message || 'Error loading analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleToggleAccess = async (profileId: string, currentVal: boolean) => {
    if (!profileId) return;
    setTogglingProfileId(profileId);
    try {
      const nextVal = !currentVal;
      const res = await fetch('/api/admin/analytics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, canViewAnalytics: nextVal }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');

      setData((prev: any) => ({
        ...prev,
        teamAccessList: prev.teamAccessList.map((m: any) =>
          m.profile_id === profileId ? { ...m, can_view_analytics: nextVal } : m
        ),
      }));

      setFeedback(`Access ${nextVal ? 'granted' : 'revoked'} successfully`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(`Failed to update access: ${err.message}`);
    } finally {
      setTogglingProfileId(null);
    }
  };

  if (error === 'UNAUTHORIZED') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Restricted Access</h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          You do not have administrative or delegated permission to view the AI Bridge analytics dashboard.
          Please contact the Lead Admin to request access.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const funnel = data?.funnel || {};
  const topPages = data?.topPages || [];
  const topLikedEvents = data?.topLikedEvents || [];
  const recentEvents = (data?.recentEvents || []).filter((e: any) => {
    if (!activitySearch) return true;
    const term = activitySearch.toLowerCase();
    return (
      e.event_name.toLowerCase().includes(term) ||
      e.page_path.toLowerCase().includes(term) ||
      e.user_role?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Bar */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <div className="h-4 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h1 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Live User Analytics & System Intelligence
              </h1>
            </div>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? <SdgLoading size={14} label="Refreshing analytics" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {feedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Executive KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Views</span>
              <Eye className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.totalPageViews?.toLocaleString() || 0}
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold">
              +{metrics.views7d || 0} past 7 days
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Unique Visitors</span>
              <Users className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.uniqueVisitors?.toLocaleString() || 0}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {metrics.authViews || 0} authenticated · {metrics.guestViews || 0} guests
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Likes</span>
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.totalLikes?.toLocaleString() || 0}
            </p>
            <p className="text-[11px] text-rose-600 font-semibold">
              Across published gallery events
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">30-Day Activity</span>
              <TrendingUp className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.views30d?.toLocaleString() || 0}
            </p>
            <p className="text-[11px] text-teal-700 font-semibold">
              Monthly sustained pageviews
            </p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
          {[
            { id: 'overview', label: 'Overview & Traffic', icon: Globe2 },
            { id: 'funnel', label: 'Portal Funnel', icon: GraduationCap },
            { id: 'gallery', label: 'Gallery & Likes', icon: Heart },
            { id: 'activity', label: 'Live Stream (24h)', icon: Activity },
            ...(data?.isAdmin ? [{ id: 'access', label: 'Team Permissions', icon: ShieldCheck }] : []),
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── TAB 1: OVERVIEW & TRAFFIC ─── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Visited Routes */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>Top Visited Routes</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-400">All Time</span>
              </div>

              {topPages.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No pageview data recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {topPages.map((p: any, idx: number) => {
                    const max = topPages[0]?.count || 1;
                    const pct = Math.round((p.count / max) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-slate-800 font-semibold truncate max-w-[280px]">
                            {p.path}
                          </span>
                          <span className="font-bold text-slate-900 tabular-nums">{p.count} views</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Devices & Environment Breakdown */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-600" />
                  <span>Device Breakdown</span>
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
                    <Monitor className="w-5 h-5 text-slate-600 mx-auto" />
                    <span className="text-[11px] font-bold text-slate-500 block">Desktop</span>
                    <span className="text-lg font-black text-slate-900">
                      {data?.deviceCounts?.desktop || 0}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
                    <Smartphone className="w-5 h-5 text-emerald-600 mx-auto" />
                    <span className="text-[11px] font-bold text-slate-500 block">Mobile</span>
                    <span className="text-lg font-black text-slate-900">
                      {data?.deviceCounts?.mobile || 0}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
                    <Tablet className="w-5 h-5 text-sky-600 mx-auto" />
                    <span className="text-[11px] font-bold text-slate-500 block">Tablet</span>
                    <span className="text-lg font-black text-slate-900">
                      {data?.deviceCounts?.tablet || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Countries */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-emerald-600" />
                  <span>Visitor Locations</span>
                </h3>
                {(data?.topCountries || []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No geo data recorded yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.topCountries.map((c: any, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200"
                      >
                        <span>{c.country}</span>
                        <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full font-extrabold">
                          {c.count}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: PORTAL FUNNEL ─── */}
        {activeTab === 'funnel' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-700" />
                <span>Student & Teacher Progression Funnel</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Visualizes step-by-step pipeline drop-offs from Baseline Evaluation to Master Certification Issuance.
              </p>
            </div>

            <div className="space-y-4 max-w-3xl">
              {[
                { label: '1. Pre-Survey Form Launched', count: funnel.preStarted || 0, color: 'bg-emerald-600' },
                { label: '2. Pre-Survey Submitted (Google Forms)', count: funnel.preSubmitted || 0, color: 'bg-emerald-700' },
                { label: '3. 12-MCQ Course Quiz Started', count: funnel.quizStarted || 0, color: 'bg-teal-600' },
                { label: '4. MCQ Quiz Completed', count: funnel.quizCompleted || 0, color: 'bg-teal-700' },
                { label: '5. Post-Survey Submitted', count: funnel.postSubmitted || 0, color: 'bg-sky-600' },
                { label: '6. Official Certificate Downloaded', count: funnel.certDownloaded || 0, color: 'bg-amber-600' },
              ].map((step, idx, arr) => {
                const max = arr[0].count || 1;
                const pct = Math.round((step.count / max) * 100);
                const prevCount = idx > 0 ? arr[idx - 1].count : step.count;
                const dropOff = idx > 0 && prevCount > 0 ? Math.round(((prevCount - step.count) / prevCount) * 100) : 0;

                return (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{step.label}</span>
                      <div className="flex items-center gap-3">
                        {idx > 0 && dropOff > 0 && (
                          <span className="text-[10px] text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            -{dropOff}% drop-off
                          </span>
                        )}
                        <span className="font-extrabold text-sm tabular-nums text-slate-900">{step.count} users</span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${step.color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── TAB 3: GALLERY & LIKES ─── */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            {/* Top Liked Events Leaderboard */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>Most Liked Events Leaderboard</span>
              </h3>

              {topLikedEvents.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No likes recorded yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topLikedEvents.map((evt: any, idx: number) => (
                    <div
                      key={evt.id || idx}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {evt.folderTitle}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 truncate">{evt.title}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 font-extrabold text-xs shrink-0">
                        <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        <span>{evt.likeCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Album Time-on-Page & Visits */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Event Album Engagement</span>
              </h3>

              {Object.keys(data?.folderViewCounts || {}).length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No album visits recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(data?.folderViewCounts || {}).map(([slug, count]: any, idx) => {
                    const durInfo = data?.folderDurations?.[slug];
                    const avgSec = durInfo && durInfo.count > 0 ? Math.round(durInfo.total / durInfo.count) : null;
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
                        <div className="font-mono font-bold text-slate-800">
                          /events/{slug}
                        </div>
                        <div className="flex items-center gap-4 text-slate-600 font-medium">
                          <span>{count} album openings</span>
                          {avgSec !== null && (
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              avg {avgSec}s per visit
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 4: LIVE STREAM (24H) ─── */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Real-Time Activity Feed</span>
                </h3>
                <p className="text-xs text-slate-500">Chronological stream of the latest 50 recorded user actions.</p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter events, paths, roles..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 w-full sm:w-64"
                />
              </div>
            </div>

            {recentEvents.length === 0 ? (
              <p className="text-xs text-slate-400 py-12 text-center">No recent activity found.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {recentEvents.map((ev: any, idx: number) => {
                  const isAuth = Boolean(ev.user_id);
                  return (
                    <div key={ev.id || idx} className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider ${
                          ev.event_name.includes('like')
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : ev.event_name.includes('quiz')
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : ev.event_name.includes('survey')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ev.event_name}
                        </span>
                        <span className="font-semibold text-slate-800 truncate max-w-[240px]">
                          {ev.page_path}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-500">
                          {ev.user_role || (isAuth ? 'user' : 'guest')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 tabular-nums">
                        {ev.country && <span className="font-bold text-slate-700">{ev.country}</span>}
                        {ev.device_type && <span className="capitalize">{ev.device_type}</span>}
                        <span>{new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 5: TEAM PERMISSIONS ─── */}
        {activeTab === 'access' && data?.isAdmin && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span>Delegated Analytics Authority</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Authorize specific SDG Ambassadors and Team Members to inspect real-time system analytics and portal reports.
              </p>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {(data?.teamAccessList || []).map((m: any) => (
                <div key={m.id} className="p-4 flex items-center justify-between gap-3 bg-white hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                      {m.avatar_url ? (
                        <Image src={m.avatar_url} alt={m.full_name} width={36} height={36} className="object-cover" />
                      ) : (
                        <span>{m.full_name?.charAt(0) || 'U'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm text-slate-900 truncate">{m.full_name}</p>
                      <p className="text-xs text-slate-500">{m.designation || m.team_role} · {m.email}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleAccess(m.profile_id, m.can_view_analytics)}
                    disabled={togglingProfileId === m.profile_id || !m.profile_id}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      m.can_view_analytics
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {togglingProfileId === m.profile_id ? (
                      'Updating...'
                    ) : m.can_view_analytics ? (
                      'Access Enabled'
                    ) : (
                      'Grant Access'
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
