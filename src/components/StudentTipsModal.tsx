'use client';

import React from 'react';
import { 
  X, 
  Info, 
  Clock, 
  RefreshCw, 
  Mail, 
  Award, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Phone
} from 'lucide-react';

interface StudentTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentTipsModal({ isOpen, onClose }: StudentTipsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 p-5 sm:p-6 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300 backdrop-blur-md">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Student Guide & FAQ
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Certification Tips & Important Instructions
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Tip 1: 5-Minute Quiz Cooldown */}
          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/70 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>1. 12-MCQ Quiz & 5-Minute Study Cooldown</span>
            </div>
            <p className="text-xs text-amber-950/80 leading-relaxed">
              The quiz requires a <strong>75% passing score (9/12)</strong>. If you do not pass on your first attempt, the system starts a <strong>5-minute study cooldown timer</strong>.
            </p>
            <div className="text-[11px] text-amber-900 bg-white/80 p-2.5 rounded-xl border border-amber-200/60 font-medium">
              💡 <strong>What to do:</strong> Take this time to review your workshop slides and notes. The retake button displays a live countdown and unlocks automatically once the timer reaches 00:00.
            </div>
          </div>

          {/* Tip 2: 30-Second Google Form Sync */}
          <div className="p-4 rounded-2xl border border-sky-200 bg-sky-50/70 space-y-2">
            <div className="flex items-center gap-2 text-sky-900 font-bold text-sm">
              <RefreshCw className="w-4 h-4 text-sky-600 shrink-0" />
              <span>2. Google Forms 30-Second Synchronization</span>
            </div>
            <p className="text-xs text-sky-950/80 leading-relaxed">
              When you submit a Pre-Survey or Post-Survey Google Form, Google Sheets transfers your responses to our database in <strong>10 to 30 seconds</strong>.
            </p>
            <div className="text-[11px] text-sky-900 bg-white/80 p-2.5 rounded-xl border border-sky-200/60 font-medium">
              ⚠️ <strong>Please do not submit the Google Form multiple times.</strong> Submitting repeatedly creates duplicate records. Simply return to the portal and wait 30 seconds or click <strong>&quot;Check Status / Refresh&quot;</strong>.
            </div>
          </div>

          {/* Tip 3: Email & Browser Google Account Matching */}
          <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
              <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>3. Browser Google Account & Email Matching</span>
            </div>
            <p className="text-xs text-indigo-950/80 leading-relaxed">
              When opening Google Forms, verify which Google account is active in your browser. Ensure the email entered matches your university email or your portal login account.
            </p>
            <div className="text-[11px] text-indigo-900 bg-white/80 p-2.5 rounded-xl border border-indigo-200/60 font-medium">
              ✨ <strong>Typo detection:</strong> If your survey email had a minor typo, the portal will display an <strong>&quot;AI Suggestion / Link My Survey&quot;</strong> banner on Step 1 to let you claim it in one click.
            </div>
          </div>

          {/* Tip 4: Name on Official Certificate */}
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <Award className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>4. Name & Details on Your Certificate</span>
            </div>
            <p className="text-xs text-emerald-950/80 leading-relaxed">
              Your official certificate stamps your name exactly as registered in your Google Profile and survey submission.
            </p>
            <div className="text-[11px] text-emerald-950 bg-white/90 p-3.5 rounded-xl border border-emerald-200/80 font-medium space-y-2.5">
              <p className="leading-relaxed">
                ⚡ <strong>Instant 1-Time Self-Correction:</strong> You can directly correct typos or update to your full formal degree name by clicking the <strong>&quot;Correct Name (1-Time Only)&quot;</strong> button on your Certificate Card below.
              </p>
              <p className="leading-relaxed text-slate-600">
                📝 <strong>Need further corrections or already used your 1-time edit?</strong> Email or WhatsApp admin:
              </p>
              <div className="flex flex-col sm:flex-row gap-2 text-xs">
                <a 
                  href="mailto:ai.bridge.iiui.fms@gmail.com" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ai.bridge.iiui.fms@gmail.com</span>
                </a>
                <a
                  href="https://wa.me/923205722442"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>WhatsApp: 0320-5722442</span>
                </a>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200/60 text-emerald-900 space-y-1">
                <span className="font-bold block text-[11px]">When contacting, please send:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1 font-mono text-emerald-800">
                  <li>Your Certificate ID</li>
                  <li>Old name (currently on certificate)</li>
                  <li>Name to be updated (correct full formal name)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Got it, Back to Portal
          </button>
        </div>
      </div>
    </div>
  );
}
