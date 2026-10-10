'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Failed to initiate Google sign in. Please ensure Google OAuth provider is enabled in Supabase Dashboard.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-100 rounded-full blur-2xl opacity-60 pointer-events-none"></div>

        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 items-center justify-center text-white shadow-lg shadow-emerald-700/25 mb-1">
            <Sparkles className="w-7 h-7 text-amber-300" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Single Sign-On (SSO)
            </span>
            <span className="text-xs text-slate-400">• IIUI FMS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            The AI Bridge Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Sign in with your University or Personal Google Account to access your 3-Step Certification dashboard and download verified certificates.
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">Authentication Error</p>
              <p className="text-[11px] leading-relaxed text-red-600">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Google Authentication Section */}
        <div className="space-y-4 pt-2">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3.5 px-5 py-3.5 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 shadow-md shadow-slate-100 transition-all hover:border-emerald-600 hover:shadow-lg disabled:opacity-60 group cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{loading ? 'Connecting to Google...' : 'Continue with Google Account'}</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all ml-auto" />
          </button>
        </div>

        {/* Informational Badges */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Automatic Student Profile & Survey Linkage</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>Secure OAuth 2.0 Authentication</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-600">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>No Passwords Required</span>
          </div>
        </div>
      </div>
    </div>
  );
}
