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
  LogOut,
} from 'lucide-react';
import SdgLoading from '@/components/SdgLoading';
import SurveyAnalyticsView from '@/components/dashboard/SurveyAnalyticsView';

export default function GuestAnalyticsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const res = await fetch('/api/admin/survey-analytics-v2');
      if (res.ok) {
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
    } catch (err: any) {
      setAuthError(err.message || 'Invalid passcode. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'aib_guest_session=; Max-Age=0; path=/;';
    setIsAuthenticated(false);
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
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white px-4 py-3 sm:px-8 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight">The AI Bridge · Evaluator Portal</h1>
            <p className="text-[10px] text-slate-400">Live Training Impact & Research Assessment (Verified External View)</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        <SurveyAnalyticsView />
      </div>
    </div>
  );
}
