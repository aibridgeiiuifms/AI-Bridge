'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import sdgWheel from '../../../Assets/SDG Wheel.png';
import { 
  ShieldCheck, 
  Linkedin, 
  Mail, 
  ExternalLink, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  GraduationCap,
  Briefcase,
  Layers,
  ChevronRight
} from 'lucide-react';

interface TeamMember {
  id: string;
  email: string | null;
  full_name: string;
  designation: string;
  bio: string | null;
  avatar_url: string | null;
  position_order: number;
  team_tag: string;
  assigned_tasks: string[];
  linkedin_url: string | null;
  is_published: boolean;
}

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchTeam() {
      try {
        const res = await fetch('/api/team');
        const data = await res.json();
        if (data.success) {
          setTeam(data.team || []);
        }
      } catch (err) {
        console.error('Failed to load team:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTeam();
  }, []);

  // Extract all unique dynamic team tags from real data
  const dynamicTags = Array.from(
    new Set(
      team
        .map((m) => m.team_tag?.trim())
        .filter((t): t is string => Boolean(t && t !== ''))
    )
  );

  // Filter members based on category
  const filteredTeam = team.filter((m) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'lead') return m.position_order <= 4;
    return m.team_tag?.trim().toLowerCase() === activeFilter.trim().toLowerCase();
  });

  // Split into 3 distinct visual tiers based on position_order
  const tier1Leader = filteredTeam.find((m) => m.position_order === 1);
  const tier2Leads = filteredTeam.filter((m) => m.position_order > 1 && m.position_order <= 4);
  const tier3Members = filteredTeam.filter((m) => m.position_order > 4);

  // Helper for dynamic team tag styling
  const getTagBadge = (tag: string) => {
    const t = (tag || 'General').toLowerCase();
    if (t.includes('workshop') || t.includes('training')) {
      return { label: tag, bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (t.includes('aware') || t.includes('campaign')) {
      return { label: tag, bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (t.includes('analyz') || t.includes('report') || t.includes('tech') || t.includes('app')) {
      return { label: tag, bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
    return { label: tag || 'General', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>

        <div className="max-w-6xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Hum Hain Pakistan • SDG Youth Campaign</span>
            <span className="text-slate-400">• FMS IIUI</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Leadership & SDG Ambassadors
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm lg:text-base max-w-2xl mx-auto leading-relaxed">
            The dedicated academic governance, technical architects, and student ambassadors championing source-grounded AI tools across non-IT faculties at International Islamic University Islamabad.
          </p>

          {/* Quick Dynamic Filter Bar */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-bold'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10'
              }`}
            >
              All Members ({team.length})
            </button>

            {team.some((m) => m.position_order <= 4) && (
              <button
                onClick={() => setActiveFilter('lead')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeFilter === 'lead'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-bold'
                    : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10'
                }`}
              >
                Leadership
              </button>
            )}

            {dynamicTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveFilter(tag)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeFilter.toLowerCase() === tag.toLowerCase()
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-bold'
                    : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 space-y-12">
        {loading ? (
          <div className="text-center py-20 space-y-3">
            <Image
              src={sdgWheel}
              alt="Sustainable Development Goals wheel"
              className="w-16 h-16 mx-auto animate-[spin_4s_linear_infinite]"
            />
            <p className="text-xs text-slate-500 font-medium">Loading team profiles from Supabase...</p>
          </div>
        ) : (
          <>
            {/* ======================================================== */}
            {/* TIER 1: ROW 1 - SOLO PROJECT LEAD & PRINCIPAL MENTOR     */}
            {/* ======================================================== */}
            {tier1Leader && (
              <div className="w-full">
                <div className="bg-white rounded-3xl border-2 border-emerald-500/30 shadow-xl overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-100/60 via-emerald-50/20 to-transparent rounded-bl-full pointer-events-none"></div>

                  <div className="p-6 sm:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                    {/* Photo with Institutional Aura */}
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <div className="relative">
                        <div className="relative w-[11.5rem] h-[11.5rem] sm:w-[13.5rem] sm:h-[13.5rem] aspect-square rounded-full overflow-hidden bg-slate-900 p-1 shadow-lg shadow-emerald-900/20">
                          {tier1Leader.avatar_url ? (
                            <img
                              src={tier1Leader.avatar_url}
                              alt={tier1Leader.full_name}
                              className="block h-full w-full object-cover object-[center_30%] rounded-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-white">
                              <span className="text-3xl font-extrabold tracking-wider text-emerald-400">
                                {tier1Leader.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-950 p-1.5 rounded-xl shadow-md border-2 border-white" title="Project Lead & Principal Mentor">
                          <Award className="w-5 h-5" />
                        </div>
                      </div>

                    </div>

                    {/* Content & Bio */}
                    <div className="flex-1 text-center md:text-left space-y-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Project Lead & Principal Mentor</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                          {tier1Leader.full_name}
                        </h2>
                        <p className="text-xs sm:text-sm font-semibold text-emerald-700 mt-1">
                          {tier1Leader.designation}
                        </p>
                      </div>

                      {tier1Leader.bio && (
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify md:text-left">
                          {tier1Leader.bio}
                        </p>
                      )}

                      {/* Tasks Badges */}
                      {tier1Leader.assigned_tasks && tier1Leader.assigned_tasks.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Key Leadership Responsibilities:
                          </span>
                          <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                            {tier1Leader.assigned_tasks.map((task, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                              >
                                {task}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Social & Contact Links */}
                      <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                        {tier1Leader.email && (
                          <a
                            href={`mailto:${tier1Leader.email}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{tier1Leader.email}</span>
                          </a>
                        )}
                        {tier1Leader.linkedin_url && (
                          <a
                            href={tier1Leader.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                          >
                            <Linkedin className="w-3.5 h-3.5" />
                            <span>LinkedIn Profile</span>
                            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TIER 2: ROW 2 - TEAM LEADS (POSITIONS 2, 3, 4)           */}
            {/* ======================================================== */}
            {tier2Leads.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-1.5 bg-emerald-600 rounded-full"></div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                    Project Leads & Technical Architects
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">({tier2Leads.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tier2Leads.map((member) => {
                    const tagStyle = getTagBadge(member.team_tag);
                    return (
                      <div
                        key={member.id}
                        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="relative w-[6.5rem] h-[6.5rem] aspect-square rounded-full overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-200 shadow-inner">
                              {member.avatar_url ? (
                                <img
                                  src={member.avatar_url}
                                  alt={member.full_name}
                                  className="block h-full w-full object-cover object-[center_30%] rounded-full"
                                />
                              ) : (
                                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-lg">
                                  {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-extrabold text-slate-900 text-base truncate">
                                {member.full_name}
                              </h4>
                              <p className="text-xs font-semibold text-emerald-700 leading-snug mt-0.5 line-clamp-2">
                                {member.designation}
                              </p>
                              <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold border ${tagStyle.bg}`}>
                                {tagStyle.label}
                              </span>
                            </div>
                          </div>

                          {member.bio && (
                            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                              {member.bio}
                            </p>
                          )}

                          {member.assigned_tasks && member.assigned_tasks.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {member.assigned_tasks.map((task, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                                >
                                  {task}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Card Footer Links */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          {member.email ? (
                            <a
                              href={`mailto:${member.email}`}
                              className="text-slate-500 hover:text-emerald-700 font-mono text-[11px] truncate flex items-center gap-1"
                              title={member.email}
                            >
                              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{member.email}</span>
                            </a>
                          ) : <div></div>}

                          {member.linkedin_url && (
                            <a
                              href={member.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0"
                              title="LinkedIn Profile"
                            >
                              <Linkedin className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TIER 3: ROW 3+ - CORE TEAM / SDG AMBASSADORS (POS 5+)    */}
            {/* ======================================================== */}
            {tier3Members.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-1.5 bg-emerald-600 rounded-full"></div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                    FMS SDG Ambassadors & Functional Teams
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">({tier3Members.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tier3Members.map((member) => {
                    const tagStyle = getTagBadge(member.team_tag);
                    return (
                      <div
                        key={member.id}
                        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="relative w-[7.5rem] h-[7.5rem] aspect-square rounded-full overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-200">
                              {member.avatar_url ? (
                                <img
                                  src={member.avatar_url}
                                  alt={member.full_name}
                                  className="block h-full w-full object-cover object-[center_30%] rounded-full"
                                />
                              ) : (
                                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-base">
                                  {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-slate-900 text-base truncate">
                                {member.full_name}
                              </h4>
                              <p className="text-xs text-slate-500 truncate">
                                {member.designation}
                              </p>
                            </div>
                          </div>

                          <div className="pt-1">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${tagStyle.bg}`}>
                              {tagStyle.label}
                            </span>
                          </div>

                          {member.bio && (
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {member.bio}
                            </p>
                          )}

                          {member.assigned_tasks && member.assigned_tasks.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {member.assigned_tasks.slice(0, 2).map((task, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                                >
                                  {task}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Footer info */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          {member.email ? (
                            <a
                              href={`mailto:${member.email}`}
                              className="text-slate-400 hover:text-emerald-700 text-[11px] font-mono truncate"
                              title={member.email}
                            >
                              {member.email.split('@')[0]}
                            </a>
                          ) : <div></div>}

                          {member.linkedin_url && (
                            <a
                              href={member.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Linkedin className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredTeam.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">
                  {team.length === 0 ? 'No Team Profiles Published Yet' : 'No members found in this category'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {team.length === 0
                    ? 'The project administration is configuring the team roster. Administrators and delegated managers can add members directly from the dashboard.'
                    : 'Switch the category filter above or check back shortly.'}
                </p>
                {team.length === 0 && (
                  <div className="pt-2">
                    <Link
                      href="/dashboard?tab=team"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors"
                    >
                      <span>Manage Team in Dashboard</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
