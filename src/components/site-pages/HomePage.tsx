import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getCurrentUser, getCurrentUserProfile } from '@/lib/supabase/queries';
import { hasAmbassadorPortalRole } from '@/lib/access';
import HighlightsCarouselSkeleton from '@/components/skeletons/HighlightsCarouselSkeleton';
import SdgWheelSkeleton from '@/components/skeletons/SdgWheelSkeleton';

const HighlightsCarousel = dynamic(
  () => import('@/components/HighlightsCarousel'),
  {
    loading: () => <HighlightsCarouselSkeleton />,
  }
);

const SdgSharedLayoutWheel = dynamic(
  () => import('@/components/sdg-wheel/SdgSharedLayoutWheel'),
  {
    loading: () => <SdgWheelSkeleton />,
  }
);

import humHainPakistanLogo from '../../../Assets/hum hain pak logo.webp';
import sdgLogo from '../../../Assets/SDG Logo.webp';
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

export default async function HomePageContent() {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentUserProfile(user.id) : null;
  const canAccessAmbassadorPortal = hasAmbassadorPortalRole(profile?.role);

  return (
    <div className="space-y-8 pb-8 sm:space-y-16 sm:pb-16 lg:space-y-20 lg:pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 px-3 py-3 text-white sm:px-6 sm:py-6 md:py-8 lg:px-8 lg:py-10">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#EF6959_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>
        <div className="relative z-10 mx-auto grid min-w-0 max-w-6xl grid-cols-1 items-center gap-3.5 sm:gap-6 md:grid-cols-2 md:gap-8 lg:gap-10">
          {/* Left Column: Logos, Content, CTAs, Metrics */}
          <div className="flex min-w-0 flex-col space-y-2 sm:space-y-4 text-center md:text-left">
            {/* Logos: SDG Logo & Hum Hain Pak Logo */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3.5 md:justify-start">
              <div className="flex h-7 sm:h-9 md:h-10 lg:h-11 items-center">
                <Image
                  src={sdgLogo}
                  alt="Sustainable Development Goals emblem"
                  height={44}
                  priority
                  className="h-6 sm:h-8 md:h-9 lg:h-10 w-auto object-contain"
                />
              </div>
              <div className="flex h-8 sm:h-11 md:h-12 lg:h-13 items-center rounded-lg sm:rounded-xl border border-white/80 bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-md">
                <Image
                  src={humHainPakistanLogo}
                  alt="Hum Hain Pakistan — United for a Brighter Tomorrow"
                  height={48}
                  priority
                  className="h-6 sm:h-9 md:h-10 lg:h-11 w-auto object-contain"
                />
              </div>
            </div>

            <h1 className="text-balance text-lg font-extrabold leading-snug tracking-tight text-white sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
              The AI Bridge:
              <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
                Empowering Non-IT Educators & Learners
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-[11px] leading-relaxed text-slate-300 sm:text-sm md:mx-0 lg:text-base">
              Pioneered at the Faculty of Management Sciences (FMS), International Islamic University Islamabad under the leadership of Dr. Abdul Zahid Khan. Transforming dense classical curricula into interactive, multi-modal study guides and podcasts with source-grounded AI.
            </p>

            <div className="flex flex-col items-stretch justify-center gap-2 pt-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:pt-1 md:justify-start">
              <Link
                href="/portal"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:from-emerald-600 hover:to-teal-600 sm:w-auto sm:gap-2 sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm"
              >
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="min-w-0">Enter Student & Educator Portal</span>
                <ArrowRight className="ml-0.5 h-3.5 w-3.5 sm:ml-1 sm:h-4 sm:w-4" />
              </Link>

              <Link
                href="/events"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/15 sm:w-auto sm:gap-2 sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm"
              >
                <CalendarDays className="h-3.5 w-3.5 text-emerald-300 sm:h-4 sm:w-4" />
                <span className="min-w-0">Explore Campaign Events</span>
              </Link>
            </div>

            {/* Quick Metrics (Remaining Cards) */}
            <div className="grid min-w-0 grid-cols-2 gap-2 pt-0.5 sm:gap-3 sm:pt-1">
              <div className="min-w-0 rounded-lg border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm sm:rounded-xl sm:p-2.5">
                <div className="break-words text-xs font-black leading-tight text-teal-300 sm:text-xl">10 Ambassadors</div>
                <div className="text-[8.5px] font-medium leading-tight text-slate-300 sm:text-xs">FMS SDG Core Volunteer Team</div>
              </div>
              <div className="min-w-0 rounded-lg border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm sm:rounded-xl sm:p-2.5">
                <div className="text-xs font-black text-purple-300 sm:text-xl">100% Free</div>
                <div className="text-[8.5px] font-medium leading-tight text-slate-300 sm:text-xs">Zero-Cost Scaling (No Licenses)</div>
              </div>
            </div>
          </div>

          {/* Right Column: Highlights Image Container */}
          <div className="flex w-full min-w-0 items-center justify-center">
            <HighlightsCarousel />
          </div>
        </div>
      </section>

      {/* 3-Step Certification Lifecycle Section */}
      <section className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="mb-4 space-y-1.5 text-center sm:mb-10 sm:space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full sm:px-3 sm:text-xs">
            Certification Workflow
          </span>
          <h2 className="text-balance text-lg font-extrabold text-slate-900 tracking-tight sm:text-3xl">
            3-Step Rigorous Evaluation & Direct Download
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-[11px] leading-relaxed sm:text-sm">
            To maintain academic integrity and verifiable outcomes, certificates are earned through our 3-stage system and downloaded securely via the personal student portal.
          </p>
        </div>

        {/* 3 Steps in a single horizontal row across all viewports (mobile, tablet, desktop) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-5 md:gap-8 items-stretch">
          {/* Step 1 */}
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-5 md:p-7 shadow-xs hover:shadow-md transition-shadow relative flex flex-col justify-between sm:rounded-2xl">
            <div>
              <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl bg-emerald-100 text-emerald-800 font-black text-[11px] sm:text-base flex items-center justify-center mb-1.5 sm:mb-4">
                01
              </div>
              <h3 className="text-[11px] sm:text-base font-bold text-slate-900 mb-1 leading-snug sm:mb-2">
                <span className="block sm:hidden">Pre-Survey</span>
                <span className="hidden sm:inline">Step 1: Pre-Training Assessment Survey</span>
              </h3>
              <p className="text-[9.5px] sm:text-xs text-slate-600 leading-normal mb-2 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Establishes your baseline curriculum bottlenecks, preparation hours, and AI familiarity.
              </p>
            </div>
            <div className="pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-[9px] sm:text-xs font-semibold text-emerald-700">
              <Link href="/portal/pre-survey" className="hover:underline flex items-center gap-0.5 truncate">
                <span className="truncate">Open Form</span>
                <span>→</span>
              </Link>
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-emerald-600" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border-2 border-emerald-500 rounded-xl p-2.5 sm:p-5 md:p-7 shadow-sm relative flex flex-col justify-between sm:rounded-2xl">
            <div className="absolute -top-2.5 sm:-top-3.5 left-2 sm:left-6 bg-emerald-600 text-white text-[8px] sm:text-[11px] font-bold px-1.5 sm:px-3 py-0.5 rounded-full uppercase tracking-wider">
              Core Exam
            </div>
            <div>
              <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl bg-amber-100 text-amber-800 font-black text-[11px] sm:text-base flex items-center justify-center mb-1.5 sm:mb-4">
                02
              </div>
              <h3 className="text-[11px] sm:text-base font-bold text-slate-900 mb-1 leading-snug sm:mb-2">
                <span className="block sm:hidden">12-MCQ Quiz</span>
                <span className="hidden sm:inline">Step 2: 12-MCQ Assessment</span>
              </h3>
              <p className="text-[9.5px] sm:text-xs text-slate-600 leading-normal mb-2 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Dynamic exam from question pool testing source-grounding, Audio Overviews, and AI ethics.
              </p>
            </div>
            <div className="pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-[9px] sm:text-xs font-semibold text-amber-700">
              <span className="truncate">75% Benchmark</span>
              <FileCheck2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-amber-600" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-5 md:p-7 shadow-xs hover:shadow-md transition-shadow relative flex flex-col justify-between sm:rounded-2xl">
            <div>
              <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl bg-teal-100 text-teal-800 font-black text-[11px] sm:text-base flex items-center justify-center mb-1.5 sm:mb-4">
                03
              </div>
              <h3 className="text-[11px] sm:text-base font-bold text-slate-900 mb-1 leading-snug sm:mb-2">
                <span className="block sm:hidden">Post-Survey</span>
                <span className="hidden sm:inline">Step 3: Post-Training Assessment Survey</span>
              </h3>
              <p className="text-[9.5px] sm:text-xs text-slate-600 leading-normal mb-2 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                Quantifies hours saved and comprehension boost. Unlocks verified PDF certificate.
              </p>
            </div>
            <div className="pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-[9px] sm:text-xs font-semibold text-teal-700">
              <Link href="/portal/post-survey" className="hover:underline flex items-center gap-0.5 truncate">
                <span className="truncate">Open Form</span>
                <span>→</span>
              </Link>
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-8 text-center">
          <Link
            href="/portal"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-4 sm:gap-2 sm:text-sm"
          >
            Start your certification journey now →
          </Link>
        </div>
      </section>

      {/* Interactive Framer Motion Shared Layout SDG Wheel Section */}
      <section className="border-y border-slate-200/80 bg-[#F7F5E9]">
        <SdgSharedLayoutWheel />
      </section>

      {canAccessAmbassadorPortal && (
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
      )}
    </div>
  );
}
