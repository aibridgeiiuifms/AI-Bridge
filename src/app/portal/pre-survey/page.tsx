'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  BookOpen, 
  ExternalLink, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Info,
  ArrowRight,
  Lock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/tracking/trackEvent';

export default function PreSurveyPage() {
  const [user, setUser] = useState<any>(null);
  const [issuanceClosed, setIssuanceClosed] = useState(false);
  const [issuanceClosedMsg, setIssuanceClosedMsg] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    fetch('/api/admin/certificate-toggle')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.issuance_enabled === false) {
          setIssuanceClosed(true);
          if (data.closed_message) setIssuanceClosedMsg(data.closed_message);
        }
      })
      .catch(() => {});
  }, []);

  const openForm = (url: string, role: string) => {
    trackEvent('survey_started', '/portal/pre-survey', {
      survey_type: 'pre',
      academic_role: role,
      url,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8 animate-fade-in">
      <Link
        href="/portal"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Student Portal</span>
      </Link>

      <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-emerald-800 relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-3 border border-emerald-500/30">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Stage 1 Evaluation</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          Pre-Training Assessment Survey
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mt-2 leading-relaxed">
          Select whether you are a Student or a Teacher / Educator below to launch your official baseline assessment form. (Note: This is pre-training evaluation, not the MCQ course quiz).
        </p>
      </div>

      {issuanceClosed ? (
        <div className="bg-amber-50/95 border-2 border-amber-300 rounded-3xl p-8 sm:p-10 shadow-sm text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-3 py-1 rounded-full border border-amber-300">
              Evaluation Window Paused
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-3">
              Pre-Assessment Survey Currently Paused
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 mt-2 max-w-lg mx-auto leading-relaxed">
              {issuanceClosedMsg || 'The evaluation and certificate issuance window for this phase has closed. Survey submissions are currently paused.'}
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <Link
              href="/portal"
              className="px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Student Portal</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Select Your Academic Role:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Student Pre Assessment */}
              <div
                onClick={() => openForm('https://forms.gle/YZNQSZXUKJVn5o1i7', 'student')}
                className="group relative flex flex-col justify-between p-6 rounded-3xl border-2 border-emerald-200 bg-white hover:bg-emerald-50/50 hover:border-emerald-600 transition-all cursor-pointer shadow-sm hover:shadow-xl"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-md">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                    Undergraduate & Graduate
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    Student Pre-Assessment Survey
                  </h2>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Evaluates your current reading volume, assignment preparation bottlenecks, and foundational familiarity with AI tools before the training session.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    Launch Student Google Form <ExternalLink className="w-4 h-4" />
                  </span>
                  <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Teacher Pre Assessment */}
              <div
                onClick={() => openForm('https://forms.gle/RmHp9N6VuN88Xc279', 'teacher')}
                className="group relative flex flex-col justify-between p-6 rounded-3xl border-2 border-teal-200 bg-white hover:bg-teal-50/50 hover:border-teal-600 transition-all cursor-pointer shadow-sm hover:shadow-xl"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-md">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase tracking-wider mb-2">
                    Faculty & Instructors
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900 group-hover:text-teal-900 transition-colors">
                    Teacher Pre-Assessment Survey
                  </h2>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Assesses curriculum preparation challenges, lecture notes summarization hours, and expectations for educational AI integration.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-700 flex items-center gap-1.5">
                    Launch Teacher Google Form <ExternalLink className="w-4 h-4" />
                  </span>
                  <ArrowRight className="w-4 h-4 text-teal-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Email Matching Instructions</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Please fill the survey using the same email address registered on your account
                {user?.email && <span className="font-semibold text-slate-700"> ({user.email})</span>}.
                Once received, our Google Sheets webhook automatically updates your portal step progress.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
