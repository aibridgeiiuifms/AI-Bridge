'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Clock, 
  Sparkles, 
  Award, 
  RotateCcw, 
  Lock, 
  Check, 
  X, 
  FileText,
  BookmarkCheck,
  RefreshCw,
  Hourglass
} from 'lucide-react';
import { queueSubmission } from '@/lib/offline-sync';
import { trackEvent } from '@/lib/tracking/trackEvent';
import SdgLoading from '@/components/SdgLoading';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  category: string;
  difficulty: 'easy' | 'intermediate' | 'advanced';
}

interface QuestionAnswer {
  index: number;
  text: string;
}

interface QuestionReview {
  id: string;
  question_text: string;
  options: string[];
  user_selected_text: string | null;
  user_selected_index: number | null;
  correct_option_text: string;
  correct_option_index: number;
  is_correct: boolean;
  explanation: string | null;
  category: string;
}

interface QuizResult {
  score: number;
  total_questions: number;
  passing_score: number;
  percentage: number;
  passed: boolean;
  message: string;
  cooldown_duration_seconds?: number;
  review: QuestionReview[];
}

const LOCAL_STORAGE_KEY = 'aib_active_quiz_v2';

export default function QuizPage() {
  const router = useRouter();

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preSurveyMissing, setPreSurveyMissing] = useState(false);

  // Cooldown State (5 minutes)
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [cooldownMessage, setCooldownMessage] = useState<string>('');

  // Questions and Progress
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, QuestionAnswer>>({});
  
  // Timer and Tracking
  const [startedAt, setStartedAt] = useState<string>('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [restoredFromStorage, setRestoredFromStorage] = useState(false);

  // Results & Review
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [showReviewAccordion, setShowReviewAccordion] = useState(false);

  // Clear local storage helper
  const clearQuizStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (e) {
      // Ignore storage errors
    }
  };

  // Fetch Questions from API
  const fetchQuestions = useCallback(async (isFresh = false) => {
    setLoading(true);
    setError(null);
    setPreSurveyMissing(false);
    setQuizResult(null);
    setRestoredFromStorage(false);

    if (isFresh) {
      clearQuizStorage();
      setSelectedAnswers({});
      setCurrentIndex(0);
      setSecondsElapsed(0);
    }

    // 1. Check for valid saved active session in localStorage (if not explicitly fresh)
    if (!isFresh && typeof window !== 'undefined') {
      try {
        const savedRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedRaw) {
          const saved = JSON.parse(savedRaw);
          const savedTime = new Date(saved.startedAt || '').getTime();
          const ageMinutes = (Date.now() - savedTime) / (1000 * 60);

          // Restore session if under 90 minutes old and has valid questions
          if (ageMinutes < 90 && Array.isArray(saved.questions) && saved.questions.length === 12) {
            setQuestions(saved.questions);
            setSelectedAnswers(saved.selectedAnswers || {});
            setCurrentIndex(saved.currentIndex || 0);
            setSecondsElapsed(saved.secondsElapsed || 0);
            setStartedAt(saved.startedAt || new Date().toISOString());
            setRestoredFromStorage(true);
            setLoading(false);
            return;
          } else {
            clearQuizStorage();
          }
        }
      } catch (e) {
        clearQuizStorage();
      }
    }

    // 2. Fetch fresh balanced question set from backend
    try {
      const res = await fetch('/api/portal/quiz');
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 && data.error === 'COOLDOWN_ACTIVE') {
          setCooldownRemaining(data.cooldown_remaining_seconds || 300);
          setCooldownMessage(data.message || 'Assessment cooldown active.');
          setLoading(false);
          return;
        }

        if (data.error === 'ISSUANCE_CLOSED') {
          setError(data.message || 'Certificate issuance and evaluation is currently paused by administration.');
        } else if (data.error === 'PRE_SURVEY_REQUIRED') {
          setPreSurveyMissing(true);
        } else {
          setError(data.error || 'Failed to load assessment questions.');
        }
        return;
      }

      if (data.questions && data.questions.length > 0) {
        const newStartTime = new Date().toISOString();
        setQuestions(data.questions);
        setSelectedAnswers({});
        setCurrentIndex(0);
        setSecondsElapsed(0);
        setStartedAt(newStartTime);
        setCooldownRemaining(0);
        trackEvent('quiz_started', '/portal/quiz', {
          question_count: data.questions.length,
        });

        // Save fresh attempt to localStorage
        try {
          localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify({
              questions: data.questions,
              selectedAnswers: {},
              currentIndex: 0,
              secondsElapsed: 0,
              startedAt: newStartTime,
            })
          );
        } catch (e) {
          // Ignore storage quota errors
        }
      } else {
        setError('No active questions found in the question pool.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error loading quiz.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Active Elapsed Stopwatch
  useEffect(() => {
    if (loading || preSurveyMissing || quizResult || questions.length === 0 || cooldownRemaining > 0) return;

    const interval = setInterval(() => {
      setSecondsElapsed((prev) => {
        const next = prev + 1;
        // Periodic sync to localStorage
        if (next % 5 === 0 && typeof window !== 'undefined') {
          try {
            const current = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (current) {
              const parsed = JSON.parse(current);
              parsed.secondsElapsed = next;
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
            }
          } catch (e) {}
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, preSurveyMissing, quizResult, questions.length, cooldownRemaining]);

  // 5-Minute Cooldown Countdown Ticker
  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Format MM:SS helper
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Option Selection Handler (Stores both index and exact text)
  const handleSelectOption = (questionId: string, optionIndex: number, optionText: string) => {
    const updated = {
      ...selectedAnswers,
      [questionId]: {
        index: optionIndex,
        text: optionText,
      },
    };
    setSelectedAnswers(updated);

    // Save to localStorage immediately
    if (typeof window !== 'undefined') {
      try {
        const savedRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedRaw) {
          const parsed = JSON.parse(savedRaw);
          parsed.selectedAnswers = updated;
          parsed.currentIndex = currentIndex;
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch (e) {}
    }
  };

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length || 12;
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (typeof window !== 'undefined') {
        try {
          const savedRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (savedRaw) {
            const parsed = JSON.parse(savedRaw);
            parsed.currentIndex = nextIdx;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
          }
        } catch (e) {}
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      if (typeof window !== 'undefined') {
        try {
          const savedRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (savedRaw) {
            const parsed = JSON.parse(savedRaw);
            parsed.currentIndex = prevIdx;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
          }
        } catch (e) {}
      }
    }
  };

  // Submit Handler
  const handleSubmitAttempt = async () => {
    setSubmitting(true);
    setShowConfirmModal(false);
    // Build answers payload: send question IDs with their chosen option text
    const formattedAnswers: Record<string, { text: string; index: number }> = {};
    Object.entries(selectedAnswers).forEach(([qId, ans]) => {
      formattedAnswers[qId] = ans;
    });

    try {
      const res = await fetch('/api/portal/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawn_question_ids: questions.map((q) => q.id),
          answers: formattedAnswers,
          started_at: startedAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 && data.error === 'COOLDOWN_ACTIVE') {
          setCooldownRemaining(data.cooldown_remaining_seconds || 300);
          setCooldownMessage(data.message || 'Assessment cooldown active.');
          setSubmitting(false);
          return;
        }
        alert(data.error || 'Failed to submit quiz. Please try again.');
        setSubmitting(false);
        return;
      }

      // Submission successful: clear session storage
      clearQuizStorage();
      setQuizResult(data);
      trackEvent('quiz_completed', '/portal/quiz', {
        score: data.score,
        total_questions: data.total_questions,
        passed: data.passed,
        percentage: data.percentage,
      });

      // If failed, trigger the 5-minute cooldown timer
      if (!data.passed) {
        setCooldownRemaining(data.cooldown_duration_seconds || 300);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        queueSubmission('/api/portal/quiz', {
          drawn_question_ids: questions.map((q) => q.id),
          answers: formattedAnswers,
          started_at: startedAt,
        });
        alert('You are offline. Your quiz answers have been safely saved to your device and will submit automatically when connectivity is restored.');
      } else {
        alert(`Submission error: ${err.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Loading View
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <SdgLoading size={48} className="mx-auto" label="Preparing assessment" />
        <h2 className="text-lg font-bold text-slate-800">Preparing Your 12-MCQ Course Assessment...</h2>
        <p className="text-xs text-slate-500">
          Conducting balanced category sampling and generating randomized options.
        </p>
      </div>
    );
  }

  // 2. Cooldown Screen (5 minutes active)
  if (cooldownRemaining > 0 && !quizResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 animate-fade-in">
        <div className="bg-white border-2 border-amber-300 rounded-3xl p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <Hourglass className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              Assessment Retake Cooldown Active
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-3">Take a Short Study Break</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
              To ensure authentic learning and discourage guessing, there is a <strong>5-minute reflection period</strong> between attempts.
              Please review your workshop slides and study notes.
            </p>
          </div>

          {/* Large Countdown Ticker */}
          <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl max-w-xs mx-auto">
            <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
              Time Until Retake Unlocks
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-950 font-mono mt-1">
              {formatTimer(cooldownRemaining)}
            </div>
            <p className="text-[10px] text-amber-700 mt-1">Countdown updates automatically</p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/portal"
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Student Portal</span>
            </Link>

            <button
              disabled={cooldownRemaining > 0}
              onClick={() => fetchQuestions(true)}
              className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{cooldownRemaining > 0 ? 'Retake Locked' : 'Start Fresh Retake Now'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Pre-Survey Missing Error View
  if (preSurveyMissing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 animate-fade-in">
        <div className="bg-white border-2 border-amber-300 rounded-3xl p-8 shadow-lg text-center space-y-5">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
              Prerequisite Required
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-3">Step 1 Not Completed Yet</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
              You must submit the <strong>Pre-Training Assessment Survey (Step 1)</strong> before taking this quiz.
              Once your survey submission is verified, this exam will unlock automatically.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/portal"
              className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Student Portal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Generic Error View
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Unable to Start Assessment</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">{error}</p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => fetchQuestions(true)}
            className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            Retry Loading
          </button>
          <Link
            href="/portal"
            className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
          >
            Return to Portal
          </Link>
        </div>
      </div>
    );
  }

  // 5. Quiz Results View (Passed or Failed)
  if (quizResult) {
    const isPass = quizResult.passed;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
        {/* Results Hero Card */}
        <div className={`rounded-3xl p-8 sm:p-10 shadow-xl border text-center space-y-5 ${
          isPass 
            ? 'bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white border-emerald-700' 
            : 'bg-white text-slate-900 border-amber-300 shadow-md'
        }`}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Official Examination Result</span>
          </div>

          <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-lg ${
            isPass ? 'bg-amber-400 text-slate-950' : 'bg-rose-100 text-rose-600'
          }`}>
            {isPass ? <Award className="w-10 h-10" /> : <RotateCcw className="w-10 h-10" />}
          </div>

          <div>
            <h1 className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${isPass ? 'text-white' : 'text-slate-900'}`}>
              {isPass ? '🎉 Congratulations! You Passed!' : 'Assessment Not Passed'}
            </h1>
            <p className={`text-xs sm:text-sm mt-2 max-w-lg mx-auto leading-relaxed ${isPass ? 'text-emerald-100' : 'text-slate-600'}`}>
              {quizResult.message}
            </p>
          </div>

          {/* Big Score Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto pt-2">
            <div className={`p-4 rounded-2xl border ${isPass ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-[10px] uppercase font-bold text-slate-400">Your Score</div>
              <div className="text-xl sm:text-2xl font-extrabold mt-0.5">{quizResult.score} / {quizResult.total_questions}</div>
            </div>
            <div className={`p-4 rounded-2xl border ${isPass ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-[10px] uppercase font-bold text-slate-400">Percentage</div>
              <div className="text-xl sm:text-2xl font-extrabold mt-0.5">{quizResult.percentage}%</div>
            </div>
            <div className={`p-4 rounded-2xl border ${isPass ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-[10px] uppercase font-bold text-slate-400">Required Pass</div>
              <div className="text-xl sm:text-2xl font-extrabold mt-0.5">75% (9/12)</div>
            </div>
            <div className={`p-4 rounded-2xl border ${isPass ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-[10px] uppercase font-bold text-slate-400">Status</div>
              <div className={`text-sm sm:text-base font-extrabold mt-1 uppercase ${isPass ? 'text-emerald-300' : 'text-rose-600'}`}>
                {isPass ? 'VERIFIED' : 'RETAKE'}
              </div>
            </div>
          </div>

          {/* Cooldown notice if failed */}
          {!isPass && cooldownRemaining > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl max-w-md mx-auto text-xs text-amber-900 flex items-center justify-center gap-2">
              <Hourglass className="w-4 h-4 text-amber-700 animate-pulse" />
              <span>
                Retake cooldown: <strong>{formatTimer(cooldownRemaining)}</strong> remaining before next attempt.
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-3">
            {isPass ? (
              <Link
                href="/portal"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Return to Portal & Unlock Post-Survey (Step 3)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                disabled={cooldownRemaining > 0}
                onClick={() => fetchQuestions(true)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>
                  {cooldownRemaining > 0 
                    ? `Retake Available in ${formatTimer(cooldownRemaining)}` 
                    : 'Retake Assessment with 12 New Questions'}
                </span>
              </button>
            )}

            <button
              onClick={() => setShowReviewAccordion((prev) => !prev)}
              className={`w-full sm:w-auto px-5 py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isPass 
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{showReviewAccordion ? 'Hide Answer Review' : 'Review Questions & Explanations'}</span>
            </button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        {showReviewAccordion && quizResult.review && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Detailed Question-by-Question Review</span>
            </h2>

            <div className="space-y-4">
              {quizResult.review.map((item, idx) => {
                const isCorrect = item.is_correct;

                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                      isCorrect ? 'border-emerald-300' : 'border-rose-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Question {idx + 1} • {item.category}
                      </span>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                          <Check className="w-3.5 h-3.5" /> Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                          <X className="w-3.5 h-3.5" /> Incorrect
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.question_text}
                    </h3>

                    {/* Options list */}
                    <div className="mt-3 space-y-1.5">
                      {item.options.map((opt, optIdx) => {
                        const isCorrectChoice = opt.trim() === item.correct_option_text?.trim();
                        const isUserChoice = opt.trim() === item.user_selected_text?.trim();

                        let style = 'bg-slate-50 border-slate-200 text-slate-700';
                        if (isCorrectChoice) {
                          style = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                        } else if (isUserChoice && !isCorrect) {
                          style = 'bg-rose-50 border-rose-400 text-rose-900 font-medium';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${style}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-white/80 border text-[10px] font-extrabold flex items-center justify-center">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>
                            <div>
                              {isCorrectChoice && (
                                <span className="text-[10px] text-emerald-700 uppercase font-bold">
                                  Correct Answer
                                </span>
                              )}
                              {isUserChoice && !isCorrectChoice && (
                                <span className="text-[10px] text-rose-600 uppercase font-bold">
                                  Your Choice
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {item.explanation && (
                      <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-0.5">
                        <span className="font-bold text-slate-800">Academic Explanation:</span>
                        <p className="text-[11px] leading-relaxed">{item.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 6. Active Quiz Taking View
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 animate-fade-in">
      {/* Session Restored Notice */}
      {restoredFromStorage && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Your active assessment session was restored. Progress has been preserved!</span>
          </div>
          <button
            onClick={() => fetchQuestions(true)}
            className="text-[11px] font-bold text-blue-800 hover:text-blue-950 underline cursor-pointer whitespace-nowrap"
          >
            Start Fresh
          </button>
        </div>
      )}

      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <Link
          href="/portal"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Student Portal</span>
        </Link>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold shadow-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Time: {formatTimer(secondsElapsed)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pass Threshold: 9/12 (75%)</span>
          </div>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Step 2 Examination</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              12-MCQ Course Assessment
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1 leading-relaxed">
              Balanced evaluation across AI & NotebookLM Foundations, Educational Workflows, Prompt Engineering & AI Ethics, and Institutional Governance. Answer at least 9 correctly to unlock certification.
            </p>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-3 text-right">
            <div className="text-[10px] uppercase font-bold text-emerald-200">Progress</div>
            <div className="text-xl font-extrabold text-white mt-0.5">
              {answeredCount} / {totalQuestions}
            </div>
            <div className="text-[10px] text-emerald-200">Answered</div>
          </div>
        </div>
      </div>

      {/* Question Selector Pill Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-slate-600">
          <span>Question Navigator:</span>
          <span className="text-[11px] text-slate-400">
            {answeredCount === totalQuestions ? '✅ All 12 questions answered' : `${totalQuestions - answeredCount} remaining`}
          </span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
          {questions.map((q, idx) => {
            const isAnswered = selectedAnswers[q.id] !== undefined;
            const isCurrent = idx === currentIndex;

            let pillStyle = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
            if (isAnswered) {
              pillStyle = 'bg-emerald-600 text-palette-haiti font-bold shadow-xs';
            }
            if (isCurrent) {
              pillStyle += ' ring-2 ring-amber-400 ring-offset-2';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  if (typeof window !== 'undefined') {
                    try {
                      const savedRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
                      if (savedRaw) {
                        const parsed = JSON.parse(savedRaw);
                        parsed.currentIndex = idx;
                        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
                      }
                    } catch (e) {}
                  }
                }}
                className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${pillStyle}`}
                title={`Jump to Question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Question Card */}
      {currentQuestion && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Question Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                {currentQuestion.category}
              </span>
            </div>

            <span className="text-[11px] font-semibold text-slate-400 capitalize">
              Difficulty: {currentQuestion.difficulty}
            </span>
          </div>

          {/* Question Statement */}
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {currentQuestion.question_text}
          </h2>

          {/* 4 Choices */}
          <div className="space-y-3 pt-2">
            {currentQuestion.options.map((optionText, optIdx) => {
              const currentAnswer = selectedAnswers[currentQuestion.id];
              const isSelected = currentAnswer?.text === optionText;

              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(currentQuestion.id, optIdx, optionText)}
                  className={`group p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-600 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 transition-transform ${
                    isSelected
                      ? 'bg-emerald-600 text-palette-haiti shadow-xs scale-105'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}>
                    {String.fromCharCode(65 + optIdx)}
                  </div>

                  <span className={`text-xs sm:text-sm leading-relaxed flex-1 ${
                    isSelected ? 'font-bold text-emerald-950' : 'text-slate-800'
                  }`}>
                    {optionText}
                  </span>

                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-emerald-600 bg-emerald-600 text-palette-haiti' : 'border-slate-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation & Submission Controls */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {currentIndex < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <><SdgLoading size={14} label="Evaluating assessment" /> Evaluating...</>
                ) : (
                  <><span>Submit Assessment</span><CheckCircle2 className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Before Submission */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Confirm Assessment Submission</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                You have answered <strong>{answeredCount} of {totalQuestions} questions</strong>.
                {answeredCount < totalQuestions && (
                  <span className="block text-rose-700 font-semibold mt-1">
                    ⚠️ {totalQuestions - answeredCount} unanswered questions will be graded as 0 / incorrect.
                  </span>
                )}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Review Answers
              </button>

              <button
                type="button"
                onClick={handleSubmitAttempt}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                {submitting ? <><SdgLoading size={14} label="Submitting assessment" /> Submitting...</> : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
