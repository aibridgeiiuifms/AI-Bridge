'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  FileCheck2,
  Award,
  ArrowRight,
  ShieldCheck,
  Search,
  GraduationCap,
} from 'lucide-react';
import SurveySelectionModal from '@/components/SurveySelectionModal';
import TiltCard from '@/components/ui/TiltCard';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function CertificationSection() {
  const router = useRouter();
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [activeSurveyType, setActiveSurveyType] = useState<'pre' | 'post'>('pre');
  const [verifySerial, setVerifySerial] = useState('');

  const handleOpenSurvey = (type: 'pre' | 'post') => {
    setActiveSurveyType(type);
    setSurveyModalOpen(true);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = verifySerial.trim();
    if (!trimmed) return;
    router.push(`/verify/${encodeURIComponent(trimmed)}`);
  };

  return (
    <section
      id="certification"
      className="py-16 sm:py-20 lg:py-24 bg-[#F8F7F4] border-b border-[#E2DFD7]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <ScrollReveal className="max-w-3xl mx-auto text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E6F0EC] text-[#0F4C3A] border border-[#C3DCD2]">
            Certification Workflow
          </span>
          <h2 className="text-balance text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            3-Step Rigorous Evaluation &amp; Direct Credentialing
          </h2>
          <p className="text-sm sm:text-base text-[#334155] leading-relaxed">
            To uphold academic integrity and measurable outcomes under the QIP framework, official IIUI certificates are unlocked through our 3-stage assessment pipeline.
          </p>
        </ScrollReveal>

        {/* 3 Step Cards with Subtle 3D Perspective Hover */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {/* Step 1 */}
          <ScrollReveal delay={0.05} className="h-full">
            <TiltCard className="h-full bg-white border border-[#E2DFD7] rounded-2xl p-6 sm:p-8 shadow-xs hover:shadow-md hover:border-[#0F4C3A]/40 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-[#E6F0EC] text-[#0F4C3A] font-extrabold text-base flex items-center justify-center border border-[#C3DCD2]">
                    01
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#F1EFEA] text-[#334155]">
                    Baseline Stage
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-snug">
                  Pre-Training Assessment Survey
                </h3>

                <p className="text-sm text-[#334155] leading-relaxed">
                  Establishes your baseline curriculum reading volume, preparation bottlenecks, and foundational familiarity with source-grounded AI tools before the workshop.
                </p>
              </div>

              <div className="pt-5 mt-6 border-t border-[#F1EFEA] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleOpenSurvey('pre')}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0F4C3A] hover:text-[#093528] underline underline-offset-4 cursor-pointer"
                >
                  <span>Launch Pre-Survey Modal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <CheckCircle2 className="w-5 h-5 text-[#0F4C3A] shrink-0" />
              </div>
            </TiltCard>
          </ScrollReveal>

          {/* Step 2 */}
          <ScrollReveal delay={0.12} className="h-full">
            <TiltCard className="h-full bg-white border-2 border-[#0F4C3A] rounded-2xl p-6 sm:p-8 shadow-md relative flex flex-col justify-between">
              <div className="absolute -top-3.5 left-6 bg-[#0F4C3A] text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Core Examination
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-[#FDF6EA] text-[#B0761E] font-extrabold text-base flex items-center justify-center border border-[#EAD1A7]">
                    02
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FDF6EA] text-[#B0761E] border border-[#EAD1A7]">
                    75% Pass Threshold
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-snug">
                  12-MCQ Course Assessment
                </h3>

                <p className="text-sm text-[#334155] leading-relaxed">
                  Dynamic examination drawn from our 50-question academic pool testing NotebookLM foundations, Audio Overviews, source citation integrity, and AI ethics.
                </p>
              </div>

              <div className="pt-5 mt-6 border-t border-[#F1EFEA] flex items-center justify-between">
                <Link
                  href="/portal/quiz"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0F4C3A] hover:text-[#093528] underline underline-offset-4"
                >
                  <span>Attempt 12-MCQ Quiz</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <FileCheck2 className="w-5 h-5 text-[#C88A2B] shrink-0" />
              </div>
            </TiltCard>
          </ScrollReveal>

          {/* Step 3 */}
          <ScrollReveal delay={0.18} className="h-full">
            <TiltCard className="h-full bg-white border border-[#E2DFD7] rounded-2xl p-6 sm:p-8 shadow-xs hover:shadow-md hover:border-[#0F4C3A]/40 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-[#E6F0EC] text-[#0F4C3A] font-extrabold text-base flex items-center justify-center border border-[#C3DCD2]">
                    03
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#F1EFEA] text-[#334155]">
                    Impact &amp; Unlock
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-snug">
                  Post-Training Survey &amp; Certificate
                </h3>

                <p className="text-sm text-[#334155] leading-relaxed">
                  Quantifies weekly preparation hours saved and comprehension gains, immediately unlocking your official QR-verifiable PDF credential.
                </p>
              </div>

              <div className="pt-5 mt-6 border-t border-[#F1EFEA] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleOpenSurvey('post')}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0F4C3A] hover:text-[#093528] underline underline-offset-4 cursor-pointer"
                >
                  <span>Launch Post-Survey Modal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Award className="w-5 h-5 text-[#0F4C3A] shrink-0" />
              </div>
            </TiltCard>
          </ScrollReveal>
        </div>

        {/* Action & Instant QR Credential Verification Bar */}
        <ScrollReveal delay={0.22}>
          <div className="bg-white border border-[#E2DFD7] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F4C3A]">
                <ShieldCheck className="w-4 h-4 text-[#C88A2B]" />
                <span>Public Credential Registry &amp; Student Workspace</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#0F172A]">
                Track Your Progress or Verify an Issued Certificate
              </h3>
              <p className="text-xs sm:text-sm text-[#334155]">
                Log into the personal Student &amp; Educator Portal to synchronize your Google Form submissions, or verify a certificate serial number below.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <form onSubmit={handleVerifySubmit} className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={verifySerial}
                    onChange={(e) => setVerifySerial(e.target.value)}
                    placeholder="Serial (e.g. AIB-2025-0001)"
                    aria-label="Certificate Serial Number"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8F7F4] text-xs sm:text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C3A] focus:bg-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#0F172A] text-white text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer"
                >
                  Verify ID
                </button>
              </form>

              <Link
                href="/portal"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F4C3A] hover:bg-[#093528] text-white text-xs sm:text-sm font-bold transition-colors shadow-xs shrink-0"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Open Portal</span>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Role Selection Modal for Pre / Post Survey */}
      <SurveySelectionModal
        isOpen={surveyModalOpen}
        onClose={() => setSurveyModalOpen(false)}
        surveyType={activeSurveyType}
      />
    </section>
  );
}

