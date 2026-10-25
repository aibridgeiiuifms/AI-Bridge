'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import SurveyAnalyticsView from '@/components/dashboard/SurveyAnalyticsView';

export default function SurveyAnalyticsDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Top Bar for Standalone Page */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-16 z-30 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Dashboard</span>
            </Link>
            <div className="h-4 w-[1px] bg-slate-200 shrink-0" />
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                <BarChart3 className="w-4 h-4" />
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                Standalone Evaluator Portal
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SurveyAnalyticsView hideHeaderBar={false} />
      </div>
    </div>
  );
}
