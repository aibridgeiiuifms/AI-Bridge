import Link from 'next/link';
import Image from 'next/image';
import { HeartHandshake, ShieldCheck, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasAmbassadorPortalRole } from '@/lib/access';

export default async function Footer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    : { data: null };
  const canAccessAmbassadorPortal = hasAmbassadorPortalRole(profile?.role);

  return (
    <footer className="border-t border-slate-800 bg-palette-haiti pt-8 pb-6 text-palette-ecru sm:pt-12 sm:pb-10 lg:pt-16 lg:pb-12">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="mb-7 grid grid-cols-2 gap-x-4 gap-y-6 sm:mb-10 sm:gap-8 lg:mb-12 lg:grid-cols-4 lg:gap-10">
          {/* Col 1: Initiative Info */}
          <div className="col-span-2 space-y-3 sm:space-y-4 lg:col-span-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-700/80 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                <img
                  src="/logo.jpg"
                  alt="The AI Bridge logo"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div>
                <span className="font-extrabold text-base text-white tracking-tight">The AI Bridge</span>
                <p className="text-[10px] text-emerald-400 font-medium">Empowering Non-IT Academia</p>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-palette-cream sm:text-xs">
              Empowering and bridging the gap for non-IT educators and learners in humanities and social sciences through source-grounded AI architectures.
            </p>
            <div className="flex flex-col gap-1.5 pt-1 sm:gap-2 sm:pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 w-fit">
                <HeartHandshake className="w-3.5 h-3.5" />
                Hum Hain Pakistan (HHP) Campaign
              </span>
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded border border-slate-700/60 text-[10px] text-palette-ecru">
                  <img src="/iiui-logo.jpg" alt="IIUI Logo" className="w-4 h-4 object-contain rounded-full bg-white" />
                  <span>IIUI FMS</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded border border-slate-700/60 text-[10px] text-palette-ecru">
                  <img src="/hhp-logo.jpeg" alt="HHP Logo" className="w-4 h-4 object-contain rounded-full bg-white" />
                  <span>HHP Youth</span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Institutional Leadership */}
          <div className="min-w-0 space-y-2 sm:space-y-3">
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

          {/* Col 3: SDG Commitments */}
          <div className="min-w-0 space-y-2 sm:space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">SDG Youth Mandate</h4>
            <ul className="space-y-1.5 text-[11px] text-palette-cream sm:space-y-2 sm:text-xs">
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                <span>SDG 4: Quality Education</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="w-2 h-2 rounded-full bg-red-700"></span>
                <span>SDG 8: Decent Work & Economic Growth</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                <span>SDG 10: Reduced Inequalities</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
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
            <span className="text-emerald-400 font-medium">11 FMS SDG Ambassadors</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
