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
  ShieldAlert,
  RefreshCw,
  Sparkles,
  Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SurveySelectionModal from '@/components/SurveySelectionModal';
import PortalSkeleton from '@/components/skeletons/PortalSkeleton';

function buildLinkedInCertUrl(certId: string, completionDate?: string): string {
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: 'The AI Bridge: Source-Grounded AI & NotebookLM Mastery',
    organizationName: 'International Islamic University, Islamabad',
    issueYear: '2026',
    issueMonth: '10',
    certUrl: `https://ai-bridge-iiui.vercel.app/verify/${certId}`,
    certId: certId,
  });

  if (completionDate) {
    const d = new Date(completionDate);
    if (!isNaN(d.getTime())) {
      params.set('issueYear', String(d.getFullYear()));
      params.set('issueMonth', String(d.getMonth() + 1));
    }
  }

  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

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
  const [certificate, setCertificate] = useState<any>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'png' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);

  // AI Typo Detection State
  const [surveySuggestion, setSurveySuggestion] = useState<any>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimToast, setClaimToast] = useState<string | null>(null);

  const handleClaimSurvey = async (surveyId: string, participantType: string) => {
    setIsClaiming(true);
    // Optimistic UI: Immediately mark completed and dismiss banner
    const prevPreSurveyState = preSurveyCompleted;
    const prevSuggestion = surveySuggestion;
    setPreSurveyCompleted(true);
    setSurveySuggestion(null);
    setClaimToast('🎉 Survey successfully linked to your account! Pre-Assessment is now marked complete.');

    try {
      const res = await fetch('/api/portal/link-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId, participantType })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSurveyModalOpen(false);
        await checkCertificationProgress();
      } else {
        // Revert optimistic update on failure
        setPreSurveyCompleted(prevPreSurveyState);
        setSurveySuggestion(prevSuggestion);
        setClaimToast(null);
        alert(data.error || 'Failed to link survey.');
      }
    } catch (err: any) {
      // Revert optimistic update on error
      setPreSurveyCompleted(prevPreSurveyState);
      setSurveySuggestion(prevSuggestion);
      setClaimToast(null);
      alert('Network error while linking survey: ' + err.message);
    } finally {
      setIsClaiming(false);
      setTimeout(() => setClaimToast(null), 6000);
    }
  };

  const handleDownloadCertificate = async (format: 'pdf' | 'png' = 'pdf') => {
    setDownloadingFormat(format);
    try {
      const res = await fetch(`/api/portal/certificate?format=${format}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to generate certificate.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'png' ? 'png' : 'pdf';
      a.download = `The_AI_Bridge_Certificate_${certificate?.certificate_id || 'Verified'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh certificate state if newly issued
      await checkCertificationProgress();

      // Celebratory confetti trigger
      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (err: any) {
      alert('Error downloading certificate: ' + err.message);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const checkCertificationProgress = async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    const supabase = createClient();
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

        const userEmail = (user.email || '').trim().toLowerCase();

        // 1. Check Pre-Survey (student_surveys -> teacher_surveys cross-table fallback -> legacy surveys)
        let hasPre = false;
        const { data: preStudent } = await supabase
          .from('student_surveys')
          .select('id, user_id')
          .or(`user_id.eq.${user.id},student_email.ilike.${userEmail},login_email.ilike.${userEmail}`)
          .eq('survey_type', 'pre')
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (preStudent) {
          hasPre = true;
          if (!preStudent.user_id && user.id) {
            await supabase.from('student_surveys').update({ user_id: user.id }).eq('id', preStudent.id);
          }
        } else {
          // Fallback: check answers JSONB for 'Student Email Address' field
          // Covers old rows where student_email column still holds a personal Gmail
          const { data: preByAnswers } = await supabase
            .from('student_surveys')
            .select('id, user_id')
            .filter('answers->>Student Email Address', 'ilike', userEmail)
            .eq('survey_type', 'pre')
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (preByAnswers) {
            hasPre = true;
            // Opportunistically fix user_id and student_email for this row
            if (user.id) {
              await supabase.from('student_surveys')
                .update({ user_id: user.id, student_email: userEmail })
                .eq('id', preByAnswers.id);
            }
          } else {
            // Cross-table check in case user submitted teacher form
            const { data: preTeacher } = await supabase
              .from('teacher_surveys')
              .select('id, user_id')
              .or(`user_id.eq.${user.id},teacher_email.ilike.${userEmail},login_email.ilike.${userEmail}`)
              .eq('survey_type', 'pre')
              .order('submitted_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (preTeacher) {
              hasPre = true;
              if (!preTeacher.user_id && user.id) {
                await supabase.from('teacher_surveys').update({ user_id: user.id }).eq('id', preTeacher.id);
              }
            }
          }
        }

        if (hasPre) {
          setPreSurveyCompleted(true);
          setSurveySuggestion(null);
        } else {
          setPreSurveyCompleted(false);
          // Check for AI 80%+ similarity match on unlinked submissions
          try {
            const sugRes = await fetch('/api/portal/survey-suggestions?survey_type=pre');
            const sugData = await sugRes.json();
            if (sugData?.hasSuggestion && sugData.suggestion) {
              setSurveySuggestion(sugData.suggestion);
            } else {
              setSurveySuggestion(null);
            }
          } catch (e) {
            setSurveySuggestion(null);
          }
        }

        // 2. Check Quiz
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

        // 3. Check Post-Survey (student_surveys -> teacher_surveys -> legacy surveys)
        let hasPost = false;
        const { data: postStudent } = await supabase
          .from('student_surveys')
          .select('id, user_id')
          .or(`user_id.eq.${user.id},student_email.ilike.${userEmail},login_email.ilike.${userEmail}`)
          .eq('survey_type', 'post')
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (postStudent) {
          hasPost = true;
          if (!postStudent.user_id && user.id) {
            await supabase.from('student_surveys').update({ user_id: user.id }).eq('id', postStudent.id);
          }
        } else {
          // Fallback: check answers JSONB for 'Student Email Address' field
          const { data: postByAnswers } = await supabase
            .from('student_surveys')
            .select('id, user_id')
            .filter('answers->>Student Email Address', 'ilike', userEmail)
            .eq('survey_type', 'post')
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (postByAnswers) {
            hasPost = true;
            if (user.id) {
              await supabase.from('student_surveys')
                .update({ user_id: user.id, student_email: userEmail })
                .eq('id', postByAnswers.id);
            }
          } else {
            const { data: postTeacher } = await supabase
              .from('teacher_surveys')
              .select('id, user_id')
              .or(`user_id.eq.${user.id},teacher_email.ilike.${userEmail},login_email.ilike.${userEmail}`)
              .eq('survey_type', 'post')
              .order('submitted_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (postTeacher) {
              hasPost = true;
              if (!postTeacher.user_id && user.id) {
                await supabase.from('teacher_surveys').update({ user_id: user.id }).eq('id', postTeacher.id);
              }
            }
          }
        }
        if (hasPost) setPostSurveyCompleted(true);

        // 4. Check Certificate
        const { data: cert } = await supabase
          .from('certificates')
          .select('*')
          .eq('user_id', user.id)
          .order('issued_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (cert) {
          setCertificate(cert);
          setCertificateReady(true);
        } else if (hasPre && quiz && hasPost) {
          setCertificateReady(true);
        }

        if (showToast) {
          if (hasPre && quiz && hasPost) {
            setRefreshToast('🎉 All steps verified! Certificate is ready.');
          } else if (hasPre && quiz) {
            setRefreshToast('✅ Pre-Survey & Quiz verified! Please finish Post-Survey.');
          } else if (hasPre) {
            setRefreshToast('✅ Pre-Survey verified! Step 2 is unlocked.');
          } else {
            setRefreshToast('ℹ️ No pre-survey found yet for your account email.');
          }
          setTimeout(() => setRefreshToast(null), 4500);
        }
      }
    } catch (err) {
      // Suppress placeholder supabase url errors during development
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkCertificationProgress(false);

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

  if (loading) {
    return <PortalSkeleton />;
  }

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Certification Progress</h2>
            <p className="text-xs text-slate-500 mt-0.5">Automated synchronization with Google Forms and Supabase</p>
          </div>
          <button
            type="button"
            onClick={() => checkCertificationProgress(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-semibold text-slate-700 hover:text-emerald-800 transition-all cursor-pointer shadow-xs"
            title="Re-check if your Google Form submission has arrived"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span>{isRefreshing ? 'Checking Supabase...' : 'Check Status / Refresh'}</span>
          </button>
        </div>

        {refreshToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{refreshToast}</span>
          </div>
        )}

        {claimToast && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-semibold text-emerald-900 flex items-center gap-2.5 animate-fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{claimToast}</span>
          </div>
        )}

        {surveySuggestion && !preSurveyCompleted && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-5 shadow-xs transition-all">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200/60 text-amber-800">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    AI Match Detected ({surveySuggestion.similarity_percentage}% Match)
                  </h4>
                  <span className="rounded-full bg-amber-200/70 text-amber-900 px-2.5 py-0.5 text-[11px] font-bold">
                    Email Typo Identified
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">
                  We found a submitted pre-assessment survey under{' '}
                  <strong className="font-mono text-amber-900 bg-amber-200/50 px-1.5 py-0.5 rounded border border-amber-300">
                    {surveySuggestion.survey_email}
                  </strong>
                  {surveySuggestion.full_name ? <> (submitted as <em>&quot;{surveySuggestion.full_name}&quot;</em>)</> : null}. 
                  It closely matches your logged-in email (<strong>{user?.email}</strong>). 
                  If this is your submission, you can link it with one click to unlock Step 2.
                </p>
                <div className="mt-3.5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleClaimSurvey(surveySuggestion.id, surveySuggestion.participant_type)}
                    disabled={isClaiming}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 px-4 py-2 text-xs font-bold text-palette-haiti shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isClaiming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Yes, That&apos;s Me — Link My Survey
                  </button>
                  <button
                    type="button"
                    onClick={() => setSurveySuggestion(null)}
                    className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-amber-100/60 transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
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
                <div className="space-y-2">
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
                  {surveySuggestion && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>AI detected your survey with a slight typo above! Click <strong>&quot;Link My Survey&quot;</strong> to claim.</span>
                    </div>
                  )}
                  {/* UX-2: Email reminder tip for students who already submitted the form */}
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Already filled the survey?</strong> Make sure you logged in to this portal with the <strong>same email you entered in the form</strong>. The name displayed on your certificate will be the name registered with that email. For any name issues, contact admin:{' '}
                      <a href="mailto:ai.bridge.iiui.fms@gmail.com" className="underline font-semibold text-blue-700 hover:text-blue-900">ai.bridge.iiui.fms@gmail.com</a>
                    </span>
                  </div>
                </div>
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
            <h3 className="font-bold text-slate-900 text-sm mb-1">12-MCQ Course Assessment</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Dynamic evaluation drawn from the master question pool (75% passing threshold — 9/12 to pass).
            </p>
            <div className="pt-3 border-t border-slate-100">
              {quizPassed ? (
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Passed ({quizScore ?? 9}/12)
                </span>
              ) : preSurveyCompleted ? (
                <Link
                  href="/portal/quiz"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950"
                >
                  Attempt 12-MCQ Quiz →
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

      {/* Official Certificate Download Card (UI-2: Distinct styling for Ready to Generate vs Already Issued) */}
      <div className={`rounded-3xl p-8 border transition-all ${
        certificate?.certificate_id
          ? 'bg-gradient-to-br from-emerald-900 to-teal-950 text-white border-emerald-700 shadow-xl'
          : certificateReady
          ? 'bg-gradient-to-br from-amber-950 via-slate-900 to-amber-900 text-white border-amber-500/60 shadow-xl ring-1 ring-amber-400/30'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="space-y-3 max-w-xl">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              certificate?.certificate_id
                ? 'bg-emerald-400 text-slate-950'
                : certificateReady
                ? 'bg-amber-400 text-slate-950 animate-pulse'
                : 'bg-slate-100 text-slate-700'
            }`}>
              <Award className="w-3.5 h-3.5" />
              <span>
                {certificate?.certificate_id
                  ? 'Official Credential Issued'
                  : certificateReady
                  ? 'Steps Completed • Ready to Generate'
                  : 'Official Verification Certificate'}
              </span>
            </div>
            <h2 className={`text-2xl font-extrabold ${certificateReady ? 'text-white' : 'text-slate-900'}`}>
              {certificate?.certificate_id
                ? 'Your Official Certificate is Issued & Verified!'
                : certificateReady
                ? '🎉 Congratulations! Generate Your Official Certificate'
                : 'Certificate Locked'}
            </h2>
            <p className={`text-xs sm:text-sm leading-relaxed ${
              certificate?.certificate_id
                ? 'text-emerald-100'
                : certificateReady
                ? 'text-amber-100'
                : 'text-slate-500'
            }`}>
              {certificate?.certificate_id ? (
                <>
                  Your certificate has been formally registered with Serial:{' '}
                  <span className="font-mono font-bold text-amber-300 bg-black/30 px-1.5 py-0.5 rounded">
                    {certificate.certificate_id}
                  </span>
                  . Download your stamped PDF or view its live public registry entry.
                </>
              ) : certificateReady ? (
                'You have completed all 3 evaluation requirements! Click below to initialize your unique cryptographic serial number and download your stamped PDF certificate.'
              ) : (
                'To unlock your certificate, you must complete the Pre-Survey, achieve at least 75% on the 12-MCQ Course Assessment (9/12 to pass), and complete the Post-Survey.'
              )}
            </p>
          </div>

          <div className="w-full lg:w-auto flex justify-center">
            {certificateReady ? (
              <div className="flex flex-col items-center justify-center gap-2.5 w-full max-w-xs sm:max-w-sm">
                {/* 1. Verify Status (Centered) */}
                {certificate?.certificate_id ? (
                  <Link
                    href={`/verify/${certificate.certificate_id}`}
                    className="w-full px-5 py-2.5 rounded-xl font-bold text-xs bg-white text-emerald-950 hover:bg-emerald-50 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-200"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Verify Status</span>
                  </Link>
                ) : null}

                {/* 2. [Pdf Download] [Png Download] (Side by Side, Centered) */}
                <div className="flex items-center justify-center gap-2.5 w-full">
                  <button
                    onClick={() => handleDownloadCertificate('pdf')}
                    disabled={downloadingFormat !== null}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                      certificate?.certificate_id
                        ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                        : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                    }`}
                  >
                    {downloadingFormat === 'pdf' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>PDF Download</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDownloadCertificate('png')}
                    disabled={downloadingFormat !== null}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 bg-teal-300 text-slate-950 hover:bg-teal-200"
                  >
                    {downloadingFormat === 'png' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>PNG...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>PNG Download</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 3. Add to LinkedIn (Centered) */}
                {certificate?.certificate_id ? (
                  <a
                    href={buildLinkedInCertUrl(certificate.certificate_id, certificate.completion_date)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-5 py-2.5 rounded-xl font-bold text-xs bg-[#0a66c2] text-white hover:bg-[#004182] shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.54a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28Z" />
                    </svg>
                    <span>Add to LinkedIn</span>
                  </a>
                ) : null}
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
