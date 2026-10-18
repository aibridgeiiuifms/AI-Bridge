'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import bridgeLogo from '../../../Assets/logo.jpg';
import hhpLogo from '../../../Assets/hum hain pak logo.jpg';
import iiuiLogo from '../../../Assets/IIUI Logo.jpg';
import sdgLogo from '../../../Assets/SDG Logo.png';
import sdgWheel from '../../../Assets/SDG Wheel.png';
import { ShieldCheck, AlertCircle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

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
    <div className="flex min-h-[calc(100svh-4.25rem)] items-center justify-center bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 px-3 py-6 sm:px-4 sm:py-8 relative overflow-hidden">
      {/* Ambient background glow matching site theme */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <section className="relative z-10 w-full max-w-sm rounded-3xl border border-white/15 bg-slate-900/90 backdrop-blur-xl p-5 sm:p-6 shadow-2xl transition-all duration-300 hover:border-emerald-500/30">
        {/* SDG Banner */}
        <div className="mb-4 flex justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 p-2 shadow-inner">
          <Image
            src={sdgLogo}
            alt="Sustainable Development Goals emblem"
            width={180}
            height={180}
            priority
            className="h-auto w-full max-w-[9rem] object-contain sm:max-w-[10rem]"
          />
        </div>

        {/* Logos Bar */}
        <div className="mb-4 grid grid-cols-2 gap-2 border-b border-white/10 pb-3">
          <div className="flex min-w-0 items-center gap-2 border-r border-white/10 pr-2">
            <Image
              src={iiuiLogo}
              alt="International Islamic University Islamabad logo"
              width={56}
              height={56}
              className="h-9 w-9 shrink-0 rounded-full object-contain ring-1 ring-white/20 bg-white"
              priority
            />
            <span className="text-[9px] font-bold leading-tight text-slate-200 sm:text-[10px]">
              International Islamic<br />University Islamabad
            </span>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-1.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white shadow-sm">
                <Image
                  src={bridgeLogo}
                  alt="The AI Bridge logo"
                  width={48}
                  height={48}
                  className="h-full w-full rounded-full object-cover"
                  priority
                />
              </span>
              <span className="text-xs font-extrabold text-white">The AI Bridge</span>
            </div>
            <span className="overflow-hidden rounded-lg border border-white/15 bg-white px-2 py-0.5 shadow-sm">
              <Image
                src={hhpLogo}
                alt="Hum Hain Pakistan campaign logo"
                width={152}
                height={85}
                className="h-auto w-[88px] object-contain"
                priority
              />
            </span>
          </div>
        </div>

        {/* Header Text */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              IIUI · Faculty of Management Sciences
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-200">
            <ShieldCheck className="h-3 w-3 text-emerald-300" />
            Official Identity Portal
          </span>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-white">
            Participant & Ambassador Login
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            Sign in with your Google account to access your personalized certification workspace, track survey progress, and download verified certificates.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/60 p-3 text-xs text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div className="space-y-0.5">
              <p className="font-bold text-rose-100">Authentication Error</p>
              <p className="text-[11px] leading-relaxed text-rose-300">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Google SSO Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="group flex w-full items-center gap-3 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/15 px-4 py-3 text-left text-xs sm:text-sm font-bold text-white shadow-lg backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
        >
          {loading ? (
            <Image
              src={sdgWheel}
              alt=""
              aria-hidden="true"
              className="h-5 w-5 shrink-0 animate-[spin_4s_linear_infinite]"
            />
          ) : (
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          <span>{loading ? 'Connecting to Google...' : 'Continue with Google Account'}</span>
          <ArrowRight className="ml-auto h-4 w-4 text-emerald-400 transition-transform group-hover:translate-x-1" />
        </button>

        {/* Feature badge */}
        <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Automatic survey & evaluation synchronization</span>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-3 flex items-center justify-center gap-3 border-t border-white/10 pt-3">
          <a
            href="https://www.facebook.com/profile.php?id=61594783725793"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit The AI Bridge on Facebook"
            title="Facebook"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M13.4 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.5 1.6-1.5h1.7V3.2c-.3 0-1.3-.2-2.5-.2-2.5 0-4.2 1.5-4.2 4.3v2.4H7.2v3.2H10V21h3.4Z" />
            </svg>
          </a>
          <a
            href="https://x.com/TheAIBridgeFMS"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit The AI Bridge on X"
            title="X"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.3-8.4L1.8 2h6.5l4.5 6.8L18.9 2Zm-1.1 17.9h1.7L7.3 3.9H5.5l12.3 16Z" />
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/company/the-ai-bridge-iiui-fms/home/?viewAsMember=true"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit The AI Bridge on LinkedIn"
            title="LinkedIn"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M5.2 3a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM3.3 9h3.8v12H3.3V9Zm6.2 0h3.6v1.6h.1c.5-.9 1.7-2 3.6-2 3.9 0 4.6 2.5 4.6 5.7V21h-3.8v-5.9c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V21H9.5V9Z" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}
