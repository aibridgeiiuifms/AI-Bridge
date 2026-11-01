'use client';

import React, { useState, useEffect } from 'react';
import { X, QrCode, KeyRound, ShieldAlert, ShieldCheck, Copy, Check, Lock, Unlock, RefreshCw, Ban, UserCheck, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

interface GuestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuestAccessModal({ isOpen, onClose }: GuestAccessModalProps) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [data, setData] = useState<any>(null);
  const [passcode, setPasscode] = useState('');
  const [isEditingPasscode, setIsEditingPasscode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchGuestSettings();
    }
  }, [isOpen]);

  const fetchGuestSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/guest-access');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load guest settings');
      setData(json);
      setPasscode(json.settings?.passcode || '');
    } catch (err: any) {
      setStatusMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccess = async () => {
    if (!data) return;
    setUpdating(true);
    try {
      const nextState = !data.settings.isEnabled;
      const res = await fetch('/api/admin/guest-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_access',
          is_enabled: nextState,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to toggle access');

      setData((prev: any) => ({
        ...prev,
        settings: { ...prev.settings, isEnabled: nextState },
      }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSavePasscode = async () => {
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/guest-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_passcode',
          passcode,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update passcode');

      setIsEditingPasscode(false);
      setData((prev: any) => ({
        ...prev,
        settings: { ...prev.settings, passcode },
      }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleBlockSession = async (logId: string, currentBlocked: boolean) => {
    try {
      const res = await fetch('/api/admin/guest-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'block_session',
          log_id: logId,
          is_blocked: !currentBlocked,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to toggle block');

      setData((prev: any) => ({
        ...prev,
        logs: prev.logs.map((log: any) =>
          log.id === logId ? { ...log, is_blocked: !currentBlocked } : log
        ),
      }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyToClipboard = (text: string, type: 'url' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Outsider QR & Guest Passcode Access
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Allow external reviewers (Deans, HEC, SDG Evaluators) to view the impact dashboard.
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs font-bold">Loading guest access configuration...</p>
            </div>
          ) : (
            <>
              {/* Master Access Banner */}
              <div
                className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-all ${
                  data?.settings?.isEnabled
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50/80 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                      data?.settings?.isEnabled ? 'bg-emerald-200/80 text-emerald-900' : 'bg-rose-200/80 text-rose-900'
                    }`}
                  >
                    {data?.settings?.isEnabled ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-black">
                      Outsider Access Status: {data?.settings?.isEnabled ? 'ACTIVE & ACCESSIBLE' : 'BLOCKED & DISABLED'}
                    </p>
                    <p className="text-[11px] opacity-80">
                      {data?.settings?.isEnabled
                        ? 'Guests can scan the QR code and unlock the dashboard using the passcode.'
                        : 'All guest logins are currently rejected by the system.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleAccess}
                  disabled={updating}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer flex items-center gap-2 ${
                    data?.settings?.isEnabled
                      ? 'bg-rose-700 hover:bg-rose-800 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {data?.settings?.isEnabled ? (
                    <>
                      <Ban className="w-4 h-4" />
                      <span>Block All Guest Access</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Enable Guest Access</span>
                    </>
                  )}
                </button>
              </div>

              {/* QR Code & Passcode Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-slate-50 p-5 rounded-3xl border border-slate-200">
                {/* QR Code */}
                <div className="text-center space-y-3 flex flex-col items-center">
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md">
                    {data?.settings?.qrDataUrl ? (
                      <img
                        src={data.settings.qrDataUrl}
                        alt="Guest Access QR Code"
                        className="w-48 h-48 rounded-lg"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center bg-slate-100 text-slate-400">
                        QR Code Loading...
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-slate-500">
                    Scan with any mobile camera to open dashboard
                  </p>
                </div>

                {/* Direct Link and Passcode Controls */}
                <div className="space-y-4">
                  {/* Passcode Box */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                        Guest Access Passcode
                      </span>
                      {!isEditingPasscode && (
                        <button
                          onClick={() => setIsEditingPasscode(true)}
                          className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          Change Passcode
                        </button>
                      )}
                    </div>

                    {isEditingPasscode ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={passcode}
                          onChange={e => setPasscode(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-emerald-300 font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        />
                        <button
                          onClick={handleSavePasscode}
                          disabled={updating || passcode.trim().length < 4}
                          className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingPasscode(false);
                            setPasscode(data?.settings?.passcode || '');
                          }}
                          className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="font-mono text-base font-black text-slate-900 tracking-wider">
                          {data?.settings?.passcode}
                        </span>
                        <button
                          onClick={() => copyToClipboard(data?.settings?.passcode, 'pass')}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
                          title="Copy passcode"
                        >
                          {copiedPass ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Public Link Box */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <span className="text-xs font-bold text-slate-500">Public Portal URL</span>
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 truncate gap-2">
                      <span className="truncate">{data?.settings?.guestUrl}</span>
                      <button
                        onClick={() => copyToClipboard(data?.settings?.guestUrl, 'url')}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-slate-200 transition-all shrink-0 cursor-pointer"
                        title="Copy URL"
                      >
                        {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Outsider Access Logs Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-slate-500" />
                    Live Guest Access History & Block Controls
                  </h3>
                  <span className="text-[10px] text-slate-400">Shows last 50 outsider logins</span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Device / Platform</th>
                          <th className="p-3">IP Address</th>
                          <th className="p-3">Time</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data?.logs && data.logs.length > 0 ? (
                          data.logs.map((log: any) => (
                            <tr key={log.id} className={log.is_blocked ? 'bg-rose-50/50' : ''}>
                              <td className="p-3 font-bold text-slate-900">{log.device_info || 'Unknown Device'}</td>
                              <td className="p-3 font-mono text-slate-600">{log.ip_address}</td>
                              <td className="p-3 text-slate-500">
                                {new Date(log.accessed_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </td>
                              <td className="p-3">
                                {log.is_blocked ? (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                                    BLOCKED
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                                    Active
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleToggleBlockSession(log.id, log.is_blocked)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                                    log.is_blocked
                                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                      : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                  }`}
                                >
                                  {log.is_blocked ? 'Unblock' : '🚫 Block'}
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400">
                              No guest logins recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
