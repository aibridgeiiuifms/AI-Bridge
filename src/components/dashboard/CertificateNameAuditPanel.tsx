'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Award, 
  Search, 
  RefreshCw, 
  History, 
  ExternalLink, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  User, 
  Calendar,
  Edit3,
  X
} from 'lucide-react';
import SdgLoading from '@/components/SdgLoading';

export default function CertificateNameAuditPanel() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Admin Direct Override Modal State
  const [editingCert, setEditingCert] = useState<any | null>(null);
  const [overrideName, setOverrideName] = useState('');
  const [overrideNote, setOverrideNote] = useState('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/certificate-name-audit');
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      } else {
        showToast(json.error || 'Failed to load certificate audit logs', 'error');
      }
    } catch (err: any) {
      showToast('Network error loading audit logs: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 6000);
  };

  const handleResetLock = async (certificateId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to reset the 1-time name correction lock for ${studentName} (${certificateId})?\n\nThis will allow the student to use the self-service edit modal once more in their portal.`)) {
      return;
    }

    setActionLoadingId(certificateId);
    try {
      const res = await fetch('/api/admin/certificate-name-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_lock',
          certificateId,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message, 'success');
        await fetchAuditData();
      } else {
        showToast(json.error || 'Failed to reset lock', 'error');
      }
    } catch (err: any) {
      showToast('Network error: ' + err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAdminOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert || !overrideName.trim()) return;

    setIsSubmittingOverride(true);
    try {
      const res = await fetch('/api/admin/certificate-name-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_override',
          certificateId: editingCert.certificateId,
          newName: overrideName.trim(),
          adminNote: overrideNote.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message, 'success');
        setEditingCert(null);
        await fetchAuditData();
      } else {
        showToast(json.error || 'Failed to update certificate', 'error');
      }
    } catch (err: any) {
      showToast('Network error: ' + err.message, 'error');
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  const filteredLogs = useMemo(() => {
    const logs = data?.changedCertificates || [];
    if (!searchQuery.trim()) return logs;

    const q = searchQuery.toLowerCase().trim();
    return logs.filter((item: any) => 
      (item.certificateId || '').toLowerCase().includes(q) ||
      (item.currentName || '').toLowerCase().includes(q) ||
      (item.oldName || '').toLowerCase().includes(q) ||
      (item.studentEmail || '').toLowerCase().includes(q) ||
      (item.rollNumber || '').toLowerCase().includes(q) ||
      (item.department || '').toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-md animate-fade-in ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-300 text-emerald-950' 
            : 'bg-rose-50 border border-rose-300 text-rose-950'
        }`}>
          <div className="flex items-center gap-2.5">
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-slate-700 text-xs font-extrabold cursor-pointer">✕</button>
        </div>
      )}

      {/* Header and Stat Summary */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-0.5 rounded-full">
                Security & Audit Trail
              </span>
              <span className="text-xs text-slate-400">• Anti-Fraud Policy</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Certificate Name Correction Audit Panel
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Real-time audit log of all students who used their 1-time name correction feature. Original names are permanently archived for credential integrity.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAuditData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs self-start sm:self-center"
          >
            {loading ? <SdgLoading size={14} label="Refreshing" /> : <RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
            <span>{loading ? 'Refreshing...' : 'Refresh Logs'}</span>
          </button>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Total Issued Certificates</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">
              {data?.totalCertificates ?? '...'}
            </p>
            <p className="text-[11px] text-slate-400">Total generated records</p>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-amber-900 text-xs font-semibold">
              <span>Name Corrections Used</span>
              <History className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-950 tabular-nums">
              {data?.totalNameChanges ?? '...'}
            </p>
            <p className="text-[11px] text-amber-700">1-time self-service edits completed</p>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-emerald-900 text-xs font-semibold">
              <span>Policy Enforcement</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-sm font-black text-emerald-950 pt-1">
              Strict 1-Time Lock Active
            </p>
            <p className="text-[11px] text-emerald-700">Subsequent attempts blocked by API</p>
          </div>
        </div>
      </div>

      {/* Audit Log Table Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, old name, email, or AIB-ID..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredLogs.length}</strong> recorded correction{filteredLogs.length === 1 ? '' : 's'}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <SdgLoading size={36} label="Loading certificate audit logs" />
            <p className="text-xs text-slate-500 font-bold mt-3">Fetching certificate audit records from Supabase...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/60 space-y-2">
            <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No Name Modifications Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery.trim()
                ? `No name corrections match "${searchQuery}". Try a different keyword.`
                : 'No students have modified their certificate name yet. All certificates currently retain their initial issued names.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Certificate ID</th>
                  <th className="px-4 py-3">Student Email & ID</th>
                  <th className="px-4 py-3">Original Name (Archived)</th>
                  <th className="px-4 py-3">Corrected Official Name</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Reason / Audit Note</th>
                  <th className="px-4 py-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Certificate ID */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Link
                        href={`/verify/${item.certificateId}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 transition-colors"
                        title="View live public verification page"
                      >
                        <span>{item.certificateId}</span>
                        <ExternalLink className="w-3 h-3 text-emerald-600" />
                      </Link>
                    </td>

                    {/* Student Email & Roll */}
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900 truncate max-w-[180px]">{item.studentEmail}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Roll: {item.rollNumber}</p>
                    </td>

                    {/* Original Name */}
                    <td className="px-4 py-3.5">
                      <span className="font-serif text-slate-500 line-through bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {item.oldName}
                      </span>
                    </td>

                    {/* New Official Name */}
                    <td className="px-4 py-3.5">
                      <span className="font-serif font-black text-emerald-950 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs shadow-2xs">
                        {item.currentName}
                      </span>
                    </td>

                    {/* Date of Change */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-[11px] text-slate-600">
                      {item.nameChangedAt ? (
                        <>
                          <p className="font-bold">{new Date(item.nameChangedAt).toLocaleDateString()}</p>
                          <p className="text-[10px] text-slate-400">{new Date(item.nameChangedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="text-[11px] text-slate-600 italic leading-snug line-clamp-2" title={item.reason}>
                        &ldquo;{item.reason}&rdquo;
                      </p>
                    </td>

                    {/* Admin Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Admin Direct Override */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCert(item);
                            setOverrideName(item.currentName);
                            setOverrideNote('');
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                          title="Directly edit certificate recipient name as administrator"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset 1-Time Lock */}
                        <button
                          type="button"
                          onClick={() => handleResetLock(item.certificateId, item.currentName)}
                          disabled={actionLoadingId === item.certificateId}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                          title="Reset student's 1-time lock so they can change their name again from portal"
                        >
                          {actionLoadingId === item.certificateId ? (
                            <SdgLoading size={12} label="Resetting" />
                          ) : (
                            <RotateCcw className="w-3 h-3 text-amber-700" />
                          )}
                          <span>Reset Lock</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Direct Override Modal */}
      {editingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Admin Override: Edit Recipient Name</h3>
                <p className="text-xs text-slate-500 font-mono">{editingCert.certificateId}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCert(null)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminOverrideSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  New Official Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={overrideName}
                  onChange={(e) => setOverrideName(e.target.value)}
                  placeholder="Enter full corrected name"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Administrative Note <span className="text-slate-400 font-normal">(Reason for manual override)</span>
                </label>
                <input
                  type="text"
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  placeholder="e.g. Fixed per student WhatsApp request"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                As administrator, updating this will immediately update the certificate registry, keep the original name archived in the audit log, and regenerate PDF/PNG on next download.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCert(null)}
                  disabled={isSubmittingOverride}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOverride || !overrideName.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingOverride ? (
                    <>
                      <SdgLoading size={14} label="Saving" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Override</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
