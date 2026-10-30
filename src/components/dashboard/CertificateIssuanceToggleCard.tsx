'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Power, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Unlock, 
  Info,
  Calendar
} from 'lucide-react';
import SdgLoading from '@/components/SdgLoading';

export default function CertificateIssuanceToggleCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [issuanceEnabled, setIssuanceEnabled] = useState(true);
  const [closedMessage, setClosedMessage] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/certificate-toggle');
      const data = await res.json();
      if (data.success) {
        setIssuanceEnabled(data.issuance_enabled);
        setClosedMessage(data.closed_message || 'The evaluation and certification window for this phase has now closed. Thank you for your participation.');
        setUpdatedAt(data.updated_at);
        setUpdatedBy(data.updated_by || null);
      } else {
        setFeedback({ text: data.error || 'Failed to load toggle status', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ text: 'Error connecting to server: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggleState = async (newEnabled: boolean) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/certificate-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issuance_enabled: newEnabled,
          closed_message: closedMessage,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIssuanceEnabled(newEnabled);
        setFeedback({
          text: newEnabled
            ? '✅ Certificate issuance is now OPEN. Students can generate certificates.'
            : '⏸️ Certificate issuance is now PAUSED. New generation blocked; existing certs still work.',
          type: 'success',
        });
        await fetchStatus();
      } else {
        setFeedback({ text: data.error || 'Failed to update toggle', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ text: 'Error updating toggle: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMessageOnly = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/certificate-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issuance_enabled: issuanceEnabled,
          closed_message: closedMessage,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ text: '✅ Closed message updated successfully.', type: 'success' });
        await fetchStatus();
      } else {
        setFeedback({ text: data.error || 'Failed to save message', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ text: 'Error saving message: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${
            issuanceEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
          }`}>
            {issuanceEnabled ? (
              <Unlock className="w-6 h-6 text-emerald-700" />
            ) : (
              <Lock className="w-6 h-6 text-amber-700" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Certificate Issuance Master Switch
              </h2>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                issuanceEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}>
                {issuanceEnabled ? '● SYSTEM OPEN' : '⏸ SYSTEM PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly open or pause new certificate generation for all students across the platform.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStatus}
          disabled={loading || saving}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors self-start sm:self-auto cursor-pointer"
        >
          {loading ? <SdgLoading size={13} label="Checking" /> : <RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
          <span>Refresh</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Status & Action Box */}
      <div className={`rounded-2xl p-6 border-2 transition-all ${
        issuanceEnabled
          ? 'bg-emerald-50/50 border-emerald-200'
          : 'bg-amber-50/60 border-amber-300'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                issuanceEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`} />
              <h3 className="text-base font-extrabold text-slate-900">
                Current Status: {issuanceEnabled ? 'Issuance is Active' : 'Issuance is Paused'}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {issuanceEnabled ? (
                <>
                  Students who finish the 3 evaluation steps (Pre-Survey, Quiz &ge; 75%, Post-Survey) can generate and download their verified certificates in real-time.
                </>
              ) : (
                <>
                  New students are prevented from generating certificates and will see your polite notice on their portal. 
                  <strong className="text-amber-950 font-semibold ml-1">
                    All existing issued certificates continue to work normally (downloads, QR scans, and LinkedIn sharing remain active).
                  </strong>
                </>
              )}
            </p>
            {updatedAt && (
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Last updated: {new Date(updatedAt).toLocaleString()} {updatedBy ? `by ${updatedBy}` : ''}</span>
              </p>
            )}
          </div>

          {/* Toggle Action Button */}
          <div className="shrink-0">
            {issuanceEnabled ? (
              <button
                type="button"
                disabled={saving || loading}
                onClick={() => {
                  if (confirm('Are you sure you want to PAUSE certificate issuance? Students will not be able to generate new certificates until you turn it back on.')) {
                    handleToggleState(false);
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? <SdgLoading size={16} label="Updating" /> : <Power className="w-4 h-4" />}
                <span>Pause Certificate Issuance</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={saving || loading}
                onClick={() => handleToggleState(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? <SdgLoading size={16} label="Updating" /> : <Power className="w-4 h-4" />}
                <span>Open Certificate Issuance</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Closed Message Customizer */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Student Closed Message
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              This message appears in a polite banner on the student portal whenever issuance is paused.
            </p>
          </div>
        </div>

        <textarea
          rows={3}
          value={closedMessage}
          onChange={(e) => setClosedMessage(e.target.value)}
          placeholder="Enter the message students will see when certificate issuance is paused..."
          className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400">
            Default message is provided if left blank.
          </span>
          <button
            type="button"
            disabled={saving || loading}
            onClick={handleSaveMessageOnly}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <SdgLoading size={13} label="Saving" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Message</span>
          </button>
        </div>
      </div>

      {/* Protection & Behavior Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-emerald-950">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Already-Issued Certificates (Protected)</span>
          </div>
          <p className="text-[11px] text-emerald-900/80 leading-relaxed">
            Students who already received their certificate can continue downloading PDF/PNG, sharing to LinkedIn, and scanning QR codes without any interruption.
          </p>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <Lock className="w-4 h-4 text-amber-700" />
            <span>New Certificate Generation (Blocked)</span>
          </div>
          <p className="text-[11px] text-amber-900/80 leading-relaxed">
            When paused, students without a certificate cannot initiate generation. Both the frontend UI and database stored procedure securely reject new issuances.
          </p>
        </div>
      </div>
    </div>
  );
}
