'use client';

import { useState, useEffect, useCallback } from 'react';
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
  ChevronRight,
  Check,
  X,
  FileText
} from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  category: string;
  difficulty: 'easy' | 'intermediate' | 'advanced';
}

interface QuestionReview {
  id: string;
  question_text: string;
  options: string[];
  user_selected_index: number | null;
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
  review: QuestionReview[];
}

export default function QuizPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preSurveyMissing, setPreSurveyMissing] = useState(false);

  // Questions and state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  
  // Timer and tracking
  const [startedAt, setStartedAt] = useState<string>('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Results
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [showReviewAccordion, setShowReviewAccordion] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPreSurveyMissing(false);
    setQuizResult(null);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setSecondsElapsed(0);

    try {
      const res = await fetch('/api/portal/quiz');
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'PRE_SURVEY_REQUIRED') {
          setPreSurveyMissing(true);
        } else {
          setError(data.error || 'Failed to load assessment questions.');
        }
        return;
      }

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setStartedAt(new Date().toISOString());
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

  // Elapsed Timer (runs while quiz is active and not submitted)
  useEffect(() => {
    if (loading || preSurveyMissing || quizResult || questions.length === 0) return;

    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, preSurveyMissing, quizResult, questions.length]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const isCurrentAnswered = currentQuestion && selectedAnswers[currentQuestion.id] !== undefined;

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmitAttempt = async () => {
    setSubmitting(true);
    setShowConfirmModal(false);

    try {
      const res = await fetch('/api/portal/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: selectedAnswers,
          started_at: startedAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to submit quiz. Please try again.');
        setSubmitting(false);
        return;
      }

      setQuizResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Preparing Your 12-MCQ Course Assessment...</h2>
        <p className="text-xs text-slate-500">Sampling 12 randomized questions from the master question pool.</p>
      </div>
    );
  }

  // 2. Pre-Survey Missing Error
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

  // 3. Generic Error
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
            onClick={fetchQuestions}
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

  // 4. Quiz Results View (Passed or Failed)
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
                onClick={fetchQuestions}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs bg-emerald-700 text-white hover:bg-emerald-800 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Assessment with 12 New Questions</span>
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
                        const isUserChoice = item.user_selected_index === optIdx;
                        const isCorrectChoice = item.correct_option_index === optIdx;

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

  // 5. Active Quiz Taking View
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 animate-fade-in">
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
              Source-grounded AI & NotebookLM comprehension exam. Answer at least 9 correctly to unlock your official verified certificate.
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
            {answeredCount === totalQuestions ? '✅ All questions answered' : `${totalQuestions - answeredCount} remaining`}
          </span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
          {questions.map((q, idx) => {
            const isAnswered = selectedAnswers[q.id] !== undefined;
            const isCurrent = idx === currentIndex;

            let pillStyle = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
            if (isAnswered) {
              pillStyle = 'bg-emerald-600 text-white font-bold shadow-xs';
            }
            if (isCurrent) {
              pillStyle += ' ring-2 ring-amber-400 ring-offset-2';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
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
              const isSelected = selectedAnswers[currentQuestion.id] === optIdx;

              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                  className={`group p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-600 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 transition-transform ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs scale-105'
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
                    isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
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
                <span>{submitting ? 'Evaluating...' : 'Submit Assessment'}</span>
                <CheckCircle2 className="w-4 h-4" />
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
                  <span className="block text-amber-700 font-semibold mt-1">
                    ⚠️ You have {totalQuestions - answeredCount} unanswered questions which will be marked incorrect.
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
                Continue Reviewing
              </button>

              <button
                type="button"
                onClick={handleSubmitAttempt}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
