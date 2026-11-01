'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckSquare, Square, Save, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { ANALYTICS_V2_CHARTS, CATEGORIES, AnalyticsV2ChartDef } from '@/lib/surveyAnalyticsV2Catalog';

interface MemberChartPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MemberChartPermissionsModal({
  isOpen,
  onClose,
}: MemberChartPermissionsModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMembersAndPerms();
    }
  }, [isOpen]);

  const fetchMembersAndPerms = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/chart-permissions');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load permissions');

      setMembers(data.members || []);
      if (data.members && data.members.length > 0) {
        const first = data.members[0];
        setSelectedMemberId(first.id);
        setPermissions(first.permissions || {});
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    const m = members.find(item => item.id === memberId);
    setPermissions(m?.permissions || {});
    setStatusMessage(null);
  };

  const toggleChart = (chartId: string) => {
    setPermissions(prev => ({
      ...prev,
      [chartId]: prev[chartId] !== undefined ? !prev[chartId] : false,
    }));
  };

  const toggleCategory = (category: string, selectAll: boolean) => {
    const categoryCharts = ANALYTICS_V2_CHARTS.filter(c => c.category === category);
    setPermissions(prev => {
      const next = { ...prev };
      categoryCharts.forEach(c => {
        next[c.id] = selectAll;
      });
      return next;
    });
  };

  const selectAllAll = (selectAll: boolean) => {
    setPermissions(prev => {
      const next = { ...prev };
      ANALYTICS_V2_CHARTS.forEach(c => {
        next[c.id] = selectAll;
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedMemberId) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/chart-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: selectedMemberId,
          permissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setStatusMessage({ type: 'success', text: 'Granular chart permissions saved successfully!' });

      // Update local members state
      setMembers(prev =>
        prev.map(m => (m.id === selectedMemberId ? { ...m, permissions } : m))
      );
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentMember = members.find(m => m.id === selectedMemberId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Granular Member Chart Permissions
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Select which specific charts each team member is authorized to view.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Member Selector Bar */}
        <div className="p-4 sm:px-6 bg-indigo-50/60 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Select Member:</span>
            <select
              value={selectedMemberId}
              onChange={e => handleSelectMember(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.email} ({m.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => selectAllAll(true)}
              className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-xs cursor-pointer"
            >
              Grant All 34 Charts
            </button>
            <button
              onClick={() => selectAllAll(false)}
              className="text-[11px] font-bold text-slate-600 hover:text-rose-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs cursor-pointer"
            >
              Revoke All
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-bold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Body Content - Scrollable Categories */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="text-xs font-bold">Loading member permissions...</p>
            </div>
          ) : (
            CATEGORIES.map(cat => {
              const categoryCharts = ANALYTICS_V2_CHARTS.filter(c => c.category === cat.id);
              const allowedCount = categoryCharts.filter(c => permissions[c.id] !== false).length;

              return (
                <div key={cat.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">{cat.title}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 font-bold text-slate-700">
                        {allowedCount} / {categoryCharts.length} Allowed
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleCategory(cat.id, true)}
                        className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        Allow All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() => toggleCategory(cat.id, false)}
                        className="text-[11px] font-bold text-slate-500 hover:text-rose-600 cursor-pointer"
                      >
                        Hide All
                      </button>
                    </div>
                  </div>

                  {/* Grid of Checkboxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {categoryCharts.map(chart => {
                      const isAllowed = permissions[chart.id] !== false;
                      return (
                        <div
                          key={chart.id}
                          onClick={() => toggleChart(chart.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isAllowed
                              ? 'bg-white border-indigo-200 shadow-xs'
                              : 'bg-slate-100/60 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0 text-indigo-600">
                            {isAllowed ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-extrabold text-slate-900 leading-tight">
                              {chart.title}
                            </p>
                            <p className="text-[10px] text-slate-500 line-clamp-1">
                              {chart.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Editing permissions for: <strong className="text-slate-800">{currentMember?.full_name || currentMember?.email}</strong>
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Permissions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
