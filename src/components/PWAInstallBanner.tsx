'use client';

import { useEffect, useState } from 'react';
import { Download, X, Sparkles } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    if (sessionStorage.getItem('pwa_banner_dismissed') === 'true') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!isVisible || !deferredPrompt) return null;

  return (
    <aside
      aria-label="Install App"
      className="fixed bottom-20 lg:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-fade-in"
    >
      <div className="bg-[#0F4C3A] text-white rounded-2xl p-4 shadow-2xl border border-[#C3DCD2]/40 flex items-center justify-between gap-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#093528] border border-white/15 flex items-center justify-center flex-shrink-0 text-[#EAD1A7]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white tracking-tight truncate">
              Install The AI Bridge App
            </h4>
            <p className="text-[11px] text-slate-200 leading-tight mt-0.5 truncate">
              Instant offline access &amp; faster experience
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#0F4C3A] font-extrabold text-xs shadow-md hover:bg-[#F8F7F4] active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#0F4C3A]" />
            <span>Install</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install banner"
            className="p-1 rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
