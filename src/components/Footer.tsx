import Link from 'next/link';
import Image from 'next/image';
import { HeartHandshake, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[#1E293B] bg-[#0F172A] pt-10 pb-24 text-[#F8F7F4] sm:pt-12 sm:pb-12 lg:pt-16 lg:pb-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:mb-10 sm:gap-8 lg:mb-12 lg:grid-cols-4 lg:gap-10">
          {/* Col 1: Initiative Info */}
          <div className="col-span-2 space-y-3 sm:space-y-4 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-white/15 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
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
                <p className="text-[11px] text-[#EAD1A7] font-medium">Empowering Non-IT Academia</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Empowering and bridging the gap for non-IT educators and learners in humanities and social sciences through source-grounded AI architectures.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#0F4C3A] text-white border border-[#C3DCD2]/25 w-fit">
                <HeartHandshake className="w-3.5 h-3.5 text-[#EAD1A7]" />
                Hum Hain Pakistan (HHP) Campaign
              </span>
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 bg-[#1E293B] px-2.5 py-1 rounded-md border border-white/10 text-[11px] text-slate-200">
                  <Image
                    src="/iiui-logo.webp"
                    alt="IIUI Logo"
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain rounded-full bg-white"
                  />
                  <span>IIUI FMS</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#1E293B] px-2.5 py-1 rounded-md border border-white/10 text-[11px] text-slate-200">
                  <Image
                    src="/hhp-logo.webp"
                    alt="HHP Logo"
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain rounded-full bg-white"
                  />
                  <span>HHP Youth</span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Institutional Leadership */}
          <div className="min-w-0 space-y-2.5 sm:space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Project Leadership</h4>
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-white font-semibold">Dr. Abdul Zahid Khan</p>
                <p className="text-slate-300 text-[11px]">Principal Mentor &amp; Project Lead</p>
                <p className="text-slate-400 text-[11px]">Chairperson, Dept. of Technology &amp; PM, FMS IIUI</p>
              </div>
              <div className="pt-1.5">
                <p className="text-white font-medium">Asad Naveed &amp; M. Sohaib Latif</p>
                <p className="text-slate-300 text-[11px]">Core Tech &amp; Operations Leads</p>
              </div>
              <p className="text-[#EAD1A7] text-[11px] font-medium pt-1">
                Faculty of Management Sciences, IIUI
              </p>
            </div>
          </div>

          {/* Col 3: SDG Commitments */}
          <div className="min-w-0 space-y-2.5 sm:space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">SDG Youth Mandate</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C5192D] shrink-0"></span>
                <span>SDG 4: Quality Education</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#A21942] shrink-0"></span>
                <span>SDG 8: Decent Work &amp; Economic Growth</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DD1367] shrink-0"></span>
                <span>SDG 10: Reduced Inequalities</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#19486A] shrink-0"></span>
                <span>SDG 17: Partnerships for the Goals</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Single-Page Sections & Portals */}
          <div className="col-span-2 space-y-2.5 sm:space-y-3 lg:col-span-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Quick Navigation</h4>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs lg:grid-cols-1">
              <li>
                <Link href="/#certification" className="flex items-center gap-1.5 text-slate-300 transition-colors hover:text-[#EAD1A7]">
                  <span>3-Step Certification Pathway</span>
                </Link>
              </li>
              <li>
                <Link href="/#sdg-alignment" className="flex items-center gap-1.5 text-slate-300 transition-colors hover:text-[#EAD1A7]">
                  <span>Interactive UN SDG Wheel</span>
                </Link>
              </li>
              <li>
                <Link href="/#events" className="flex items-center gap-1.5 text-slate-300 transition-colors hover:text-[#EAD1A7]">
                  <span>Event Documentation &amp; Gallery</span>
                </Link>
              </li>
              <li>
                <Link href="/#team" className="flex items-center gap-1.5 text-slate-300 transition-colors hover:text-[#EAD1A7]">
                  <span>Leadership &amp; Ambassadors</span>
                </Link>
              </li>
              <li>
                <Link href="/portal" className="flex items-center gap-1.5 text-slate-300 transition-colors hover:text-[#EAD1A7]">
                  <span>Student Certification Portal</span>
                </Link>
              </li>
              <li>
                <Link href="/verify/AIB-2025-0001" className="flex items-center gap-1.5 text-slate-300 transition-colors hover:text-[#EAD1A7]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#EAD1A7]" />
                  <span>Public QR Verification</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:gap-4">
          <p className="leading-relaxed">
            © {new Date().getFullYear()} The AI Bridge. International Islamic University Islamabad (IIUI). All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-3">
            <span className="text-slate-300">Quick Impact Project (QIP) Framework</span>
            <span className="text-[#C88A2B]">•</span>
            <span className="text-[#EAD1A7] font-semibold">11 FMS SDG Ambassadors</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
