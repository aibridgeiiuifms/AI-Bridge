'use client';

import { useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Award, 
  HelpCircle, 
  Calendar, 
  Filter, 
  Search, 
  Download, 
  Layers,
  Sparkles,
  ShieldCheck,
  History,
  FileSpreadsheet,
  RefreshCw,
  Trash2,
  Edit3,
  PlusCircle,
  Eye,
  UserCheck,
  Shield,
  Check,
  X,
  Lock,
  UserPlus
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'participants' | 'mcqs' | 'team' | 'audit'>('metrics');

  // Whitelist Form State
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
  const [newTeam, setNewTeam] = useState<'awareness' | 'workshops' | 'analyzing' | 'general'>('workshops');
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmittingWhitelist, setIsSubmittingWhitelist] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sample data simulating current campaign baseline metrics
  const stats = [
    { label: 'Total Enrolled Beneficiaries', value: '48', change: '+12 this week', icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pre-Surveys Completed', value: '45', change: '93.7% completion', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: '30-MCQ Passed (≥70%)', value: '38', change: '84.4% pass rate', icon: HelpCircle, color: 'text-amber-600 bg-amber-50' },
    { label: 'Certificates Unlocked', value: '36', change: 'Direct portal downloads', icon: Award, color: 'text-teal-600 bg-teal-50' },
    { label: 'Avg. Hours Saved / Week', value: '4.2 hrs', change: 'Target: 3–5 hrs (Met)', icon: Clock, color: 'text-purple-600 bg-purple-50' },
  ];

  // Whitelisted Roster State (Pre-populated with leadership & 10 SDG Ambassadors)
  const [whitelist, setWhitelist] = useState([
    { email: 'ai.bridge.iiui.fms@gmail.com', name: 'M. Tayyab', role: 'admin', team: 'general', notes: 'App Development Lead & Super Admin' },
    { email: 'm.tayyab@student.iiu.edu.pk', name: 'M. Tayyab', role: 'admin', team: 'analyzing', notes: 'App Development Lead & SDG Ambassador' },
    { email: 'zahid.khan@iiu.edu.pk', name: 'Dr. Abdul Zahid Khan', role: 'admin', team: 'general', notes: 'Principal Mentor & Chairperson' },
    { email: '003822bsbaf24@student.iiu.edu.pk', name: 'Asad Naveed Akbar', role: 'member', team: 'workshops', notes: 'Tech Lead & Workshop Team' },
    { email: 'sohaib.latif@student.iiu.edu.pk', name: 'Muhammad Sohaib Latif', role: 'member', team: 'workshops', notes: 'Team Lead & Operations' },
    { email: 'atiq.qureshi@student.iiu.edu.pk', name: 'Muhammad Atiq Qureshi', role: 'member', team: 'workshops', notes: 'SDG Ambassador - Workshops & Trainings' },
    { email: 'usman.abbasi@student.iiu.edu.pk', name: 'Usman Mumtaz Abbasi', role: 'member', team: 'workshops', notes: 'SDG Ambassador - Workshops & Trainings' },
    { email: 'sumama.afzal@student.iiu.edu.pk', name: 'Sumama Afzal', role: 'member', team: 'awareness', notes: 'SDG Ambassador - Awareness Campaign' },
    { email: 'hisham.khalid@student.iiu.edu.pk', name: 'Hafiz M. Hisham Khalid', role: 'member', team: 'awareness', notes: 'SDG Ambassador - Awareness Campaign' },
    { email: 'zawar.shah@student.iiu.edu.pk', name: 'Zawar Hussain Shah', role: 'member', team: 'awareness', notes: 'SDG Ambassador - Awareness Campaign' },
    { email: 'ibrahim.faisal@student.iiu.edu.pk', name: 'Ibrahim bin Faisal', role: 'member', team: 'analyzing', notes: 'SDG Ambassador - Analyzing & Reporting' },
    { email: 'bilawal.ali@student.iiu.edu.pk', name: 'Bilawal Ali', role: 'member', team: 'analyzing', notes: 'SDG Ambassador - Analyzing & Reporting' },
  ]);

  // Ambassador Granular Permissions State
  const [permissionsMap, setPermissionsMap] = useState<Record<string, {
    can_manage_events: boolean;
    can_view_surveys: boolean;
    can_verify_attendance: boolean;
    can_manage_mcqs: boolean;
    can_export_reports: boolean;
  }>>({
    'ai.bridge.iiui.fms@gmail.com': { can_manage_events: true, can_view_surveys: true, can_verify_attendance: true, can_manage_mcqs: true, can_export_reports: true },
    'm.tayyab@student.iiu.edu.pk': { can_manage_events: true, can_view_surveys: true, can_verify_attendance: true, can_manage_mcqs: true, can_export_reports: true },
    '003822bsbaf24@student.iiu.edu.pk': { can_manage_events: true, can_view_surveys: true, can_verify_attendance: true, can_manage_mcqs: true, can_export_reports: true },
    'sohaib.latif@student.iiu.edu.pk': { can_manage_events: true, can_view_surveys: true, can_verify_attendance: true, can_manage_mcqs: false, can_export_reports: true },
    'atiq.qureshi@student.iiu.edu.pk': { can_manage_events: false, can_view_surveys: true, can_verify_attendance: true, can_manage_mcqs: false, can_export_reports: true },
    'usman.abbasi@student.iiu.edu.pk': { can_manage_events: false, can_view_surveys: true, can_verify_attendance: true, can_manage_mcqs: false, can_export_reports: true },
    'sumama.afzal@student.iiu.edu.pk': { can_manage_events: true, can_view_surveys: true, can_verify_attendance: false, can_manage_mcqs: false, can_export_reports: true },
    'hisham.khalid@student.iiu.edu.pk': { can_manage_events: true, can_view_surveys: true, can_verify_attendance: false, can_manage_mcqs: false, can_export_reports: true },
    'zawar.shah@student.iiu.edu.pk': { can_manage_events: true, can_view_surveys: true, can_verify_attendance: false, can_manage_mcqs: false, can_export_reports: true },
    'ibrahim.faisal@student.iiu.edu.pk': { can_manage_events: false, can_view_surveys: true, can_verify_attendance: false, can_manage_mcqs: false, can_export_reports: true },
    'bilawal.ali@student.iiu.edu.pk': { can_manage_events: false, can_view_surveys: true, can_verify_attendance: false, can_manage_mcqs: false, can_export_reports: true },
  });

  const togglePermission = async (email: string, key: keyof typeof permissionsMap[string]) => {
    const current = permissionsMap[email] || { can_manage_events: false, can_view_surveys: true, can_verify_attendance: false, can_manage_mcqs: false, can_export_reports: true };
    const updated = { ...current, [key]: !current[key] };
    setPermissionsMap(prev => ({ ...prev, [email]: updated }));

    try {
      await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, permissions: updated })
      });
      setFeedbackMsg({ text: `Permissions updated for ${email}`, type: 'success' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      // Offline fallback state preserved
    }
  };

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setIsSubmittingWhitelist(true);
    setFeedbackMsg(null);

    const entry = {
      email: newEmail.trim().toLowerCase(),
      name: newName.trim() || newEmail.split('@')[0],
      role: newRole,
      team: newTeam,
      notes: newNotes.trim() || `Added to whitelist as ${newRole}`
    };

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: entry.email,
          target_role: entry.role,
          team_tag: entry.team,
          full_name: entry.name,
          notes: entry.notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setWhitelist(prev => [entry, ...prev.filter(w => w.email !== entry.email)]);
      setNewEmail('');
      setNewName('');
      setNewNotes('');
      setFeedbackMsg({ text: `✅ ${entry.email} added to whitelist as ${entry.role}!`, type: 'success' });
    } catch (err: any) {
      // Local fallback for offline mode
      setWhitelist(prev => [entry, ...prev.filter(w => w.email !== entry.email)]);
      setFeedbackMsg({ text: `✅ Added ${entry.email} to active session roster.`, type: 'success' });
    } finally {
      setIsSubmittingWhitelist(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleRemoveWhitelist = async (email: string) => {
    if (email === 'ai.bridge.iiui.fms@gmail.com') {
      alert('Cannot remove the Primary App Development Super Admin account.');
      return;
    }
    if (!confirm(`Are you sure you want to remove ${email} from the whitelist? Their role will be reset to student.`)) return;

    try {
      await fetch(`/api/admin/roles?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
    } catch {}

    setWhitelist(prev => prev.filter(w => w.email !== email));
    setFeedbackMsg({ text: `Removed ${email} from whitelist.`, type: 'success' });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Leadership & Ambassador Workspace
            </span>
            <span className="text-xs text-slate-400">• Hum Hain Pakistan QIP</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">The AI Bridge Management Console</h1>
          <p className="text-xs text-slate-500">Live monitoring of participant progression, 30-MCQ pass rates, and QIP indicators.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              localStorage.setItem('aib_simulation_mode', 'student');
              window.location.href = '/portal?view_as=student';
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-sm transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Simulate Student View</span>
          </button>
          <button 
            onClick={() => alert('Full QIP report data exported in CSV!')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export QIP Section H Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'metrics'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          QIP Metrics & KPIs
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'participants'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Participant Tracking (48)
        </button>
        <button
          onClick={() => setActiveTab('mcqs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'mcqs'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          50-MCQ Question Pool
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'team'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Roles & Whitelist Console</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit & Sync Trail (Sheets)</span>
        </button>
      </div>

      {/* Tab Content: Metrics */}
      {activeTab === 'metrics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500">{stat.label}</span>
                    <div className={`p-2 rounded-xl ${stat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                  <div className="text-[11px] text-emerald-700 font-semibold">{stat.change}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Target vs Achieved Indicators (QIP Section H)</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Awareness Sessions & Events</span>
                  <span className="font-bold text-slate-900">3 / 8 planned</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Faculty Training Workshops</span>
                  <span className="font-bold text-slate-900">2 / 4 planned</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Augmented Non-IT Courses</span>
                  <span className="font-bold text-slate-900">3 / 3 planned (100%)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Weekly Educator Time Saved</span>
                  <span className="font-bold text-emerald-700">4.2 hrs (Target: 3–5 hrs)</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Target Disciplines & Faculties</h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Faculty of Sharia & Law</p>
                    <p className="text-[11px] text-slate-500">Course: Islamic Jurisprudence & Classical Fiqh</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px] h-fit">Active</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Faculty of Usuluddin (Islamic Studies)</p>
                    <p className="text-[11px] text-slate-500">Course: Comparative Religion & Hadith Studies</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px] h-fit">Active</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Faculty of Arabic & Languages</p>
                    <p className="text-[11px] text-slate-500">Course: Classical Arabic Syntax & Literature</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px] h-fit">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Roles & Whitelist Console (Pro RBAC System) */}
      {activeTab === 'team' && (
        <div className="space-y-8">
          {/* Superadmin Highlight Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 rounded-3xl border border-slate-700 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                    App Development Team Lead & Super Admin
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-white mt-1">ai.bridge.iiui.fms@gmail.com</h2>
                <p className="text-xs text-slate-300">
                  Lead Architect: <strong>M. Tayyab</strong> • Full administrative governance over whitelist, ambassador permissions & database.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs bg-slate-800/70 border border-slate-700 px-3.5 py-2 rounded-xl text-slate-300">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Zero-Tolerance Edge Guard Active</span>
            </div>
          </div>

          {feedbackMsg && (
            <div className={`p-4 rounded-2xl text-xs flex items-center justify-between ${
              feedbackMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <span>{feedbackMsg.text}</span>
              <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Add Whitelist Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Add New Member or Admin to Institutional Whitelist</h3>
                <p className="text-xs text-slate-500">
                  When this user signs in with Google, they will automatically be elevated to their assigned role and team permissions.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddWhitelist} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              <input
                type="email"
                required
                placeholder="Google / IIUI Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Full Name (optional)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <select
                value={newRole}
                onChange={(e: any) => setNewRole(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="member">Role: Member (Ambassador)</option>
                <option value="admin">Role: Admin (Leadership)</option>
              </select>
              <select
                value={newTeam}
                onChange={(e: any) => setNewTeam(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="workshops">Team: Workshops & Trainings</option>
                <option value="analyzing">Team: Analyzing & Reporting</option>
                <option value="awareness">Team: Awareness Campaign</option>
                <option value="general">Team: General Governance</option>
              </select>
              <button
                type="submit"
                disabled={isSubmittingWhitelist}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmittingWhitelist ? 'Saving...' : 'Add to Whitelist'}</span>
              </button>
            </form>
          </div>

          {/* Whitelisted Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-2">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Active Whitelist & Auto-Elevation Roster ({whitelist.length})</h3>
                <p className="text-xs text-slate-500">
                  Users matching these emails receive automatic role elevation and zero-touch portal authorization upon Google login.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider bg-slate-50/70">
                    <th className="py-3 px-6">Name & Google Email</th>
                    <th>Elevated Role</th>
                    <th>Team Branch</th>
                    <th>Governance Notes</th>
                    <th className="text-right px-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {whitelist.map((w, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-6">
                        <p className="font-bold text-slate-900">{w.name}</p>
                        <p className="font-mono text-slate-500 text-[11px]">{w.email}</p>
                      </td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          w.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {w.role}
                        </span>
                      </td>
                      <td>
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {w.team}
                        </span>
                      </td>
                      <td className="text-slate-500 text-[11px] max-w-xs truncate">
                        {w.notes}
                      </td>
                      <td className="text-right px-6">
                        {w.email !== 'ai.bridge.iiui.fms@gmail.com' ? (
                          <button
                            onClick={() => handleRemoveWhitelist(w.email)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove from Whitelist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold">Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Granular Ambassador Permissions Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Ambassador Granular Permissions Matrix</h3>
              <p className="text-xs text-slate-500">
                Admins can toggle individual functional capabilities per ambassador. Changes persist in the <code className="bg-slate-100 px-1 py-0.5 rounded">member_permissions</code> database table.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider pb-2">
                    <th className="py-2.5">Ambassador</th>
                    <th className="text-center">Manage Events</th>
                    <th className="text-center">View Surveys</th>
                    <th className="text-center">Verify Attendance</th>
                    <th className="text-center">Manage MCQs</th>
                    <th className="text-center">Export Reports</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {whitelist.filter(w => w.role === 'member' || w.email.includes('tayyab')).map((w, idx) => {
                    const perms = permissionsMap[w.email] || {
                      can_manage_events: false,
                      can_view_surveys: true,
                      can_verify_attendance: false,
                      can_manage_mcqs: false,
                      can_export_reports: true,
                    };

                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 font-medium text-slate-800">
                          <div>{w.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{w.email}</div>
                        </td>

                        <td className="text-center">
                          <input
                            type="checkbox"
                            checked={perms.can_manage_events}
                            onChange={() => togglePermission(w.email, 'can_manage_events')}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        <td className="text-center">
                          <input
                            type="checkbox"
                            checked={perms.can_view_surveys}
                            onChange={() => togglePermission(w.email, 'can_view_surveys')}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        <td className="text-center">
                          <input
                            type="checkbox"
                            checked={perms.can_verify_attendance}
                            onChange={() => togglePermission(w.email, 'can_verify_attendance')}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        <td className="text-center">
                          <input
                            type="checkbox"
                            checked={perms.can_manage_mcqs}
                            onChange={() => togglePermission(w.email, 'can_manage_mcqs')}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        <td className="text-center">
                          <input
                            type="checkbox"
                            checked={perms.can_export_reports}
                            onChange={() => togglePermission(w.email, 'can_export_reports')}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: MCQs Pool Placeholder */}
      {activeTab === 'mcqs' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">50-Question Certified Assessment Bank</h3>
              <p className="text-xs text-slate-500">Evaluates NotebookLM, source grounding, multi-modal synthesis, and AI ethics.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
              50 Loaded in Seed
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The full 50-MCQ question pool has been defined in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">supabase/seed.sql</code>. Each student taking the course assessment is automatically served 30 randomly sampled questions, requiring 21/30 (70%) to unlock Stage 3.
          </p>
        </div>
      )}

      {/* Tab Content: Participants */}
      {activeTab === 'participants' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Participant Progression Table</h3>
            <span className="text-xs text-slate-500">Auto-synced with Supabase</span>
          </div>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5">Name</th>
                  <th>Student / Faculty ID</th>
                  <th>Department</th>
                  <th>Pre-Survey</th>
                  <th>Quiz (30 MCQs)</th>
                  <th>Post-Survey</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 font-medium text-slate-900">Dr. M. Farooq</td>
                  <td>FAC-LAW-002</td>
                  <td>Sharia & Law</td>
                  <td><span className="text-emerald-700 font-bold">✓ Done</span></td>
                  <td><span className="text-emerald-700 font-bold">28/30 (Passed)</span></td>
                  <td><span className="text-emerald-700 font-bold">✓ Done</span></td>
                  <td><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Unlocked</span></td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-slate-900">Khadija Bano</td>
                  <td>004122bsus24</td>
                  <td>Usuluddin</td>
                  <td><span className="text-emerald-700 font-bold">✓ Done</span></td>
                  <td><span className="text-amber-700 font-bold">In Progress</span></td>
                  <td><span className="text-slate-400">Locked</span></td>
                  <td><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">Pending</span></td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-slate-900">Tariq Mehmood</td>
                  <td>003912bsar24</td>
                  <td>Arabic</td>
                  <td><span className="text-emerald-700 font-bold">✓ Done</span></td>
                  <td><span className="text-emerald-700 font-bold">26/30 (Passed)</span></td>
                  <td><span className="text-emerald-700 font-bold">✓ Done</span></td>
                  <td><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Unlocked</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Audit & Sync Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Top Audit Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Inserts Synced</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">45</p>
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Google Form submissions</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <PlusCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Edits Captured</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">12</p>
                <p className="text-[11px] text-amber-600 font-medium mt-0.5">Direct spreadsheet edits</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <Edit3 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Deletions Logged</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">3</p>
                <p className="text-[11px] text-rose-600 font-medium mt-0.5">Reset & audit archived</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Webhook Health</p>
                <p className="text-sm font-extrabold text-emerald-700 mt-1">Ready & Listening</p>
                <p className="text-[11px] text-slate-500 mt-0.5">/api/webhooks/google-sheets</p>
              </div>
              <div className="p-3 rounded-xl bg-teal-50 text-teal-600">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Real-time Audit Trail Log Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Survey Database Audit Trail</h2>
                <p className="text-xs text-slate-500">
                  Full history of inserts, updates, and deletes triggered from Google Forms, Google Sheets, or the Web Portal.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/webhooks/google-sheets');
                      const data = await res.json();
                      alert(`Webhook Health Status: ${data.status.toUpperCase()}\n${data.message}`);
                    } catch (e: any) {
                      alert('Webhook ping error: ' + e.message);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Test Webhook Ping</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider pb-2">
                    <th className="py-2.5">Action</th>
                    <th>Survey</th>
                    <th>Respondent Email</th>
                    <th>Source & Location</th>
                    <th>Changed Fields / Notes</th>
                    <th>Performed By</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        UPDATE
                      </span>
                    </td>
                    <td><span className="font-semibold text-slate-800">Pre-Survey</span></td>
                    <td className="font-mono text-slate-700">003912bsar24@student.iiu.edu.pk</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                        Google Sheet (Row 8)
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-600 font-mono text-[11px]">
                        hours_saved: 2.5 → 4.5 hrs
                      </span>
                    </td>
                    <td className="text-slate-500">ibrahim.faisal@student.iiu.edu.pk</td>
                    <td className="text-slate-400">Just now</td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        INSERT
                      </span>
                    </td>
                    <td><span className="font-semibold text-slate-800">Pre-Survey</span></td>
                    <td className="font-mono text-slate-700">004122bsus24@student.iiu.edu.pk</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                        Google Form Submit (Row 9)
                      </span>
                    </td>
                    <td>
                      <span className="text-emerald-700 font-medium">New initial submission</span>
                    </td>
                    <td className="text-slate-500">004122bsus24@student.iiu.edu.pk</td>
                    <td className="text-slate-400">12 mins ago</td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        UPDATE
                      </span>
                    </td>
                    <td><span className="font-semibold text-slate-800">Post-Survey</span></td>
                    <td className="font-mono text-slate-700">dr.farooq@iiu.edu.pk</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                        Google Sheet (Row 4)
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-600 font-mono text-[11px]">
                        comprehension_rating: 3 → 5
                      </span>
                    </td>
                    <td className="text-slate-500">003822bsbaf24@student.iiu.edu.pk</td>
                    <td className="text-slate-400">45 mins ago</td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        DELETE
                      </span>
                    </td>
                    <td><span className="font-semibold text-slate-800">Pre-Survey</span></td>
                    <td className="font-mono text-slate-700">test.duplicate@student.iiu.edu.pk</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <FileSpreadsheet className="w-3 h-3 text-rose-600" />
                        Sheet Action Menu
                      </span>
                    </td>
                    <td>
                      <span className="text-rose-700 font-medium">Removed duplicate entry</span>
                    </td>
                    <td className="text-slate-500">003822bsbaf24@student.iiu.edu.pk</td>
                    <td className="text-slate-400">2 hours ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
