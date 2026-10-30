'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Smartphone } from 'lucide-react';
import SdgLoading from '@/components/SdgLoading';
import { useMobileNavigationMode, type MobileNavigationMode } from '@/components/MobileNavigationModeProvider';

export default function MobileDisplaySettingsPanel() {
  const { mode, ready: siteModeReady, loadError, setMode } = useMobileNavigationMode();
  const [selectedMode, setSelectedMode] = useState<MobileNavigationMode>(mode);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (siteModeReady) {
      setSelectedMode(mode);
      setLoading(false);
    }
  }, [mode, siteModeReady]);

  const saveMode = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/admin/site-navigation-mode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: selectedMode }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || result.mobile !== selectedMode) {
        throw new Error(result.error || 'Could not save this setting.');
      }

      setMode(selectedMode);
      setFeedback({
        type: 'success',
        text: selectedMode === 'continuous'
          ? 'Continuous scrolling is now enabled for mobile visitors.'
          : 'Separate pages are now enabled for mobile visitors.',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not save this setting.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-5 animate-fade-in">
      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
            <Smartphone className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Mobile Website Display</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
              Choose how the main website pages appear on phones. This setting does not change the desktop layout.
            </p>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-32 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-6">
          <SdgLoading size={28} label="Loading mobile display setting" />
          <span className="text-sm font-semibold text-slate-600">Loading current setting…</span>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          {loadError && (
            <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-900">
              {loadError}
            </p>
          )}
          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-bold text-slate-800">Choose mobile navigation</legend>
            <label className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${selectedMode === 'continuous' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}>
              <input
                type="radio"
                name="mobile-navigation-mode"
                value="continuous"
                checked={selectedMode === 'continuous'}
                onChange={() => setSelectedMode('continuous')}
                className="mt-1 h-4 w-4 accent-emerald-700"
              />
              <span>
                <span className="block text-sm font-bold text-slate-900">Continuous scrolling</span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-600">
                  Home, Team, Gallery, and Portal appear one after another. Scrolling updates the active URL and bottom navigation.
                </span>
              </span>
            </label>

            <label className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${selectedMode === 'separate' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}>
              <input
                type="radio"
                name="mobile-navigation-mode"
                value="separate"
                checked={selectedMode === 'separate'}
                onChange={() => setSelectedMode('separate')}
                className="mt-1 h-4 w-4 accent-emerald-700"
              />
              <span>
                <span className="block text-sm font-bold text-slate-900">Separate pages</span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-600">
                  Each page opens independently. The same mobile bottom navigation remains available.
                </span>
              </span>
            </label>
          </fieldset>

          <button
            type="button"
            onClick={saveMode}
            disabled={saving || selectedMode === mode}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <SdgLoading size={18} label="Saving mobile display setting" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save mobile display'}
          </button>

          {feedback && (
            <p role="status" className={`mt-4 rounded-xl p-3 text-sm font-semibold ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
              {feedback.text}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
