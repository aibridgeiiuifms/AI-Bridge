import Image from 'next/image';
import Link from 'next/link';
import humHainPakistanLogo from '../../Assets/hum hain pak logo.jpg';
import sdgLogo from '../../Assets/SDG Logo.png';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FileCheck2, 
  ShieldCheck, 
  Users, 
  Layers, 
  GraduationCap, 
  BookOpen, 
  Award,
  CalendarDays
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-8 pb-8 sm:space-y-16 sm:pb-16 lg:space-y-20 lg:pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 px-3 py-3 text-white sm:px-6 sm:py-6 md:py-8 lg:px-8 lg:py-10">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>
        <div className="relative z-10 mx-auto grid min-w-0 max-w-6xl grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-6 lg:gap-10">
          <div className="flex min-w-0 flex-col items-center gap-1 sm:gap-2 md:items-start">
            <div className="w-3/4 max-w-full px-1 sm:w-4/5 sm:px-1.5 md:w-full md:px-2">
              <Image
                src={sdgLogo}
                alt="Sustainable Development Goals emblem"
                width={2000}
                height={280}
                priority
                className="h-auto w-full object-contain"
              />
            </div>
            <div className="w-3/4 max-w-full rounded-lg border border-white/70 bg-white p-1 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.7)] sm:w-4/5 sm:rounded-xl sm:p-1.5 md:w-full md:p-2">
              <Image
                src={humHainPakistanLogo}
                alt="Hum Hain Pakistan — United for a Brighter Tomorrow"
                width={2752}
                height={1536}
                priority
                className="h-auto w-full object-contain"
              />
            </div>
          </div>

          <div className="min-w-0 space-y-2 text-center sm:space-y-3 md:col-start-2 md:row-start-1 md:space-y-2 md:text-left lg:space-y-3">
            <h1 className="text-balance text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-3xl lg:text-4xl xl:text-5xl">
              The AI Bridge:
              <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
                Empowering Non-IT Educators & Learners
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-base md:mx-0 md:text-sm lg:text-base">
              Pioneered at the Faculty of Management Sciences (FMS), International Islamic University Islamabad under the leadership of Dr. Abdul Zahid Khan. Transforming dense classical curricula into interactive, multi-modal study guides and podcasts with source-grounded AI.
            </p>

            <div className="flex flex-col items-stretch justify-center gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 lg:justify-start">
              <Link
                href="/portal"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-2.5 text-[11px] font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:from-emerald-600 hover:to-teal-600 sm:w-auto sm:gap-2 sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm"
              >
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="min-w-0">Enter Student & Educator Portal</span>
                <ArrowRight className="ml-0.5 h-3.5 w-3.5 sm:ml-1 sm:h-4 sm:w-4" />
              </Link>

              <Link
                href="/events"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2 py-2.5 text-[11px] font-semibold text-white backdrop-blur-md transition-all hover:bg-white/15 sm:w-auto sm:gap-2 sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm"
              >
                <CalendarDays className="h-3.5 w-3.5 text-emerald-300 sm:h-4 sm:w-4" />
                <span className="min-w-0">Explore Campaign Events</span>
              </Link>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2 md:col-span-2 md:row-start-2 lg:gap-3">
            <div className="min-w-0 rounded-lg border border-white/10 bg-white/5 p-2 backdrop-blur-sm sm:rounded-xl sm:p-3">
              <div className="text-base font-black text-amber-300 sm:text-2xl">3–5 hrs</div>
              <div className="text-[9px] font-medium leading-tight text-slate-300 sm:text-xs">Weekly Prep Time Saved</div>
            </div>
            <div className="min-w-0 rounded-lg border border-white/10 bg-white/5 p-2 backdrop-blur-sm sm:rounded-xl sm:p-3">
              <div className="text-base font-black text-emerald-300 sm:text-2xl">3+ Courses</div>
              <div className="text-[9px] font-medium leading-tight text-slate-300 sm:text-xs">Non-IT Curricula Augmented</div>
            </div>
            <div className="min-w-0 rounded-lg border border-white/10 bg-white/5 p-2 backdrop-blur-sm sm:rounded-xl sm:p-3">
              <div className="break-words text-sm font-black leading-tight text-teal-300 sm:text-2xl">10 Ambassadors</div>
              <div className="text-[9px] font-medium leading-tight text-slate-300 sm:text-xs">FMS SDG Core Volunteer Team</div>
            </div>
            <div className="min-w-0 rounded-lg border border-white/10 bg-white/5 p-2 backdrop-blur-sm sm:rounded-xl sm:p-3">
              <div className="text-base font-black text-purple-300 sm:text-2xl">100% Free</div>
              <div className="text-[9px] font-medium leading-tight text-slate-300 sm:text-xs">Zero-Cost Scaling (No Licenses)</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Certification Lifecycle Section */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-2 text-center sm:mb-12 sm:space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full sm:px-3 sm:text-xs">
            Certification Workflow
          </span>
          <h2 className="text-balance text-xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
            3-Step Rigorous Evaluation & Direct Download
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-xs leading-relaxed sm:text-sm">
            To maintain academic integrity and verifiable outcomes, certificates are earned through our 3-stage system and downloaded securely via the personal student portal.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-3 md:gap-8">
          {/* Step 1 */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between sm:rounded-2xl sm:p-7">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 font-black text-base flex items-center justify-center mb-3 sm:mb-5 sm:h-12 sm:w-12 sm:rounded-xl sm:text-lg">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5 sm:mb-2 sm:text-lg">Step 1: Pre-Training Assessment Survey</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3 sm:mb-4 sm:text-sm">
                Establishes your baseline curriculum bottlenecks, text-heavy preparation hours, and AI familiarity. Student & Teacher forms available for pre-training evaluation.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px] font-semibold text-emerald-700 sm:pt-4 sm:text-xs">
              <Link href="/portal/pre-survey" className="hover:underline flex items-center gap-1">
                <span>Open Pre-Survey Form</span>
                <span>→</span>
              </Link>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border-2 border-emerald-500 rounded-xl p-4 shadow-md relative flex flex-col justify-between sm:rounded-2xl sm:p-7">
            <div className="absolute -top-3.5 left-4 bg-emerald-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider sm:left-6 sm:px-3 sm:text-[11px]">
              Core Evaluation
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 font-black text-base flex items-center justify-center mb-3 sm:mb-5 sm:h-12 sm:w-12 sm:rounded-xl sm:text-lg">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5 sm:mb-2 sm:text-lg">Step 2: 30-MCQ Assessment</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3 sm:mb-4 sm:text-sm">
                Our custom assessment engine dynamically draws 30 randomized questions from a certified 50-MCQ question pool. Tests source-grounding, Audio Overviews, and AI ethics.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px] font-semibold text-amber-700 sm:pt-4 sm:text-xs">
              <span>70% Passing Benchmark (21/30)</span>
              <FileCheck2 className="w-4 h-4 flex-shrink-0 text-amber-600" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between sm:rounded-2xl sm:p-7">
            <div>
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 font-black text-base flex items-center justify-center mb-3 sm:mb-5 sm:h-12 sm:w-12 sm:rounded-xl sm:text-lg">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5 sm:mb-2 sm:text-lg">Step 3: Post-Training Assessment Survey</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3 sm:mb-4 sm:text-sm">
                Quantifies actual hours saved and comprehension boost after training. Unlocks an official PDF certificate with embedded QR verification.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px] font-semibold text-teal-700 sm:pt-4 sm:text-xs">
              <Link href="/portal/post-survey" className="hover:underline flex items-center gap-1">
                <span>Open Post-Survey Form</span>
                <span>→</span>
              </Link>
              <Award className="w-4 h-4 flex-shrink-0 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="mt-6 text-center sm:mt-10">
          <Link
            href="/portal"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-4 sm:gap-2 sm:text-sm"
          >
            Start your certification journey now →
          </Link>
        </div>
      </section>

      {/* SDG Alignment Section */}
      <section className="border-y border-slate-200 bg-slate-100/70 py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="mb-6 space-y-2 text-center sm:mb-12">
            <h2 className="text-balance text-lg font-bold text-slate-900 sm:text-2xl">United Nations Sustainable Development Goals</h2>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm max-w-xl mx-auto">
              How The AI Bridge addresses regional educational challenges under the Hum Hain Pakistan campaign.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-6 lg:grid-cols-4">
            <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:space-y-3 sm:rounded-xl sm:p-6">
              <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs sm:h-8 sm:w-8 sm:text-sm">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">SDG 4: Quality Education</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed sm:text-xs">
                Empowers non-IT humanities classrooms (Sharia, Arabic, Urdu, Usuluddin) with source-grounded Audio Overviews and study guides.
              </p>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:space-y-3 sm:rounded-xl sm:p-6">
              <div className="w-7 h-7 rounded-lg bg-red-900 text-red-100 font-bold flex items-center justify-center text-xs sm:h-8 sm:w-8 sm:text-sm">
                8
              </div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">SDG 8: Decent Work</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed sm:text-xs">
                Directly combats educator burnout by reducing repetitive manual lecture preparation and administrative formatting by 3–5 hours weekly.
              </p>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:space-y-3 sm:rounded-xl sm:p-6">
              <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 font-bold flex items-center justify-center text-xs sm:h-8 sm:w-8 sm:text-sm">
                10
              </div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">SDG 10: Reduced Inequalities</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed sm:text-xs">
                Democratizes AI tools beyond computer science labs, ensuring religious, legal, and linguistic scholars have equal modern capabilities.
              </p>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:space-y-3 sm:rounded-xl sm:p-6">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs sm:h-8 sm:w-8 sm:text-sm">
                17
              </div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">SDG 17: Partnerships</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed sm:text-xs">
                Builds institutional bridges connecting FMS ambassadors, participating faculties, and national youth campaign platforms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership & Ambassadors */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-4 rounded-2xl bg-emerald-900 p-4 text-white shadow-xl sm:gap-8 sm:rounded-3xl sm:p-8 lg:grid-cols-3 lg:p-12">
          <div className="space-y-3 sm:space-y-4 lg:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 sm:text-xs">
              Institutional Governance
            </span>
            <h2 className="text-balance text-xl font-extrabold text-white sm:text-3xl">
              Led by Faculty, Driven by Ambassadors
            </h2>
            <p className="text-xs text-emerald-100 leading-relaxed sm:text-sm">
              Under the strategic mentorship of <strong>Dr. Abdul Zahid Khan</strong> (Chairperson, Department of Technology & Project Management), ten dedicated FMS SDG Ambassadors operate across three specialized functional teams: <em>Awareness Campaign</em>, <em>Workshops & Trainings</em>, and <em>Analyzing & Reporting</em>.
            </p>
            <div className="pt-1 flex flex-wrap gap-2 text-[10px] sm:gap-4 sm:pt-2 sm:text-xs">
              <div className="bg-emerald-800/80 px-2.5 py-1 rounded-lg border border-emerald-700 sm:px-3 sm:py-1.5">
                <strong>Team Leads:</strong> Asad Naveed Akbar & M. Sohaib Latif
              </div>
              <div className="bg-emerald-800/80 px-2.5 py-1 rounded-lg border border-emerald-700 sm:px-3 sm:py-1.5">
                <strong>Institution:</strong> IIUI Islamabad (FMS)
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 justify-center sm:gap-3">
            <Link
              href="/dashboard"
              className="w-full px-4 py-2.5 rounded-lg font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-900 text-center transition-colors shadow-md sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm"
            >
              Ambassador Dashboard
            </Link>
            <Link
              href="/verify/AIB-2025-0001"
              className="w-full px-4 py-2.5 rounded-lg font-semibold text-xs bg-white/10 hover:bg-white/20 text-white text-center border border-white/20 transition-colors sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm"
            >
              Sample QR Verification
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
