'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Linkedin,
  Mail,
  ExternalLink,
  Award,
  Users,
} from 'lucide-react';
import { TeamSectionSkeleton } from '@/components/skeletons/TeamCardSkeleton';
import TiltCard from '@/components/ui/TiltCard';
import ScrollReveal from '@/components/ui/ScrollReveal';

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

export default function TeamSection() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');

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

  const categories = [
    'All',
    ...Array.from(
      new Set(
        team
          .filter((m) => m.position_order > 1)
          .map((m) => m.team_tag?.trim())
          .filter(Boolean)
      )
    ),
  ];

  const tier1Leader = team.find((m) => m.position_order === 1);
  const tier2Leads = team.filter(
    (m) =>
      m.position_order > 1 &&
      m.position_order <= 4 &&
      (activeCategory === 'All' || m.team_tag === activeCategory)
  );
  const tier3Members = team.filter(
    (m) =>
      m.position_order > 4 &&
      (activeCategory === 'All' || m.team_tag === activeCategory)
  );

  const getTagBadge = (tag: string) => {
    const t = (tag || 'General').toLowerCase();
    if (t.includes('workshop') || t.includes('training')) {
      return {
        label: tag,
        bg: 'bg-[#EEF1F6] text-[#14284B] border-[#CBD5E1]',
      };
    }
    if (t.includes('aware') || t.includes('campaign')) {
      return {
        label: tag,
        bg: 'bg-[#FDF6EA] text-[#B0761E] border-[#EAD1A7]',
      };
    }
    if (t.includes('analyz') || t.includes('report') || t.includes('tech') || t.includes('app')) {
      return {
        label: tag,
        bg: 'bg-[#E6F0EC] text-[#0F4C3A] border-[#C3DCD2]',
      };
    }
    return {
      label: tag || 'General',
      bg: 'bg-[#F1EFEA] text-[#334155] border-[#E2DFD7]',
    };
  };

  return (
    <section
      id="team"
      className="py-16 sm:py-20 lg:py-24 bg-white border-b border-[#E2DFD7]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <ScrollReveal className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#E6F0EC] border border-[#C3DCD2] text-[#0F4C3A] text-xs font-bold uppercase tracking-wider">
            Institutional Governance &amp; Team
          </span>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
            Leadership &amp; FMS SDG Ambassadors
          </h2>

          <p className="text-[#334155] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            The academic governance, technical architects, and student ambassadors championing source-grounded AI tools across non-IT faculties at International Islamic University Islamabad.
          </p>
        </ScrollReveal>

        {loading ? (
          <div className="pt-4">
            <TeamSectionSkeleton />
          </div>
        ) : (
          <div className="space-y-12">
            {/* TIER 1: PROJECT LEAD & PRINCIPAL MENTOR */}
            {tier1Leader && (
              <ScrollReveal>
                <TiltCard maxTilt={2.5} className="w-full">
                  <div className="bg-[#F8F7F4] rounded-3xl border-2 border-[#0F4C3A]/30 shadow-md overflow-hidden relative">
                    <div className="p-6 sm:p-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                      {/* Avatar */}
                      <div className="shrink-0 flex flex-col items-center">
                        <div className="relative">
                          <div className="relative w-44 h-44 sm:w-52 sm:h-52 aspect-square rounded-full overflow-hidden bg-[#0F172A] p-1 shadow-md border-2 border-[#0F4C3A]">
                            {tier1Leader.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={tier1Leader.avatar_url}
                                alt={tier1Leader.full_name}
                                loading="lazy"
                                decoding="async"
                                className="block h-full w-full object-cover object-[center_30%] rounded-full"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#0F172A] rounded-full flex items-center justify-center text-white">
                                <span className="text-3xl font-extrabold tracking-wider text-[#EAD1A7]">
                                  {tier1Leader.full_name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div
                            className="absolute -bottom-2 -right-2 bg-[#C88A2B] text-[#0F172A] p-2 rounded-xl shadow-md border-2 border-white"
                            title="Project Lead & Principal Mentor"
                          >
                            <Award className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* Content & Bio */}
                      <div className="flex-1 text-center md:text-left space-y-4">
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF6EA] border border-[#EAD1A7] text-[#B0761E] text-xs font-bold mb-2">
                            <span>Project Lead &amp; Principal Mentor</span>
                          </div>
                          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                            {tier1Leader.full_name}
                          </h3>
                          <p className="text-xs sm:text-sm font-bold text-[#0F4C3A] mt-1">
                            {tier1Leader.designation}
                          </p>
                        </div>

                        {tier1Leader.bio && (
                          <p className="text-sm text-[#334155] leading-relaxed">
                            {tier1Leader.bio}
                          </p>
                        )}

                        {tier1Leader.assigned_tasks &&
                          tier1Leader.assigned_tasks.length > 0 && (
                            <div className="space-y-2 pt-3 border-t border-[#E2DFD7]">
                              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                                Key Leadership Mandate:
                              </span>
                              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {tier1Leader.assigned_tasks.map((task, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 rounded-lg bg-white border border-[#E2DFD7] text-[#0F172A] text-xs font-medium"
                                  >
                                    {task}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Contact & LinkedIn */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                          {tier1Leader.email && (
                            <a
                              href={`mailto:${tier1Leader.email}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-[#F1EFEA] text-[#0F172A] border border-[#E2DFD7] transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5 text-[#0F4C3A]" />
                              <span>{tier1Leader.email}</span>
                            </a>
                          )}
                          {tier1Leader.linkedin_url && (
                            <a
                              href={tier1Leader.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F4C3A] hover:bg-[#093528] text-white transition-colors"
                            >
                              <Linkedin className="w-3.5 h-3.5" />
                              <span>LinkedIn Profile</span>
                              <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </ScrollReveal>
            )}

            {/* Category Filter Pills for Functional Teams */}
            {categories.length > 2 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                      activeCategory === cat
                        ? 'bg-[#0F4C3A] text-white border-[#0F4C3A]'
                        : 'bg-[#F8F7F4] text-[#334155] border-[#E2DFD7] hover:bg-[#F1EFEA]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* TIER 2: PROJECT LEADS & TECHNICAL ARCHITECTS */}
            {tier2Leads.length > 0 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-1.5 bg-[#0F4C3A] rounded-full" />
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#0F172A] tracking-tight">
                    Project Leads &amp; Technical Architects
                  </h3>
                  <span className="text-xs text-[#64748B] font-semibold">
                    ({tier2Leads.length})
                  </span>
                </div>

                <div
                  className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${
                    tier2Leads.length === 2
                      ? 'lg:grid-cols-2'
                      : 'lg:grid-cols-3'
                  }`}
                >
                  {tier2Leads.map((member) => {
                    const tagStyle = getTagBadge(member.team_tag);
                    return (
                      <div
                        key={member.id}
                        className="bg-[#F8F7F4] rounded-2xl border border-[#E2DFD7] p-6 shadow-2xs hover:shadow-md hover:border-[#0F4C3A]/40 transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3.5">
                          <div className="flex items-start gap-4">
                            <div className="relative w-24 h-24 aspect-square rounded-full overflow-hidden bg-[#0F172A] shrink-0 border border-[#E2DFD7]">
                              {member.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={member.avatar_url}
                                  alt={member.full_name}
                                  loading="lazy"
                                  decoding="async"
                                  className="block h-full w-full object-cover object-[center_30%] rounded-full"
                                />
                              ) : (
                                <div className="w-full h-full rounded-full bg-[#0F172A] flex items-center justify-center text-white font-bold text-lg">
                                  {member.full_name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-extrabold text-[#0F172A] text-base truncate">
                                {member.full_name}
                              </h4>
                              <p className="text-xs font-semibold text-[#0F4C3A] leading-snug mt-0.5 line-clamp-2">
                                {member.designation}
                              </p>
                              <span
                                className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tagStyle.bg}`}
                              >
                                {tagStyle.label}
                              </span>
                            </div>
                          </div>

                          {member.bio && (
                            <p className="text-xs sm:text-sm text-[#334155] line-clamp-3 leading-relaxed">
                              {member.bio}
                            </p>
                          )}

                          {member.assigned_tasks &&
                            member.assigned_tasks.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {member.assigned_tasks.map((task, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-0.5 rounded-md bg-white border border-[#E2DFD7] text-[#334155] text-[11px] font-medium"
                                  >
                                    {task}
                                  </span>
                                ))}
                              </div>
                            )}
                        </div>

                        <div className="pt-3 border-t border-[#E2DFD7] flex items-center justify-between text-xs">
                          {member.email ? (
                            <a
                              href={`mailto:${member.email}`}
                              className="text-[#64748B] hover:text-[#0F4C3A] font-mono text-[11px] truncate flex items-center gap-1.5"
                              title={member.email}
                            >
                              <Mail className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{member.email}</span>
                            </a>
                          ) : (
                            <div />
                          )}

                          {member.linkedin_url && (
                            <a
                              href={member.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-[#0F4C3A] hover:bg-[#E6F0EC] transition-colors shrink-0"
                              title="LinkedIn Profile"
                              aria-label={`${member.full_name} LinkedIn Profile`}
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

            {/* TIER 3: FMS SDG AMBASSADORS & FUNCTIONAL TEAMS */}
            {tier3Members.length > 0 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-1.5 bg-[#C88A2B] rounded-full" />
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#0F172A] tracking-tight">
                    FMS SDG Ambassadors &amp; Functional Teams
                  </h3>
                  <span className="text-xs text-[#64748B] font-semibold">
                    ({tier3Members.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tier3Members.map((member) => {
                    const tagStyle = getTagBadge(member.team_tag);
                    return (
                      <div
                        key={member.id}
                        className="bg-[#F8F7F4] rounded-2xl border border-[#E2DFD7] p-6 shadow-2xs hover:shadow-md hover:border-[#0F4C3A]/40 transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 aspect-square rounded-full overflow-hidden bg-[#0F172A] shrink-0 border border-[#E2DFD7]">
                              {member.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={member.avatar_url}
                                  alt={member.full_name}
                                  loading="lazy"
                                  decoding="async"
                                  className="block h-full w-full object-cover object-[center_30%] rounded-full"
                                />
                              ) : (
                                <div className="w-full h-full rounded-full bg-[#0F172A] flex items-center justify-center text-white font-bold text-base">
                                  {member.full_name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-[#0F172A] text-base truncate">
                                {member.full_name}
                              </h4>
                              <p className="text-xs text-[#64748B] line-clamp-2 mt-0.5">
                                {member.designation}
                              </p>
                              <span
                                className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tagStyle.bg}`}
                              >
                                {tagStyle.label}
                              </span>
                            </div>
                          </div>

                          {member.bio && (
                            <p className="text-xs text-[#334155] line-clamp-2 leading-relaxed">
                              {member.bio}
                            </p>
                          )}

                          {member.assigned_tasks &&
                            member.assigned_tasks.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {member.assigned_tasks.slice(0, 2).map((task, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-white border border-[#E2DFD7] text-[#334155] text-[10px] font-medium"
                                  >
                                    {task}
                                  </span>
                                ))}
                              </div>
                            )}
                        </div>

                        <div className="pt-3 border-t border-[#E2DFD7] flex items-center justify-between text-xs">
                          {member.email ? (
                            <a
                              href={`mailto:${member.email}`}
                              className="text-[#64748B] hover:text-[#0F4C3A] text-[11px] font-mono truncate"
                              title={member.email}
                            >
                              {member.email.split('@')[0]}
                            </a>
                          ) : (
                            <div />
                          )}

                          {member.linkedin_url && (
                            <a
                              href={member.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0F4C3A] hover:text-[#093528]"
                              aria-label={`${member.full_name} LinkedIn Profile`}
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

            {team.length === 0 && (
              <div className="text-center py-14 bg-[#F8F7F4] rounded-2xl border border-[#E2DFD7] p-8 space-y-3">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-[#0F172A] text-sm">
                  Team Roster Synchronizing
                </h4>
                <p className="text-xs text-[#64748B] max-w-md mx-auto">
                  Administrators and delegated managers can configure public ambassador profiles from the Leadership Dashboard.
                </p>
                <div className="pt-2">
                  <Link
                    href="/dashboard?tab=team"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F4C3A] text-white hover:bg-[#093528] transition-colors"
                  >
                    <span>Manage Team in Dashboard</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

