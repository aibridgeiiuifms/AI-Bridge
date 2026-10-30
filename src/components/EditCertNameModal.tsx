'use client';

import { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  ShieldAlert, 
  UserCheck, 
  Info,
  Lock,
  Sparkles
} from 'lucide-react';
import SdgLoading from '@/components/SdgLoading';
import { formatCertificateName } from '@/lib/certificate/name-formatter';

interface EditCertNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  certificateId: string;
  onSuccess: (updatedCert: any) => void;
}

export default function EditCertNameModal({
  isOpen,
  onClose,
  currentName,
  certificateId,
  onSuccess,
}: EditCertNameModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [newName, setNewName] = useState(currentName || '');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const formattedPreview = formatCertificateName(newName.trim());
  const isIdentical = formattedPreview.toLowerCase() === (currentName || '').trim().toLowerCase();

  const handleProceedToStep2 = () => {
    setErrorMsg(null);
    const trimmed = newName.trim();
    if (!trimmed || trimmed.length < 2) {
      setErrorMsg('Please enter your full official name (at least 2 characters).');
      return;
    }
    if (trimmed.length > 80) {
      setErrorMsg('Name is too long (maximum 80 characters).');
      return;
    }
    const nameRegex = /^[a-zA-Z\s\.\-']+$/;
    if (!nameRegex.test(trimmed)) {
      setErrorMsg('Official name can only contain letters, spaces, dots, hyphens, and apostrophes. Numbers are not allowed.');
      return;
    }
    if (isIdentical) {
      setErrorMsg('The entered name is identical to the current certificate name. Please enter your corrected name.');
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/portal/update-cert-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newName: newName.trim(),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to update certificate name.');
        setIsSubmitting(false);
        return;
      }

      onSuccess(data.certificate);
      handleClose();
    } catch (err: any) {
      setErrorMsg('Network error: ' + (err.message || 'Please check your connection.'));
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while in-flight
    setStep(1);
    setNewName(currentName || '');
    setReason('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        // In step 2 or while submitting, clicking outside will NOT close the modal
        if (step === 1 && !isSubmitting && e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[88vh] overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Modal Header */}
        <div className={`shrink-0 p-4 sm:p-5 border-b transition-colors ${
          step === 2 
            ? 'bg-rose-50 border-rose-200 text-rose-950' 
            : 'bg-slate-50 border-slate-100 text-slate-900'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {step === 2 ? (
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <UserCheck className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                  {step === 1 ? 'Correct Certificate Recipient Name' : 'Strict Confirmation — 1-Time Only'}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                  {step === 1 
                    ? `Certificate ID: ${certificateId}` 
                    : 'This action is permanent and cannot be undone'}
                </p>
              </div>
            </div>

            {/* Close button only available on step 1 or when not submitting */}
            {!isSubmitting && (
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Modal Body (Smooth scrolling with keyboard open) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800 flex items-start gap-2.5 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Enter New Name & Reason */
            <div className="space-y-4">
              {/* Current Name Readout */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Current Name on Certificate:
                </span>
                <p className="text-sm sm:text-base font-extrabold text-slate-900 font-serif break-words">
                  {currentName || 'Not Set'}
                </p>
              </div>

              {/* New Name Input (16px on mobile stops iOS Safari auto-zoom) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Official Formal Name <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {newName.trim().length}/80
                  </span>
                </div>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Syeda Sehar Waheed Bukhari"
                  maxLength={80}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-base sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-xs"
                />
                <p className="text-[11px] text-slate-500 leading-normal">
                  Enter your full formal name as you want it permanently printed on your official degree credential. Letters, dots, and hyphens only.
                </p>
              </div>

              {/* Live Formatted Preview Badge */}
              {newName.trim() && (
                <div className="p-3 bg-emerald-50/90 border border-emerald-300/80 rounded-xl flex items-center justify-between gap-2 animate-fade-in text-xs shadow-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-800 font-medium shrink-0">Printed as:</span>
                    <span className="font-bold text-emerald-950 font-serif break-words">
                      &ldquo;{formattedPreview}&rdquo;
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-full shrink-0">
                    Preview
                  </span>
                </div>
              )}

              {/* Reason Input (Optional) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Reason for Correction <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Added surname, fixed spelling typo, formal CNIC name"
                  maxLength={150}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-base sm:text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
                />
              </div>

              {/* Strict Notice Card */}
              <div className="p-3.5 sm:p-4 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Strict 1-Time Self-Correction Limit</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  You are allowed to change your certificate name <strong>only once</strong> through this portal. Once saved, your certificate is permanently locked, and all subsequent downloads will reflect this change.
                </p>
              </div>
            </div>
          ) : (
            /* STEP 2: Strict Irreversible Confirmation */
            <div className="space-y-4">
              {/* Comparison Preview Card (break-words so full name is visible) */}
              <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Verification Comparison:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-stretch">
                  <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Old Name (Replaced):</span>
                    <p className="text-sm font-semibold text-slate-500 line-through break-words font-serif mt-1">
                      {currentName}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border-2 border-emerald-500 shadow-xs">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> New Permanent Name:
                    </span>
                    <p className="text-sm sm:text-base font-extrabold text-emerald-950 break-words font-serif mt-1">
                      {formattedPreview}
                    </p>
                  </div>
                </div>

                {reason.trim() && (
                  <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                    <span className="font-semibold text-slate-700">Reason:</span> &ldquo;{reason.trim()}&rdquo;
                  </div>
                )}
              </div>

              {/* High-Alert Warning Banner */}
              <div className="p-3.5 sm:p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-bounce" />
                  <span>Are you 100% sure? This CANNOT be undone!</span>
                </div>
                <ul className="text-[11px] text-rose-900/90 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>Your official PDF & PNG certificates will permanently print <strong>&quot;{formattedPreview}&quot;</strong>.</li>
                  <li>The public verification registry will permanently display this new name.</li>
                  <li><strong>You will NEVER be able to edit this name again.</strong> An audit log will be archived for the administration.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Modal Footer (Pinned above the bottom nav & iOS home bar) */}
        <div className="shrink-0 bg-slate-50/95 backdrop-blur-md border-t border-slate-200/90 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {step === 1 ? (
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-all text-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToStep2}
                disabled={!newName.trim() || isIdentical}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <span>Review & Confirm</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Edit</span>
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <SdgLoading size={15} label="Updating certificate name" />
                    <span>Permanently Updating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Yes, Permanently Update My Name</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
