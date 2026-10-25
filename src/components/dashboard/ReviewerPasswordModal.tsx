'use client';

import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import SdgLoading from '@/components/SdgLoading';

interface ReviewerPasswordModalProps {
  isOpen: boolean;
  onSuccess: (token: string, orgName?: string) => void;
}

export default function ReviewerPasswordModal({ isOpen, onSuccess }: ReviewerPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the reviewer password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/reviewer-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to authenticate');
      }

      // Store in sessionStorage as fallback for webviews
      if (json.token) {
        sessionStorage.setItem('aib_reviewer_token', json.token);
      }

      onSuccess(json.token, json.organization);
    } catch (err: any) {
      setError(err.message || 'Invalid evaluator password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900">
        
        {/* Emblem & Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Live Evaluator Verification
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Welcome, Evaluator. Please enter the official project passcode provided on the evaluation report or binder to inspect live assessment data.
          </p>
        </div>

        {/* Institution Badge */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
          <div className="text-[11px] leading-tight">
            <p className="font-extrabold text-slate-900">The AI Bridge · IIUI FMS</p>
            <p className="text-slate-500 font-medium">Hum Hain Pakistan National SDG Campaign</p>
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Evaluator Access Passcode
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter report passcode..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                disabled={loading}
                className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <SdgLoading size={16} label="Verifying with database" />
                <span>Verifying with Database...</span>
              </>
            ) : (
              <>
                <span>Unlock Live Assessment Data</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <p className="text-[10px] text-slate-400 text-center leading-normal">
          Authorized team members logged into Supabase bypass this gate automatically.
        </p>
      </div>
    </div>
  );
}
