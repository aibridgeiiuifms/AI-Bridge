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
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 px-4 py-4 text-white sm:px-6 sm:py-6 md:py-8 lg:px-8 lg:py-10">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-4 md:grid-cols-[0.8fr_1.2fr] md:gap-6 lg:gap-10">
          <div className="flex flex-col items-start gap-1">
            <div className="w-[min(76vw,280px)] rounded-xl border border-white/70 bg-white p-1.5 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.7)] md:w-full md:max-w-[320px] md:p-2 xl:max-w-[380px]">
              <Image
                src={humHainPakistanLogo}
                alt="Hum Hain Pakistan — United for a Brighter Tomorrow"
                width={2752}
                height={1536}
                priority
                className="h-auto w-full object-contain"
              />
            </div>
            <div className="w-[min(76vw,280px)] px-1.5 md:w-full md:max-w-[320px] md:px-2 xl:max-w-[380px]">
              <Image
                src={sdgLogo}
                alt="Sustainable Development Goals emblem"
                width={2000}
                height={280}
                priority
                className="h-auto w-full object-contain"
              />
            </div>
          </div>

          <div className="space-y-3 text-center md:space-y-2 md:text-left lg:space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-200 sm:text-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Hum Hain Pakistan • SDG Youth Campaign Pilot</span>
            </div>

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-3xl lg:text-4xl xl:text-5xl">
              The AI Bridge:
              <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
                Empowering Non-IT Educators & Learners
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base md:mx-0 md:text-sm lg:text-base">
              Pioneered at the Faculty of Management Sciences (FMS), International Islamic University Islamabad under the leadership of Dr. Abdul Zahid Khan. Transforming dense classical curricula into interactive, multi-modal study guides and podcasts with source-grounded AI.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1 lg:justify-start">
              <Link
                href="/portal"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:from-emerald-600 hover:to-teal-600"
              >
                <GraduationCap className="h-5 w-5" />
                <span>Enter Student & Educator Portal</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>

              <Link
                href="/events"
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/15"
              >
                <CalendarDays className="h-4 w-4 text-emerald-300" />
                <span>Explore Campaign Events</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:col-span-2 lg:gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm sm:p-3">
              <div className="text-xl font-black text-amber-300 sm:text-2xl">3–5 hrs</div>
              <div className="text-[11px] font-medium text-slate-300 sm:text-xs">Weekly Prep Time Saved</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm sm:p-3">
              <div className="text-xl font-black text-emerald-300 sm:text-2xl">3+ Courses</div>
              <div className="text-[11px] font-medium text-slate-300 sm:text-xs">Non-IT Curricula Augmented</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm sm:p-3">
              <div className="text-xl font-black text-teal-300 sm:text-2xl">10 Ambassadors</div>
              <div className="text-[11px] font-medium text-slate-300 sm:text-xs">FMS SDG Core Volunteer Team</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm sm:p-3">
              <div className="text-xl font-black text-purple-300 sm:text-2xl">100% Free</div>
              <div className="text-[11px] font-medium text-slate-300 sm:text-xs">Zero-Cost Scaling (No Licenses)</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Certification Lifecycle Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            Certification Workflow
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            3-Step Rigorous Evaluation & Direct Download
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm">
            To maintain academic integrity and verifiable outcomes, certificates are earned through our 3-stage system and downloaded securely via the personal student portal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center mb-5">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Step 1: Baseline Pre-Survey</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Establishes your baseline curriculum bottlenecks, text-heavy preparation hours, and AI familiarity. Records foundational data for the QIP impact evaluation.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
              <span>Unlocks Stage 2 (MCQ Exam)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border-2 border-emerald-500 rounded-2xl p-7 shadow-md relative flex flex-col justify-between">
            <div className="absolute -top-3.5 left-6 bg-emerald-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              Core Evaluation
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 font-black text-lg flex items-center justify-center mb-5">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Step 2: 30-MCQ Assessment</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Our custom assessment engine dynamically draws 30 randomized questions from a certified 50-MCQ question pool. Tests source-grounding, Audio Overviews, and AI ethics.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-700">
              <span>70% Passing Benchmark (21/30)</span>
              <FileCheck2 className="w-4 h-4 text-amber-600" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 font-black text-lg flex items-center justify-center mb-5">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Step 3: Post-Survey & Download</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Quantifies actual hours saved and comprehension boost. Unlocks an official PDF certificate with embedded QR verification, signed by Dr. Abdul Zahid Khan.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
              <span>Instant Portal PDF Download</span>
              <Award className="w-4 h-4 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/portal"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-4"
          >
            Start your certification journey now →
          </Link>
        </div>
      </section>

      {/* SDG Alignment Section */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl font-bold text-slate-900">United Nations Sustainable Development Goals</h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              How The AI Bridge addresses regional educational challenges under the Hum Hain Pakistan campaign.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-sm">SDG 4: Quality Education</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Empowers non-IT humanities classrooms (Sharia, Arabic, Urdu, Usuluddin) with source-grounded Audio Overviews and study guides.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-8 h-8 rounded-lg bg-red-900 text-red-100 font-bold flex items-center justify-center text-sm">
                8
              </div>
              <h3 className="font-bold text-slate-900 text-sm">SDG 8: Decent Work</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Directly combats educator burnout by reducing repetitive manual lecture preparation and administrative formatting by 3–5 hours weekly.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-700 font-bold flex items-center justify-center text-sm">
                10
              </div>
              <h3 className="font-bold text-slate-900 text-sm">SDG 10: Reduced Inequalities</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Democratizes AI tools beyond computer science labs, ensuring religious, legal, and linguistic scholars have equal modern capabilities.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                17
              </div>
              <h3 className="font-bold text-slate-900 text-sm">SDG 17: Partnerships</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Builds institutional bridges connecting FMS ambassadors, participating faculties, and national youth campaign platforms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership & Ambassadors */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Institutional Governance
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Led by Faculty, Driven by Ambassadors
            </h2>
            <p className="text-sm text-emerald-100 leading-relaxed">
              Under the strategic mentorship of <strong>Dr. Abdul Zahid Khan</strong> (Chairperson, Department of Technology & Project Management), ten dedicated FMS SDG Ambassadors operate across three specialized functional teams: <em>Awareness Campaign</em>, <em>Workshops & Trainings</em>, and <em>Analyzing & Reporting</em>.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs">
              <div className="bg-emerald-800/80 px-3 py-1.5 rounded-lg border border-emerald-700">
                <strong>Team Leads:</strong> Asad Naveed Akbar & M. Sohaib Latif
              </div>
              <div className="bg-emerald-800/80 px-3 py-1.5 rounded-lg border border-emerald-700">
                <strong>Institution:</strong> IIUI Islamabad (FMS)
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 justify-center">
            <Link
              href="/dashboard"
              className="px-5 py-3 rounded-xl font-bold text-sm bg-amber-400 hover:bg-amber-300 text-slate-900 text-center transition-colors shadow-md"
            >
              Ambassador Dashboard
            </Link>
            <Link
              href="/verify/AIB-2025-0001"
              className="px-5 py-3 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white text-center border border-white/20 transition-colors"
            >
              Sample QR Verification
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
