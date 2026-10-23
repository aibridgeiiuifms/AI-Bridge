'use client';

import { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  BookOpen,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Info,
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
    description:
      'Please select your role (Student or Teacher) to launch your pre-training survey. Complete this prior to starting the training session.',
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
    description:
      'Please select your role (Student or Teacher) to launch your post-training evaluation survey. Required to verify training impact.',
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
  const [, setSelectedRole] = useState<'student' | 'teacher' | null>(null);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0F172A]/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E2DFD7] overflow-hidden transform transition-all animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Solid Emerald Header Ribbon */}
        <div className="bg-[#0F4C3A] text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#093528] text-[#EAD1A7] text-[10px] font-bold uppercase tracking-wider mb-2 border border-white/15">
            <Sparkles className="w-3 h-3 text-[#C88A2B]" />
            <span>{surveyType === 'pre' ? 'Pre-Training Survey' : 'Post-Training Survey'}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {currentSurvey.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
            {currentSurvey.description}
          </p>
        </div>

        {/* Modal Body: Selection Options */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            Select Your Role to Open Form:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Student Card */}
            <div
              onClick={() => {
                setSelectedRole('student');
                handleOpenForm('student');
              }}
              className="group relative flex flex-col justify-between p-4 rounded-2xl border-2 border-[#C3DCD2] bg-[#F8F7F4] hover:bg-[#E6F0EC] hover:border-[#0F4C3A] transition-all cursor-pointer shadow-xs hover:shadow-md text-left"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#0F4C3A] text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="inline-block px-2 py-0.5 rounded-full bg-[#E6F0EC] text-[#0F4C3A] text-[10px] font-bold uppercase tracking-wider mb-1 border border-[#C3DCD2]">
                  Learners
                </div>
                <h3 className="font-bold text-[#0F172A] text-sm sm:text-base group-hover:text-[#0F4C3A] transition-colors">
                  {currentSurvey.forms.student.roleTitle}
                </h3>
                <p className="text-[11px] text-[#334155] mt-1 leading-relaxed">
                  {currentSurvey.forms.student.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2DFD7] flex items-center justify-between text-xs font-bold text-[#0F4C3A]">
                <span className="flex items-center gap-1">
                  Open Form <ExternalLink className="w-3.5 h-3.5" />
                </span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Teacher Card */}
            <div
              onClick={() => {
                setSelectedRole('teacher');
                handleOpenForm('teacher');
              }}
              className="group relative flex flex-col justify-between p-4 rounded-2xl border-2 border-[#EAD1A7] bg-[#F8F7F4] hover:bg-[#FDF6EA] hover:border-[#C88A2B] transition-all cursor-pointer shadow-xs hover:shadow-md text-left"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#1E293B] text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="inline-block px-2 py-0.5 rounded-full bg-[#FDF6EA] text-[#B0761E] text-[10px] font-bold uppercase tracking-wider mb-1 border border-[#EAD1A7]">
                  Faculty
                </div>
                <h3 className="font-bold text-[#0F172A] text-sm sm:text-base group-hover:text-[#1E293B] transition-colors">
                  {currentSurvey.forms.teacher.roleTitle}
                </h3>
                <p className="text-[11px] text-[#334155] mt-1 leading-relaxed">
                  {currentSurvey.forms.teacher.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2DFD7] flex items-center justify-between text-xs font-bold text-[#B0761E]">
                <span className="flex items-center gap-1">
                  Open Form <ExternalLink className="w-3.5 h-3.5" />
                </span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Sync Information / Note */}
          <div className="bg-[#F8F7F4] border border-[#E2DFD7] rounded-2xl p-3 sm:p-3.5 text-xs text-[#334155] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#0F4C3A] flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-[#0F172A]">
                Important: Submit with your registered email
              </p>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                When filling the Google Form, ensure you enter{' '}
                <span className="font-mono font-bold text-[#0F172A]">
                  {userEmail || 'your registered account email'}
                </span>
                . Your responses will automatically sync to verify your portal progress.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F8F7F4] border-t border-[#E2DFD7] px-5 py-3.5 sm:px-6 flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#64748B]">
            IIUI FMS • Hum Hain Pakistan SDG Campaign
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-[#334155] hover:bg-[#E2DFD7] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
