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
  ShieldCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'participants' | 'mcqs' | 'team'>('metrics');

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
    </div>
  );
}
