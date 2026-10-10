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
  PlusCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'participants' | 'mcqs' | 'team' | 'audit'>('metrics');

  // Sample data simulating current campaign baseline metrics
  const stats = [
    { label: 'Total Enrolled Beneficiaries', value: '48', change: '+12 this week', icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pre-Surveys Completed', value: '45', change: '93.7% completion', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: '30-MCQ Passed (≥70%)', value: '38', change: '84.4% pass rate', icon: HelpCircle, color: 'text-amber-600 bg-amber-50' },
    { label: 'Certificates Unlocked', value: '36', change: 'Direct portal downloads', icon: Award, color: 'text-teal-600 bg-teal-50' },
    { label: 'Avg. Hours Saved / Week', value: '4.2 hrs', change: 'Target: 3–5 hrs (Met)', icon: Clock, color: 'text-purple-600 bg-purple-50' },
  ];

  const ambassadors = [
    { name: 'Dr. Abdul Zahid Khan', role: 'Principal Mentor & Project Lead', team: 'Governance', email: 'zahid.khan@iiu.edu.pk' },
    { name: 'Asad Naveed Akbar', role: 'Team Lead & Tech Architect', team: 'Workshops & Trainings', email: '003822bsbaf24@student.iiu.edu.pk' },
    { name: 'Muhammad Sohaib Latif', role: 'Team Lead & Operations', team: 'Workshops & Trainings', email: 'sohaib.latif@student.iiu.edu.pk' },
    { name: 'Sumama Afzal', role: 'SDG Ambassador', team: 'Awareness Campaign', email: 'sumama.afzal@student.iiu.edu.pk' },
    { name: 'Hafiz M. Hisham Khalid', role: 'SDG Ambassador', team: 'Awareness Campaign', email: 'hisham.khalid@student.iiu.edu.pk' },
    { name: 'Zawar Hussain Shah', role: 'SDG Ambassador', team: 'Awareness Campaign', email: 'zawar.shah@student.iiu.edu.pk' },
    { name: 'Muhammad Atiq Qureshi', role: 'SDG Ambassador', team: 'Workshops & Trainings', email: 'atiq.qureshi@student.iiu.edu.pk' },
    { name: 'Usman Mumtaz Abbasi', role: 'SDG Ambassador', team: 'Workshops & Trainings', email: 'usman.abbasi@student.iiu.edu.pk' },
    { name: 'Ibrahim bin Faisal', role: 'SDG Ambassador', team: 'Analyzing & Reporting', email: 'ibrahim.faisal@student.iiu.edu.pk' },
    { name: 'M. Tayyab', role: 'SDG Ambassador', team: 'Analyzing & Reporting', email: 'm.tayyab@student.iiu.edu.pk' },
    { name: 'Bilawal Ali', role: 'SDG Ambassador', team: 'Analyzing & Reporting', email: 'bilawal.ali@student.iiu.edu.pk' },
  ];

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
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'team'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          10 SDG Ambassadors Roster
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

      {/* Tab Content: Team */}
      {activeTab === 'team' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">FMS SDG Ambassadors & Project Leadership Roster</h3>
            <p className="text-xs text-slate-500">10 core student ambassadors organized across the 3 execution branches.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {ambassadors.map((person, idx) => (
              <div key={idx} className="p-4 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-slate-50 text-xs">
                <div>
                  <p className="font-bold text-slate-900">{person.name}</p>
                  <p className="text-slate-500">{person.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                    {person.team}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-semibold">
                    {person.role}
                  </span>
                </div>
              </div>
            ))}
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
