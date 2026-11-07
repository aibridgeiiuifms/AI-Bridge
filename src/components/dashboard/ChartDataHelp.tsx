'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { SURVEY_CHART_SOURCES } from '@/lib/surveyChartSources';

const ChartDataHelpContext = createContext(false);

export function ChartDataHelpProvider({
  canView,
  children,
}: {
  canView: boolean;
  children: React.ReactNode;
}) {
  return (
    <ChartDataHelpContext.Provider value={canView}>
      {children}
    </ChartDataHelpContext.Provider>
  );
}

export function ChartDataHelpButton({ sourceId }: { sourceId: string }) {
  const canView = useContext(ChartDataHelpContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const source = SURVEY_CHART_SOURCES[sourceId];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!canView) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`View data source for ${source?.title || 'this chart'}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="View survey questions and chart methodology"
        className="no-export inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer"
      >
        <span className="text-sm font-black leading-none">?</span>
      </button>

      {isMounted && isOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`chart-source-title-${sourceId}`}
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                  Chart data source
                </p>
                <h2
                  id={`chart-source-title-${sourceId}`}
                  className="mt-1 text-lg font-black text-slate-900"
                >
                  {source?.title || 'Source details unavailable'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close source details"
                autoFocus
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {source ? (
              <div className="mt-5 space-y-5 text-sm">
                {source.interpretation && (
                  <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-black">
                        ✓
                      </span>
                      <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                        How to Interpret / What This Chart Is Saying
                      </h3>
                    </div>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-800 font-medium">
                      {source.interpretation}
                    </p>
                  </section>
                )}
                <section>
                  <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Survey / data source
                  </h3>
                  <p className="mt-1.5 leading-relaxed text-slate-800">{source.source}</p>
                </section>

                <section>
                  <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Question(s) used
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {source.questions.map((question) => (
                      <li
                        key={question}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3 leading-relaxed text-slate-800"
                      >
                        {question}
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">
                    How it is calculated
                  </h3>
                  <p className="mt-1.5 leading-relaxed text-slate-800">{source.calculation}</p>
                </section>

                {source.limitations && (
                  <section className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <h3 className="text-xs font-black uppercase tracking-wide text-amber-900">
                      Important note
                    </h3>
                    <p className="mt-1.5 leading-relaxed text-amber-950">{source.limitations}</p>
                  </section>
                )}
              </div>
            ) : (
              <p className="mt-5 text-sm text-rose-700">
                Source details have not been configured for this chart.
              </p>
            )}
          </section>
        </div>,
        document.body
      )}
    </>
  );
}
