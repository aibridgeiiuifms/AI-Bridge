'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export type MobileNavigationMode = 'continuous' | 'separate';

interface MobileNavigationModeContextValue {
  mode: MobileNavigationMode;
  ready: boolean;
  loadError: string | null;
  refreshMode: () => Promise<void>;
  setMode: (mode: MobileNavigationMode) => void;
}

const MobileNavigationModeContext = createContext<MobileNavigationModeContextValue | null>(null);

export function MobileNavigationModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<MobileNavigationMode>('continuous');
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasLoadedSettingRef = useRef(false);

  const applyMode = useCallback((nextMode: MobileNavigationMode) => {
    hasLoadedSettingRef.current = true;
    setMode(nextMode);
    setLoadError(null);
  }, []);

  const refreshMode = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/site-navigation-mode', { cache: 'no-store' });
      const result: unknown = await response.json();
      if (!response.ok || typeof result !== 'object' || result === null || !('mobile' in result)) {
        const apiError = typeof result === 'object' && result !== null && 'error' in result
          ? result.error
          : null;
        throw new Error(typeof apiError === 'string' ? apiError : 'The mobile navigation setting response was invalid.');
      }

      const nextMode = result.mobile;
      if (nextMode !== 'continuous' && nextMode !== 'separate') {
        throw new Error('The server returned an unsupported mobile navigation mode.');
      }
      hasLoadedSettingRef.current = true;
      setMode(nextMode);
      setLoadError(null);
    } catch (error) {
      if (hasLoadedSettingRef.current) {
        console.error('Could not refresh mobile navigation mode; keeping the last saved mode:', error);
        setLoadError('Could not refresh the mobile display setting. The last saved mode remains active.');
      } else {
        console.error('Could not load mobile navigation mode; using continuous mode:', error);
        setLoadError('Could not load the mobile display setting. Continuous scrolling is being used.');
        setMode('continuous');
      }
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refreshMode();

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshMode();
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => document.removeEventListener('visibilitychange', refreshWhenVisible);
  }, [refreshMode]);

  return (
    <MobileNavigationModeContext.Provider value={{ mode, ready, loadError, refreshMode, setMode: applyMode }}>
      {children}
    </MobileNavigationModeContext.Provider>
  );
}

export function useMobileNavigationMode() {
  const context = useContext(MobileNavigationModeContext);
  if (!context) {
    throw new Error('useMobileNavigationMode must be used within MobileNavigationModeProvider.');
  }
  return context;
}
