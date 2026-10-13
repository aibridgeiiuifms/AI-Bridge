'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  CheckCircle2, 
  Circle, 
  Lock, 
  ArrowRight, 
  Download, 
  ShieldCheck, 
  HelpCircle,
  FileText,
  Award,
  AlertCircle,
  Eye,
  ShieldAlert
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SurveySelectionModal from '@/components/SurveySelectionModal';

export default function StudentPortal() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [accessRestricted, setAccessRestricted] = useState(false);

  // Survey Selection Modal State
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [activeSurveyType, setActiveSurveyType] = useState<'pre' | 'post'>('pre');

  // 3-Step Progress State
  const [preSurveyCompleted, setPreSurveyCompleted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [postSurveyCompleted, setPostSurveyCompleted] = useState(false);
  const [certificateReady, setCertificateReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          setProfile(prof);

          // Check Pre-Survey (by user_id or email synced from Google Sheets)
          const userEmail = (user.email || '').trim().toLowerCase();
          const { data: pre } = await supabase
            .from('surveys')
            .select('id')
            .or(`user_id.eq.${user.id},respondent_email.eq.${userEmail}`)
            .eq('survey_type', 'pre')
            .maybeSingle();
          if (pre) setPreSurveyCompleted(true);

          // Check Quiz
          const { data: quiz } = await supabase
            .from('quiz_attempts')
            .select('score, passed')
            .eq('user_id', user.id)
            .eq('passed', true)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (quiz) {
            setQuizPassed(true);
            setQuizScore(quiz.score);
          }

          // Check Post-Survey (by user_id or email synced from Google Sheets)
          const { data: post } = await supabase
            .from('surveys')
            .select('id')
            .or(`user_id.eq.${user.id},respondent_email.eq.${userEmail}`)
            .eq('survey_type', 'post')
            .maybeSingle();
          if (post) setPostSurveyCompleted(true);

          // Check Certificate
          const { data: cert } = await supabase
            .from('certificates')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          if (cert || (pre && quiz && post)) {
            setCertificateReady(true);
          }
        }
      } catch (err) {
        // Suppress placeholder supabase url errors during development
      } finally {
        setLoading(false);
      }
    }
    loadData();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view_as') === 'student' || localStorage.getItem('aib_simulation_mode') === 'student') {
        setIsSimulating(true);
        localStorage.setItem('aib_simulation_mode', 'student');
      }
      if (params.get('access_denied') === 'restricted_dashboard') {
        setAccessRestricted(true);
      }
    }
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Simulation Banner (Pro Feature) */}
      {isSimulating && (
        <div className="bg-amber-400 text-slate-950 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-medium text-xs shadow-md border border-amber-500 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Eye className="w-5 h-5 text-slate-950 flex-shrink-0" />
            <div>
              <p className="font-bold">Admin Simulation Mode Active</p>
              <p className="text-[11px] text-slate-800">
                You are previewing this portal as a Student (Beneficiary View). Real Role: {profile?.role?.toUpperCase() || 'ADMIN'}.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('aib_simulation_mode');
              window.location.href = '/dashboard';
            }}
            className="px-3.5 py-1.5 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            Exit Simulation & Return to Dashboard →
          </button>
        </div>
      )}

      {/* Access Restricted Alert (Zero-Tolerance Security Guard) */}
      {accessRestricted && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs flex items-start gap-3 animate-fade-in">
          <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Access Restricted: Leadership & Ambassador Console</p>
            <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
              The Management Console (/dashboard) is restricted strictly to FMS SDG Ambassadors and Administrators. You have been redirected to your personal Student Certification Workspace.
            </p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full">
              Student & Educator Workspace
            </span>
            <span className="text-xs text-slate-500">• IIUI FMS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {profile?.full_name ? `Welcome, ${profile.full_name}` : 'Participant Certification Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete the 3-step evaluation lifecycle to unlock and download your official verified certificate.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1">
          <div className="text-slate-500">Account Identity:</div>
          <div className="font-semibold text-slate-800">{user?.email || 'Guest Mode (Demo)'}</div>
          <div className="text-[11px] text-emerald-700 font-medium">
            Role: {profile?.role?.toUpperCase() || 'STUDENT / PARTICIPANT'}
          </div>
        </div>
      </div>

      {/* Progress Stepper Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900">Your Certification Progress</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 1 Card */}
          <div className={`p-5 rounded-2xl border transition-all ${
            preSurveyCompleted 
              ? 'bg-emerald-50/60 border-emerald-300' 
              : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Step 1
              </span>
              {preSurveyCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300" />
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Pre-Training Assessment Survey</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Assessment of study & teaching bottlenecks, text volume, and baseline AI literacy before training.
            </p>
            <div className="pt-3 border-t border-slate-100">
              {preSurveyCompleted ? (
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSurveyType('pre');
                    setSurveyModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                >
                  Complete Pre-Training Survey →
                </button>
              )}
            </div>
          </div>

          {/* Step 2 Card */}
          <div className={`p-5 rounded-2xl border transition-all ${
            quizPassed 
              ? 'bg-emerald-50/60 border-emerald-300' 
              : preSurveyCompleted
              ? 'bg-amber-50/40 border-amber-300'
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Step 2
              </span>
              {quizPassed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : preSurveyCompleted ? (
                <Circle className="w-5 h-5 text-amber-500" />
              ) : (
                <Lock className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">30-MCQ Course Exam</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Dynamic evaluation drawn from the 50-MCQ pool (70% passing threshold).
            </p>
            <div className="pt-3 border-t border-slate-100">
              {quizPassed ? (
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Passed ({quizScore || 24}/30)
                </span>
              ) : preSurveyCompleted ? (
                <Link
                  href="/portal/quiz"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950"
                >
                  Attempt 30-MCQ Quiz →
                </Link>
              ) : (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Locked (Finish Step 1)
                </span>
              )}
            </div>
          </div>

          {/* Step 3 Card */}
          <div className={`p-5 rounded-2xl border transition-all ${
            postSurveyCompleted 
              ? 'bg-emerald-50/60 border-emerald-300' 
              : quizPassed
              ? 'bg-teal-50/40 border-teal-300'
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Step 3
              </span>
              {postSurveyCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : quizPassed ? (
                <Circle className="w-5 h-5 text-teal-500" />
              ) : (
                <Lock className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Post-Training Assessment Survey</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Efficiency gains reporting (hours saved/week) and workshop evaluation after training.
            </p>
            <div className="pt-3 border-t border-slate-100">
              {postSurveyCompleted ? (
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                </span>
              ) : quizPassed ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSurveyType('post');
                    setSurveyModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-950 cursor-pointer"
                >
                  Submit Post-Training Survey →
                </button>
              ) : (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Locked (Pass Step 2)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Official Certificate Download Card */}
      <div className={`rounded-3xl p-8 border transition-all ${
        certificateReady
          ? 'bg-gradient-to-br from-emerald-900 to-teal-950 text-white border-emerald-700 shadow-xl'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-slate-900">
              <Award className="w-3.5 h-3.5" />
              <span>Official Verification Certificate</span>
            </div>
            <h2 className={`text-2xl font-extrabold ${certificateReady ? 'text-white' : 'text-slate-900'}`}>
              {certificateReady ? 'Your Certificate is Ready for Download!' : 'Certificate Locked'}
            </h2>
            <p className={`text-xs sm:text-sm leading-relaxed ${certificateReady ? 'text-emerald-100' : 'text-slate-500'}`}>
              {certificateReady
                ? 'Congratulations! You have fulfilled all 3 requirements. Your certificate contains an embedded QR code linking to the public IIUI verification registry.'
                : 'To unlock your certificate, you must complete the Pre-Survey, achieve at least 70% on the 30-MCQ Course Assessment, and complete the Post-Survey.'}
            </p>
          </div>

          <div>
            {certificateReady ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/verify/AIB-2025-0001"
                  className="px-5 py-3 rounded-xl font-bold text-xs bg-white text-emerald-950 hover:bg-emerald-50 shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Verify Status</span>
                </a>
                <button
                  onClick={() => alert('Certificate PDF generator will render your credential with QR code in Phase 3!')}
                  className="px-6 py-3 rounded-xl font-bold text-xs bg-amber-400 text-slate-900 hover:bg-amber-300 shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Certificate</span>
                </button>
              </div>
            ) : (
              <div className="px-5 py-3 rounded-xl bg-slate-100 text-slate-500 font-semibold text-xs flex items-center gap-2 border border-slate-200">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Locked until all 3 steps complete</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Survey Role Selection Modal (Student vs Teacher) */}
      <SurveySelectionModal
        isOpen={surveyModalOpen}
        onClose={() => setSurveyModalOpen(false)}
        surveyType={activeSurveyType}
        userEmail={user?.email}
      />
    </div>
  );
}
