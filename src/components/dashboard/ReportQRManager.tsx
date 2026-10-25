'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import SdgLoading from '@/components/SdgLoading';
import {
  QrCode,
  KeyRound,
  Download,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function ReportQRManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form states
  const [passwordDraft, setPasswordDraft] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [orgDraft, setOrgDraft] = useState('');
  const [sessionHours, setSessionHours] = useState(24);
  const [copiedLink, setCopiedLink] = useState(false);

  // Chart Permissions Draft
  const [permissionsDraft, setPermissionsDraft] = useState<Record<string, any>>({});

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviewer-access?mode=admin');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load reviewer settings');

      setData(json);
      setPasswordDraft(json.accessConfig?.password_plain || 'HHP-AIB-2026');
      setOrgDraft(json.accessConfig?.evaluator_organization || 'Hum Hain Pakistan National SDG Campaign Evaluators');
      setSessionHours(Number(json.accessConfig?.session_duration_hours || 24));
      setPermissionsDraft(json.chartPermissions || {});
    } catch (err: any) {
      console.error('Failed to load QR settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleCopyLink = () => {
    if (!data?.targetUrl) return;
    navigator.clipboard.writeText(data.targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadQrPng = () => {
    if (!data?.qrDataUrl) return;
    const link = document.createElement('a');
    link.download = 'AI-Bridge-Evaluation-Report-QR.png';
    link.href = data.qrDataUrl;
    link.click();
  };

  const handleDownloadQrSvg = () => {
    if (!data?.qrSvg) return;
    const blob = new Blob([data.qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'AI-Bridge-Evaluation-Report-QR.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/reviewer-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessConfig: {
            password_plain: passwordDraft.trim(),
            evaluator_organization: orgDraft.trim(),
            session_duration_hours: Number(sessionHours),
          },
          chartPermissions: permissionsDraft,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save');

      setFeedback('Settings and visibility permissions saved successfully!');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (chartKey: string, field: 'team_member_visible' | 'external_reviewer_visible') => {
    setPermissionsDraft((prev) => {
      const curr = prev[chartKey] || { team_member_visible: true, external_reviewer_visible: true };
      return {
        ...prev,
        [chartKey]: {
          ...curr,
          [field]: !curr[field],
        },
      };
    });
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3">
        <SdgLoading size={32} className="mx-auto" label="Loading Report QR and access settings" />
        <p className="text-xs text-slate-500 font-semibold">Loading Report QR & Access Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-slate-900">
      {/* Header Feedback */}
      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Top Split Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Panel 1: Printable Report QR Code (Col 5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                <QrCode className="w-4 h-4" />
                <span>Report QR Generator</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Print Ready
              </span>
            </div>
            <h3 className="font-extrabold text-base text-slate-900">
              Evaluation Report QR Code
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Embed this QR code in the physical and PDF project report. When scanned, reviewers are guided to the live dashboard.
            </p>
          </div>

          {/* QR Code Graphic Frame */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
            {data?.qrDataUrl && (
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <img
                  src={data.qrDataUrl}
                  alt="AI Bridge Report QR Code"
                  width={220}
                  height={220}
                  className="rounded-lg object-contain"
                />
              </div>
            )}
            <p className="text-[11px] font-bold text-emerald-800 text-center">
              Scan with Camera to Test Live Link
            </p>
          </div>

          {/* Download Buttons */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadQrPng}
                className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadQrSvg}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download SVG</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="truncate max-w-[260px] font-mono text-[11px]">
                {copiedLink ? 'Link Copied to Clipboard!' : data?.targetUrl}
              </span>
            </button>
          </div>
        </div>

        {/* Panel 2: Reviewer Password & Session Controls (Col 7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <div className="space-y-1">
            <span className="p-2 rounded-xl bg-teal-100 text-teal-800 font-bold text-xs inline-flex items-center gap-1.5">
              <KeyRound className="w-4 h-4" />
              <span>Evaluator Password Governance</span>
            </span>
            <h3 className="font-extrabold text-base text-slate-900 mt-2">
              Passcode & Access Security
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              External reviewers who scan the report QR code must enter this password to inspect live data. Team members bypass automatically.
            </p>
          </div>

          <div className="space-y-4">
            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Current Reviewer Access Passcode
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordDraft}
                  onChange={(e) => setPasswordDraft(e.target.value)}
                  className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Printed recommendation: <strong className="text-slate-600 font-mono">HHP-AIB-2026</strong>
              </p>
            </div>

            {/* Organization Label */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Evaluator Organization Label (Shown on Header)
              </label>
              <input
                type="text"
                value={orgDraft}
                onChange={(e) => setOrgDraft(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Session Expiry */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Reviewer Cookie Session Validity
              </label>
              <select
                value={sessionHours}
                onChange={(e) => setSessionHours(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                <option value={12}>12 Hours (Single Evaluation Day)</option>
                <option value={24}>24 Hours (Recommended for Gala Review)</option>
                <option value={72}>72 Hours (Weekend Evaluation Period)</option>
                <option value={168}>7 Days (Full Assessment Week)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <SdgLoading size={14} label="Saving access settings" /> : <Check className="w-3.5 h-3.5" />}
              <span>Save Password & Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chart-by-Chart Visibility Matrix Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-700" />
              <span>Granular Chart-by-Chart Visibility Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Toggle which individual cards and charts are displayed to Team Members versus External QR Reviewers.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer disabled:opacity-50"
          >
            {saving ? <SdgLoading size={14} label="Saving chart visibility settings" /> : <Check className="w-3.5 h-3.5" />}
            <span>Save Visibility Matrix</span>
          </button>
        </div>

        {/* Matrix Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
          <div className="bg-slate-50 px-4 py-3 flex items-center justify-between text-[11px] font-black uppercase text-slate-500 tracking-wider">
            <span>Chart / Component Name</span>
            <div className="flex items-center gap-8">
              <span className="w-24 text-center">Team Member</span>
              <span className="w-24 text-center">QR Reviewer</span>
            </div>
          </div>

          {Object.entries(permissionsDraft).map(([key, config]: [string, any]) => (
            <div key={key} className="p-4 flex items-center justify-between gap-3 bg-white hover:bg-slate-50/50 transition-colors">
              <div className="min-w-0">
                <p className="font-bold text-xs text-slate-900 truncate">
                  {config.title || key.replace(/_/g, ' ')}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">key: {key}</p>
              </div>

              <div className="flex items-center gap-8 shrink-0">
                {/* Team Toggle */}
                <div className="w-24 flex justify-center">
                  <button
                    type="button"
                    onClick={() => togglePermission(key, 'team_member_visible')}
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold transition-all border cursor-pointer ${
                      config.team_member_visible
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {config.team_member_visible ? 'VISIBLE' : 'HIDDEN'}
                  </button>
                </div>

                {/* Reviewer Toggle */}
                <div className="w-24 flex justify-center">
                  <button
                    type="button"
                    onClick={() => togglePermission(key, 'external_reviewer_visible')}
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold transition-all border cursor-pointer ${
                      config.external_reviewer_visible
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {config.external_reviewer_visible ? 'VISIBLE' : 'HIDDEN'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
