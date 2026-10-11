'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import bridgeLogo from '../../../Assets/logo.jpg';
import hhpLogo from '../../../Assets/hum hain pak logo.jpeg';
import iiuiLogo from '../../../Assets/IIUI Logo.jpg';
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
    <div className="flex min-h-[58vh] items-center justify-center bg-[linear-gradient(135deg,#fbfcf8_0%,#e9f4ec_48%,#f7f1dc_100%)] px-4 py-8">
      <section className="group w-full max-w-md rounded-2xl border border-[#d8e7dc] border-t-4 border-t-[#36b879] bg-[#fffefa] px-6 py-6 shadow-[0_16px_48px_-28px_rgba(21,61,49,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_-28px_rgba(21,61,49,0.48)] sm:px-8">
        <div className="mb-5 grid grid-cols-2 gap-3 border-b border-[#e2ece4] pb-4">
          <div className="flex min-w-0 items-center gap-2 border-r border-[#e2ece4] pr-3">
            <Image
              src={iiuiLogo}
              alt="International Islamic University Islamabad logo"
              width={56}
              height={56}
              className="h-11 w-11 shrink-0 rounded-full object-contain transition-transform duration-300 group-hover:scale-105"
              priority
            />
            <span className="text-[9px] font-bold leading-[1.35] text-[#173d31] sm:text-[10px]">
              International Islamic<br />University Islamabad
            </span>
          </div>
          <div className="flex min-w-0 flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-1.5">
              <Image
                src={bridgeLogo}
                alt="The AI Bridge logo"
                width={48}
                height={48}
                className="h-9 w-9 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
                priority
              />
              <span className="text-xs font-bold leading-tight text-[#173d31]">The AI Bridge</span>
            </div>
            <Image
              src={hhpLogo}
              alt="Hum Hain Pakistan campaign logo"
              width={128}
              height={72}
              className="h-10 w-full max-w-[152px] object-contain transition-transform duration-300 group-hover:scale-[1.03]"
              priority
            />
          </div>
        </div>

        <div className="mb-5">
          <p className="mb-2 text-[9px] font-bold uppercase text-[#4e8064]">IIUI · Faculty of Management Sciences</p>
          <span className="inline-flex items-center gap-1.5 border border-[#dcebe0] bg-[#eef7f0] px-2.5 py-1 text-[10px] font-semibold text-[#285c43]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#21a968]" />
            Secure single sign-on
          </span>
          <h2 className="mt-3 text-2xl font-bold leading-tight text-[#173d31]">Welcome back</h2>
          <p className="mt-1.5 text-xs leading-5 text-[#65776c]">
            Sign in with your University or personal Google account to access your certification dashboard and verified certificates.
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
          className="group flex w-full items-center gap-3 rounded-xl border border-[#cfe0d4] bg-[#fffefa] px-3.5 py-3 text-left text-sm font-semibold text-[#193d31] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#35cf87] hover:bg-[#f2fbf4] hover:shadow-[0_0_0_3px_rgba(53,207,135,0.12),0_0_24px_rgba(53,207,135,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35cf87] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
        >
          {loading ? (
            <span className="h-5 w-5 shrink-0 animate-spin border-2 border-[#22a96a] border-t-transparent" />
          ) : (
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          <ArrowRight className="ml-auto h-4 w-4 text-[#789181] transition-transform group-hover:translate-x-1 group-hover:text-[#168d58]" />
        </button>

        <div className="mt-5 border-t border-[#e3ece5] pt-4 text-[11px] text-[#5c7063]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22a96a]" />
            <span>Student profile & survey linkage</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3 border-t border-[#e3ece5] pt-3">
          <a
            href="https://www.facebook.com/profile.php?id=61594783725793"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit The AI Bridge on Facebook"
            title="Facebook"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#4267B2] transition-colors hover:bg-[#4267B2] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4267B2] focus-visible:ring-offset-2"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden="true">
              <path d="M13.4 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.5 1.6-1.5h1.7V3.2c-.3 0-1.3-.2-2.5-.2-2.5 0-4.2 1.5-4.2 4.3v2.4H7.2v3.2H10V21h3.4Z" />
            </svg>
          </a>
          <a
            href="https://x.com/TheAIBridgeFMS"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit The AI Bridge on X"
            title="X"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#202124] transition-colors hover:bg-[#202124] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#202124] focus-visible:ring-offset-2"
          >
            <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] fill-current" aria-hidden="true">
              <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.3-8.4L1.8 2h6.5l4.5 6.8L18.9 2Zm-1.1 17.9h1.7L7.3 3.9H5.5l12.3 16Z" />
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/company/the-ai-bridge-iiui-fms/home/?viewAsMember=true"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit The AI Bridge on LinkedIn"
            title="LinkedIn"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#0A66C2] transition-colors hover:bg-[#0A66C2] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2] focus-visible:ring-offset-2"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden="true">
              <path d="M5.2 3a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM3.3 9h3.8v12H3.3V9Zm6.2 0h3.6v1.6h.1c.5-.9 1.7-2 3.6-2 3.9 0 4.6 2.5 4.6 5.7V21h-3.8v-5.9c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V21H9.5V9Z" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}
