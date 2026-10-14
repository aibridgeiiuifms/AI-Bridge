import Link from 'next/link';
import Image from 'next/image';
import { HeartHandshake, ShieldCheck, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AMBASSADOR_PORTAL_EMAIL } from '@/lib/access';

export default async function Footer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const canAccessAmbassadorPortal =
    user?.email?.trim().toLowerCase() === AMBASSADOR_PORTAL_EMAIL;

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Initiative Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
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
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering and bridging the gap for non-IT educators and learners in humanities and social sciences through source-grounded AI architectures.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 w-fit">
                <HeartHandshake className="w-3.5 h-3.5" />
                Hum Hain Pakistan (HHP) Campaign
              </span>
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded border border-slate-700/60 text-[10px] text-slate-300">
                  <img src="/iiui-logo.jpg" alt="IIUI Logo" className="w-4 h-4 object-contain rounded-full bg-white" />
                  <span>IIUI FMS</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded border border-slate-700/60 text-[10px] text-slate-300">
                  <img src="/hhp-logo.jpeg" alt="HHP Logo" className="w-4 h-4 object-contain rounded-full bg-white" />
                  <span>HHP Youth</span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Institutional Leadership */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">Project Leadership</h4>
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-white font-semibold">Dr. Abdul Zahid Khan</p>
                <p className="text-slate-400 text-[11px]">Principal Mentor & Project Lead</p>
                <p className="text-slate-500 text-[10px]">Chairperson, Dept. of Technology & PM, FMS IIUI</p>
              </div>
              <div className="pt-2">
                <p className="text-white font-medium">Asad Naveed & M. Sohaib Latif</p>
                <p className="text-slate-400 text-[11px]">Core Tech & Operations Leads</p>
              </div>
              <p className="text-emerald-400/90 text-[11px] font-medium pt-1">
                Faculty of Management Sciences, IIUI
              </p>
            </div>
          </div>

          {/* Col 3: SDG Commitments */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">SDG Youth Mandate</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                <span>SDG 4: Quality Education</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-700"></span>
                <span>SDG 8: Decent Work & Economic Growth</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                <span>SDG 10: Reduced Inequalities</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>SDG 17: Partnerships for the Goals</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Quick Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">Quick Portals</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/team" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>Team & Leadership Profiles</span>
                </Link>
              </li>
              <li>
                <Link href="/portal" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>Student 3-Step Portal</span>
                </Link>
              </li>
              {canAccessAmbassadorPortal && (
                <li>
                  <Link href="/dashboard" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1">
                    <span>Ambassador Dashboard</span>
                  </Link>
                </li>
              )}
              <li>
                <Link href="/events" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>Event Documentation & Gallery</span>
                </Link>
              </li>
              <li>
                <Link href="/verify/AIB-2025-0001" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Public QR Verification</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} The AI Bridge. International Islamic University Islamabad (IIUI). All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Quick Impact Project (QIP) Framework</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-medium">10 FMS SDG Ambassadors</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
