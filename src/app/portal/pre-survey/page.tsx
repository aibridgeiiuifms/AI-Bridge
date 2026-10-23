'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  BookOpen,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  Info,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function PreSurveyPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const openForm = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8 animate-fade-in">
      <Link
        href="/portal"
        className="inline-flex items-center gap-2 text-xs font-bold text-[#334155] hover:text-[#0F4C3A] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Student Portal</span>
      </Link>

      <div className="bg-[#0F4C3A] text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-[#093528] relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#093528] text-[#EAD1A7] text-xs font-bold uppercase tracking-wider mb-3 border border-white/15">
          <Sparkles className="w-3.5 h-3.5 text-[#C88A2B]" />
          <span>Stage 1 Evaluation</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          Pre-Training Assessment Survey
        </h1>
        <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mt-2 leading-relaxed">
          Select whether you are a Student or a Teacher / Educator below to launch your official baseline assessment form. (Note: This is pre-training evaluation, not the MCQ course quiz).
        </p>
      </div>

      <div className="space-y-4">
        <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
          Select Your Academic Role:
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Student Pre Assessment */}
          <div
            onClick={() => openForm('https://forms.gle/YZNQSZXUKJVn5o1i7')}
            className="group relative flex flex-col justify-between p-6 rounded-3xl border-2 border-[#C3DCD2] bg-white hover:bg-[#E6F0EC]/40 hover:border-[#0F4C3A] transition-all cursor-pointer shadow-sm hover:shadow-xl"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#0F4C3A] text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-md">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#E6F0EC] text-[#0F4C3A] text-xs font-bold uppercase tracking-wider mb-2 border border-[#C3DCD2]">
                Undergraduate &amp; Graduate
              </div>
              <h2 className="text-lg font-extrabold text-[#0F172A] group-hover:text-[#0F4C3A] transition-colors">
                Student Pre-Assessment Survey
              </h2>
              <p className="text-xs text-[#334155] mt-2 leading-relaxed">
                Evaluates your current reading volume, assignment preparation bottlenecks, and foundational familiarity with AI tools before the training session.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F1EFEA] flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F4C3A] flex items-center gap-1.5">
                Launch Student Google Form <ExternalLink className="w-4 h-4" />
              </span>
              <ArrowRight className="w-4 h-4 text-[#0F4C3A] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Teacher Pre Assessment */}
          <div
            onClick={() => openForm('https://forms.gle/RmHp9N6VuN88Xc279')}
            className="group relative flex flex-col justify-between p-6 rounded-3xl border-2 border-[#EAD1A7] bg-white hover:bg-[#FDF6EA]/60 hover:border-[#C88A2B] transition-all cursor-pointer shadow-sm hover:shadow-xl"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#1E293B] text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-md">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#FDF6EA] text-[#B0761E] text-xs font-bold uppercase tracking-wider mb-2 border border-[#EAD1A7]">
                Faculty &amp; Instructors
              </div>
              <h2 className="text-lg font-extrabold text-[#0F172A] group-hover:text-[#1E293B] transition-colors">
                Teacher Pre-Assessment Survey
              </h2>
              <p className="text-xs text-[#334155] mt-2 leading-relaxed">
                Assesses curriculum preparation challenges, lecture notes summarization hours, and expectations for educational AI integration.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F1EFEA] flex items-center justify-between">
              <span className="text-xs font-bold text-[#B0761E] flex items-center gap-1.5">
                Launch Teacher Google Form <ExternalLink className="w-4 h-4" />
              </span>
              <ArrowRight className="w-4 h-4 text-[#B0761E] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E2DFD7] rounded-2xl p-4 text-xs text-[#334155] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#0F4C3A] flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#0F172A]">Email Matching Instructions</p>
          <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
            Please fill the survey using the same email address registered on your account
            {user?.email && <span className="font-semibold text-[#0F172A]"> ({user.email})</span>}.
            Once received, our Google Sheets webhook automatically updates your portal step progress.
          </p>
        </div>
      </div>
    </div>
  );
}
