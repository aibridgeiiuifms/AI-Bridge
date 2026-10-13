'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  GraduationCap, 
  BookOpen, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Info
} from 'lucide-react';

export interface SurveyConfig {
  type: 'pre' | 'post';
  title: string;
  subtitle: string;
  description: string;
  forms: {
    student: {
      roleTitle: string;
      roleSubtitle: string;
      description: string;
      url: string;
    };
    teacher: {
      roleTitle: string;
      roleSubtitle: string;
      description: string;
      url: string;
    };
  };
}

export const SURVEY_DATA: Record<'pre' | 'post', SurveyConfig> = {
  pre: {
    type: 'pre',
    title: 'Pre-Training Assessment Survey',
    subtitle: 'Baseline AI & Workflow Assessment',
    description: 'Please select your role (Student or Teacher) to launch your pre-training survey. Complete this prior to starting the training session.',
    forms: {
      student: {
        roleTitle: 'Student Assessment',
        roleSubtitle: 'Undergraduate, Graduate & Research Students',
        description: 'Measures your current study workflows, reading volumes, and baseline AI literacy.',
        url: 'https://forms.gle/YZNQSZXUKJVn5o1i7',
      },
      teacher: {
        roleTitle: 'Teacher / Educator Assessment',
        roleSubtitle: 'Professors, Lecturers & Teaching Faculty',
        description: 'Assesses instructional prep bottlenecks, syllabus translation, and teaching challenges.',
        url: 'https://forms.gle/RmHp9N6VuN88Xc279',
      },
    },
  },
  post: {
    type: 'post',
    title: 'Post-Training Assessment Survey',
    subtitle: 'Impact & Efficiency Evaluation',
    description: 'Please select your role (Student or Teacher) to launch your post-training evaluation survey. Required to verify training impact.',
    forms: {
      student: {
        roleTitle: 'Student Assessment',
        roleSubtitle: 'Undergraduate, Graduate & Research Students',
        description: 'Evaluates time saved per week, comprehension improvements, and feedback on study aids.',
        url: 'https://forms.gle/grZEaAsnbYjCsJg68',
      },
      teacher: {
        roleTitle: 'Teacher / Educator Assessment',
        roleSubtitle: 'Professors, Lecturers & Teaching Faculty',
        description: 'Evaluates weekly preparation hours saved, lesson planning gains, and curriculum impact.',
        url: 'https://forms.gle/BS42ao9pRR1JYfTM9',
      },
    },
  },
};

interface SurveySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyType: 'pre' | 'post';
  userEmail?: string | null;
}

export default function SurveySelectionModal({
  isOpen,
  onClose,
  surveyType,
  userEmail,
}: SurveySelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(null);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentSurvey = SURVEY_DATA[surveyType];

  const handleOpenForm = (role: 'student' | 'teacher') => {
    const targetUrl = currentSurvey.forms[role].url;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-700/60 text-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{surveyType === 'pre' ? 'Pre-Training Survey' : 'Post-Training Survey'}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {currentSurvey.title}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 leading-relaxed">
            {currentSurvey.description}
          </p>
        </div>

        {/* Modal Body: Selection Options */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Select Your Role to Open Form:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Student Card */}
            <div
              onClick={() => {
                setSelectedRole('student');
                handleOpenForm('student');
              }}
              className="group relative flex flex-col justify-between p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-600 transition-all cursor-pointer shadow-xs hover:shadow-md text-left"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Learners
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-emerald-800 transition-colors">
                  {currentSurvey.forms.student.roleTitle}
                </h3>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {currentSurvey.forms.student.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-900">
                <span className="flex items-center gap-1">Open Form <ExternalLink className="w-3.5 h-3.5" /></span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Teacher Card */}
            <div
              onClick={() => {
                setSelectedRole('teacher');
                handleOpenForm('teacher');
              }}
              className="group relative flex flex-col justify-between p-4 rounded-2xl border-2 border-teal-200 bg-teal-50/40 hover:bg-teal-50 hover:border-teal-600 transition-all cursor-pointer shadow-xs hover:shadow-md text-left"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="inline-block px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Faculty
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-teal-900 transition-colors">
                  {currentSurvey.forms.teacher.roleTitle}
                </h3>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {currentSurvey.forms.teacher.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-teal-100 flex items-center justify-between text-xs font-bold text-teal-700 group-hover:text-teal-900">
                <span className="flex items-center gap-1">Open Form <ExternalLink className="w-3.5 h-3.5" /></span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Sync Information / Note */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 sm:p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-800">
                Important: Submit with your registered email
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                When filling the Google Form, ensure you enter{' '}
                <span className="font-mono font-bold text-slate-700">
                  {userEmail || 'your registered account email'}
                </span>
                . Your responses will automatically sync to verify your portal progress.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50/80 border-t border-slate-100 px-5 py-3.5 sm:px-6 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            IIUI FMS • Hum Hain Pakistan SDG Campaign
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
