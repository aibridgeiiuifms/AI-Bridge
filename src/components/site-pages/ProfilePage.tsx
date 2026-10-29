'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { hasAmbassadorPortalRole } from '@/lib/access';
import bridgeLogo from '../../../Assets/logo.jpg';
import hhpLogo from '../../../Assets/hum hain pak logo.jpg';
import iiuiLogo from '../../../Assets/IIUI Logo.jpg';
import sdgLogo from '../../../Assets/SDG Logo.png';
import SdgLoading from '@/components/SdgLoading';
import {
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Share2,
} from 'lucide-react';

export default function ProfilePageContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    const supabase = createClient();

    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user?.email) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('role, full_name, avatar_url')
            .eq('email', user.email)
            .maybeSingle();

          if (prof) {
            setProfile(prof);
            setIsPrivileged(hasAmbassadorPortalRole(prof.role));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setAuthLoading(false);
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setIsPrivileged(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setIsPrivileged(false);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : 'Participant');

  const userEmail = user?.email || '';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  const initials = (() => {
    if (displayName && displayName !== userEmail.split('@')[0]) {
      const parts = displayName.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return displayName.slice(0, 2).toUpperCase();
    }
    return userEmail ? userEmail.slice(0, 2).toUpperCase() : 'U';
  })();

  return (
    <div className="flex min-h-[calc(100svh-4.25rem)] items-center justify-center bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 px-3 py-6 sm:px-4 sm:py-8 relative overflow-hidden">
      {/* Ambient background glow matching site theme */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <section className="relative z-10 w-full max-w-sm rounded-3xl border border-white/15 bg-slate-900/90 backdrop-blur-xl p-5 sm:p-6 shadow-2xl transition-all duration-300 hover:border-emerald-500/30">
        {/* Navigation / Back Button */}
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        </div>

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

        {authLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
            <SdgLoading size={28} label="Checking profile credentials" />
            <span>Loading credentials...</span>
          </div>
        ) : user ? (
          <div>
            {/* Header Text for Authenticated User */}
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                IIUI · Faculty of Management Sciences
              </p>
              <h2 className="mt-1 text-lg font-extrabold tracking-tight text-white">
                Member Profile
              </h2>
            </div>

            {/* Logged in User Identity Card */}
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-emerald-500/50"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white font-bold text-sm shadow-inner ring-2 ring-emerald-500/50">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="truncate text-xs sm:text-sm font-bold text-white">{displayName}</h3>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        isPrivileged
                          ? 'border border-amber-400/40 bg-amber-500/15 text-amber-300'
                          : 'border border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      <span>{isPrivileged ? 'SDG Ambassador' : 'Verified Participant'}</span>
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-slate-300">{userEmail}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 mb-4">
              <Link
                href="/portal"
                className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-600/20 hover:bg-emerald-600/30 px-3.5 py-2.5 text-xs font-bold text-emerald-200 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="h-4 w-4 text-emerald-400" />
                  <span>Open Student Portal</span>
                </div>
                <ArrowRight className="h-4 w-4 text-emerald-400" />
              </Link>

              {isPrivileged && (
                <Link
                  href="/dashboard"
                  className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-600/20 hover:bg-amber-600/30 px-3.5 py-2.5 text-xs font-bold text-amber-200 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="h-4 w-4 text-amber-400" />
                    <span>Ambassador Dashboard</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-amber-400" />
                </Link>
              )}

              <Link
                href="/share"
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-2.5">
                  <Share2 className="h-4 w-4 text-emerald-400" />
                  <span>Share AI Bridge</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 hover:bg-rose-950/70 px-4 py-2.5 text-xs font-bold text-rose-300 transition-all cursor-pointer disabled:opacity-60"
            >
              <LogOut className="h-4 w-4 text-rose-400" />
              <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Header Text for Guests */}
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
                <SdgLoading size={20} label="Connecting to Google" />
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
          </div>
        )}

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
