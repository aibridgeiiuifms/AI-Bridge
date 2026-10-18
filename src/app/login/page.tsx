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
import { ShieldCheck, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

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
    <div className="flex min-h-[calc(100svh-4.25rem)] items-center justify-center bg-[linear-gradient(135deg,#F7F5E9_0%,#FAD8B9_55%,#F5AA66_100%)] px-3 py-3 sm:px-4 sm:py-4">
      <section className="group w-full max-w-sm rounded-2xl border border-palette-cream border-t-4 border-t-palette-sienna bg-palette-ecru px-4 py-4 shadow-[0_16px_48px_-28px_rgba(34,15,56,0.35)] transition-all duration-300 hover:shadow-[0_24px_56px_-28px_rgba(34,15,56,0.48)] sm:px-6 sm:py-5">
        <div className="mb-3 flex justify-center overflow-hidden rounded-2xl border border-palette-cream bg-palette-haiti p-1.5 shadow-inner shadow-palette-sienna/10">
          <Image
            src={sdgLogo}
            alt="Sustainable Development Goals emblem"
            width={180}
            height={180}
            priority
            className="h-auto w-full max-w-[9rem] object-contain sm:max-w-[10rem]"
          />
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2 border-b border-palette-cream pb-2.5">
          <div className="flex min-w-0 items-center gap-1.5 border-r border-palette-cream pr-2">
            <Image
              src={iiuiLogo}
              alt="International Islamic University Islamabad logo"
              width={56}
              height={56}
              className="h-9 w-9 shrink-0 rounded-full object-contain transition-transform duration-300 group-hover:scale-105"
              priority
            />
            <span className="text-[9px] font-bold leading-[1.35] text-palette-haiti sm:text-[10px]">
              International Islamic<br />University Islamabad
            </span>
          </div>
          <div className="flex min-w-0 flex-col items-center justify-center gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-palette-cream bg-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                <Image
                  src={bridgeLogo}
                  alt="The AI Bridge logo"
                  width={48}
                  height={48}
                  className="h-full w-full rounded-full object-cover"
                  priority
                />
              </span>
              <span className="text-xs font-bold leading-tight text-palette-haiti">The AI Bridge</span>
            </div>
            <span className="overflow-hidden rounded-xl border border-palette-cream bg-white p-1 shadow-sm transition-transform duration-300 group-hover:scale-[1.03]">
              <Image
                src={hhpLogo}
                alt="Hum Hain Pakistan campaign logo"
                width={152}
                height={85}
                className="h-auto w-[104px] rounded-lg object-contain sm:w-[116px]"
                priority
              />
            </span>
          </div>
        </div>

        <div className="mb-3">
          <p className="mb-1.5 text-[9px] font-bold uppercase text-palette-haiti">IIUI · Faculty of Management Sciences</p>
          <span className="inline-flex items-center gap-1 border border-palette-cream bg-palette-cream px-2 py-0.5 text-[10px] font-semibold text-palette-haiti">
            <ShieldCheck className="h-3 w-3 text-palette-sienna" />
            Secure single sign-on
          </span>
          <h2 className="mt-2 text-xl font-bold leading-tight text-palette-haiti">Welcome back</h2>
          <p className="mt-1 text-[11px] leading-4 text-palette-haiti/80">
            Sign in with your Google account to access your certification dashboard and verified certificates. Ambassador access is available to whitelisted members.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-start gap-3 border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">Authentication Error</p>
              <p className="text-[11px] leading-relaxed text-red-600">{errorMsg}</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="group flex w-full items-center gap-3 rounded-xl border border-palette-cream bg-palette-ecru px-3 py-2.5 text-left text-sm font-semibold text-palette-haiti shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-palette-sienna hover:bg-palette-cream hover:shadow-[0_0_0_3px_rgba(239,105,89,0.12),0_0_24px_rgba(239,105,89,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palette-sienna focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
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
          <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          <ArrowRight className="ml-auto h-4 w-4 text-palette-sienna transition-transform group-hover:translate-x-1 group-hover:text-palette-haiti" />
        </button>

        <div className="mt-3 border-t border-palette-cream pt-2.5 text-[11px] text-palette-haiti/80">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-palette-sienna" />
            <span>Student profile & survey linkage</span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-center gap-4 border-t border-palette-cream pt-2">
          <a
            href="https://www.facebook.com/profile.php?id=61594783725793"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit The AI Bridge on Facebook"
            title="Facebook"
            className="flex h-11 w-11 items-center justify-center rounded-full text-palette-sienna transition-colors hover:bg-palette-sienna hover:text-palette-haiti focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palette-sienna focus-visible:ring-offset-2"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
              <path d="M13.4 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.5 1.6-1.5h1.7V3.2c-.3 0-1.3-.2-2.5-.2-2.5 0-4.2 1.5-4.2 4.3v2.4H7.2v3.2H10V21h3.4Z" />
            </svg>
          </a>
          <a
            href="https://x.com/TheAIBridgeFMS"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit The AI Bridge on X"
            title="X"
            className="flex h-11 w-11 items-center justify-center rounded-full text-palette-sienna transition-colors hover:bg-palette-sienna hover:text-palette-haiti focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palette-sienna focus-visible:ring-offset-2"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
              <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.3-8.4L1.8 2h6.5l4.5 6.8L18.9 2Zm-1.1 17.9h1.7L7.3 3.9H5.5l12.3 16Z" />
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/company/the-ai-bridge-iiui-fms/home/?viewAsMember=true"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit The AI Bridge on LinkedIn"
            title="LinkedIn"
            className="flex h-11 w-11 items-center justify-center rounded-full text-palette-sienna transition-colors hover:bg-palette-sienna hover:text-palette-haiti focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palette-sienna focus-visible:ring-offset-2"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
              <path d="M5.2 3a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM3.3 9h3.8v12H3.3V9Zm6.2 0h3.6v1.6h.1c.5-.9 1.7-2 3.6-2 3.9 0 4.6 2.5 4.6 5.7V21h-3.8v-5.9c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V21H9.5V9Z" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}
