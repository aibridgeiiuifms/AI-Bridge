'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Linkedin, UserRound } from 'lucide-react';

interface TeamProfile {
  profile_slug: string;
  full_name: string;
  designation: string | null;
  bio: string | null;
  avatar_url: string | null;
  team_tag: string | null;
  linkedin_url: string | null;
}

export default function TeamMemberProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [profile, setProfile] = useState<TeamProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/team/profile?slug=${encodeURIComponent(slug)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load this profile.');
        if (active) setProfile(result.profile);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load this profile.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const initials = profile?.full_name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-[#F7F5E9] px-4 py-10 sm:px-6 sm:py-16">
      <article className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-950/10">
        <div className="h-2 bg-gradient-to-r from-emerald-700 via-teal-500 to-amber-400" />
        {loading ? (
          <div className="p-10 text-center text-sm font-semibold text-slate-500">Loading team profile…</div>
        ) : error || !profile ? (
          <div className="space-y-5 p-8 text-center sm:p-12">
            <UserRound className="mx-auto h-10 w-10 text-slate-400" />
            <h1 className="text-2xl font-black text-slate-900">Profile unavailable</h1>
            <p className="text-sm text-slate-600">{error || `No published profile found for ${slug}.`}</p>
            <Link href="/team" className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-900">
              <ArrowLeft className="h-4 w-4" /> View the team
            </Link>
          </div>
        ) : (
          <div className="p-6 sm:p-10">
            <Link href="/team" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950">
              <ArrowLeft className="h-4 w-4" /> AI Bridge team
            </Link>
            <div className="mt-8 flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
              <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-emerald-100 bg-emerald-950 text-3xl font-black text-white shadow-lg">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.full_name} fill sizes="128px" className="object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                  {profile.team_tag || 'AI Bridge team'}
                </span>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{profile.full_name}</h1>
                {profile.designation && <p className="mt-2 text-sm font-bold text-emerald-800 sm:text-base">{profile.designation}</p>}
                {profile.bio && <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">{profile.bio}</p>}
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-800 hover:bg-blue-100"
                  >
                    <Linkedin className="h-4 w-4" /> LinkedIn <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
