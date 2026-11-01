import Link from 'next/link';
import Image from 'next/image';
import { HeartHandshake, Instagram, ShieldCheck, ExternalLink } from 'lucide-react';
import MobileSocialAppLink from '@/components/MobileSocialAppLink';
import { getCurrentUser, getCurrentUserProfile } from '@/lib/supabase/queries';
import { hasAmbassadorPortalRole } from '@/lib/access';

export default async function Footer() {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentUserProfile(user.id) : null;
  const canAccessAmbassadorPortal = hasAmbassadorPortalRole(profile?.role);

  return (
    <footer className="border-t border-slate-800 bg-palette-haiti pt-8 pb-6 text-palette-ecru sm:pt-12 sm:pb-10 lg:pt-16 lg:pb-12">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="mb-7 grid grid-cols-2 gap-x-4 gap-y-6 sm:mb-10 sm:gap-8 lg:mb-12 lg:grid-cols-4 lg:gap-10">
          {/* Col 1: Initiative Info */}
          <div className="col-span-2 space-y-3 sm:space-y-4 lg:col-span-1">
            <div className="flex items-center justify-between gap-2 sm:justify-start">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-700/80 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                  <Image
                    src="/logo.webp"
                    alt="The AI Bridge logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div>
                  <span className="font-extrabold text-base text-white tracking-tight">The AI Bridge</span>
                  <p className="text-[10px] text-emerald-400 font-medium">Empowering Non-IT Academia</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-[8px] text-palette-ecru sm:hidden">
                <div className="flex items-center gap-0.5 whitespace-nowrap rounded border border-slate-700/60 bg-slate-800/80 px-1 py-1">
                  <Image src="/iiui-logo.webp" alt="IIUI Logo" width={12} height={12} className="h-3 w-3 shrink-0 rounded-full bg-white object-contain" />
                  <span>FMS • IIUI</span>
                </div>
                <div className="flex items-center gap-0.5 whitespace-nowrap rounded border border-slate-700/60 bg-slate-800/80 px-1 py-1">
                  <Image src="/hhp-logo.webp" alt="HHP Logo" width={12} height={12} className="h-3 w-3 shrink-0 rounded-full bg-white object-contain" />
                  <span>HHP Youth</span>
                </div>
              </div>
            </div>
            <p className="hidden text-[11px] leading-relaxed text-palette-cream sm:block sm:text-xs">
              Empowering and bridging the gap for non-IT educators and learners in humanities and social sciences through source-grounded AI architectures.
            </p>
            <div className="flex flex-col gap-1.5 pt-1 sm:gap-2 sm:pt-2">
              <span className="hidden items-center gap-1.5 rounded-md border border-emerald-800/40 bg-emerald-950/80 px-2.5 py-1 text-[11px] font-medium text-emerald-400 sm:inline-flex">
                <HeartHandshake className="w-3.5 h-3.5" />
                Hum Hain Pakistan (HHP) Campaign
              </span>
              <div className="hidden items-center gap-2 pt-1 text-[10px] text-palette-ecru sm:flex">
                <div className="flex items-center gap-1.5 rounded border border-slate-700/60 bg-slate-800/80 px-2 py-1">
                  <Image src="/iiui-logo.webp" alt="IIUI Logo" width={16} height={16} className="h-4 w-4 rounded-full bg-white object-contain" />
                  <span>FMS • IIUI</span>
                </div>
                <div className="flex items-center gap-1.5 rounded border border-slate-700/60 bg-slate-800/80 px-2 py-1">
                  <Image src="/hhp-logo.webp" alt="HHP Logo" width={16} height={16} className="h-4 w-4 rounded-full bg-white object-contain" />
                  <span>HHP Youth Campaign</span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Institutional Leadership */}
          <div className="col-span-2 min-w-0 space-y-4 sm:col-span-1 sm:space-y-5">
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">Join our Social Community</h4>
              <div className="flex items-center gap-3">
                <MobileSocialAppLink
                  href="https://www.instagram.com/theaibridgefmsiiui/"
                  appHref="instagram://user?username=theaibridgefmsiiui"
                  label="Follow The AI Bridge on Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-palette-cream transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 lg:h-11 lg:w-11"
                >
                  <Instagram className="h-5 w-5 lg:h-6 lg:w-6" aria-hidden="true" />
                </MobileSocialAppLink>
                <a
                  href="https://www.facebook.com/profile.php?id=61594783725793"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit The AI Bridge on Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-palette-cream transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 lg:h-11 lg:w-11"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current lg:h-6 lg:w-6" aria-hidden="true">
                    <path d="M13.4 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.5 1.6-1.5h1.7V3.2c-.3 0-1.3-.2-2.5-.2-2.5 0-4.2 1.5-4.2 4.3v2.4H7.2v3.2H10V21h3.4Z" />
                  </svg>
                </a>
                <MobileSocialAppLink
                  href="https://www.linkedin.com/company/the-ai-bridge-iiui-fms/home/?viewAsMember=true"
                  appHref="linkedin://company/the-ai-bridge-iiui-fms"
                  label="Visit The AI Bridge on LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-palette-cream transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 lg:h-11 lg:w-11"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current lg:h-6 lg:w-6" aria-hidden="true">
                    <path d="M5.2 3a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM3.3 9h3.8v12H3.3V9Zm6.2 0h3.6v1.6h.1c.5-.9 1.7-2 3.6-2 3.9 0 4.6 2.5 4.6 5.7V21h-3.8v-5.9c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V21H9.5V9Z" />
                  </svg>
                </MobileSocialAppLink>
                <a
                  href="https://x.com/TheAIBridgeFMS"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit The AI Bridge on X"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-palette-cream transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 lg:h-11 lg:w-11"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current lg:h-6 lg:w-6" aria-hidden="true">
                    <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.3-8.4L1.8 2h6.5l4.5 6.8L18.9 2Zm-1.1 17.9h1.7L7.3 3.9H5.5l12.3 16Z" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="hidden space-y-2 sm:block sm:space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">Project Leadership</h4>
              <div className="space-y-1.5 text-[11px] sm:space-y-2 sm:text-xs">
                <div>
                  <p className="text-white font-semibold">Dr. Abdul Zahid Khan</p>
                  <p className="text-palette-cream text-[11px]">Principal Mentor & Project Lead</p>
                  <p className="text-palette-cream text-[10px]">Chairperson, Dept. of Technology & PM, FMS IIUI</p>
                </div>
                <div className="pt-2">
                  <p className="text-white font-medium">Asad Naveed & M. Sohaib Latif</p>
                  <p className="text-palette-cream text-[11px]">Core Tech & Operations Leads</p>
                </div>
                <p className="text-emerald-400/90 text-[11px] font-medium pt-1">
                  Faculty of Management Sciences, IIUI
                </p>
              </div>
            </div>
          </div>

          {/* Col 3: SDG Commitments */}
          <div className="col-span-2 min-w-0 space-y-2 sm:col-span-1 sm:space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">SDG Youth Mandate</h4>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] leading-tight text-palette-cream sm:text-[11px] lg:grid-cols-1 lg:gap-x-0">
              <li className="flex items-center gap-2">
                <Image src="/sdg-4-logo-box.svg" alt="SDG 4: Quality Education" width={32} height={32} className="h-8 w-8 flex-shrink-0 object-contain" />
                <span>SDG 4: Quality Education</span>
              </li>
              <li className="flex items-center gap-2">
                <Image src="/sdg-8-logo-box.svg" alt="SDG 8: Decent Work and Economic Growth" width={32} height={32} className="h-8 w-8 flex-shrink-0 object-contain" />
                <span>SDG 8: Decent Work & Economic Growth</span>
              </li>
              <li className="flex items-center gap-2">
                <Image src="/sdg-10-logo-box.svg" alt="SDG 10: Reduced Inequalities" width={32} height={32} className="h-8 w-8 flex-shrink-0 object-contain" />
                <span>SDG 10: Reduced Inequalities</span>
              </li>
              <li className="flex items-center gap-2">
                <Image src="/sdg-17-logo-box.svg" alt="SDG 17: Partnerships for the Goals" width={32} height={32} className="h-8 w-8 flex-shrink-0 object-contain" />
                <span>SDG 17: Partnerships for the Goals</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Quick Portals */}
          <div className="col-span-2 space-y-2 sm:space-y-3 lg:col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">Quick Portals</h4>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] sm:gap-2 sm:text-xs lg:grid-cols-1">
              <li>
                <Link href="/team" className="flex items-start gap-1 text-palette-cream transition-colors hover:text-palette-sandy">
                  <span>Team & Leadership Profiles</span>
                </Link>
              </li>
              <li>
                <Link href="/portal" className="flex items-start gap-1 text-palette-cream transition-colors hover:text-palette-sandy">
                  <span>Student 3-Step Portal</span>
                </Link>
              </li>
              {canAccessAmbassadorPortal && (
                <li>
                  <Link href="/dashboard" className="flex items-start gap-1 text-palette-cream transition-colors hover:text-palette-sandy">
                    <span>Ambassador Dashboard</span>
                  </Link>
                </li>
              )}
              <li>
                <Link href="/events" className="flex items-start gap-1 text-palette-cream transition-colors hover:text-palette-sandy">
                  <span>Event Documentation & Gallery</span>
                </Link>
              </li>
              <li>
                <Link href="/verify/AIB-2025-0001" className="flex items-start gap-1 text-palette-cream transition-colors hover:text-palette-sandy">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Public QR Verification</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 border-t border-slate-800/80 pt-4 text-[10px] text-palette-cream sm:flex-row sm:items-center sm:gap-4 sm:pt-6 sm:text-xs lg:pt-8">
          <p className="leading-relaxed">© {new Date().getFullYear()} The AI Bridge. International Islamic University Islamabad (IIUI). All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-4">
            <span className="text-palette-cream">Quick Impact Project (QIP) Framework</span>
            <span className="text-palette-sandy">•</span>
            <span className="text-emerald-400 font-medium">10 FMS SDG Ambassadors</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
