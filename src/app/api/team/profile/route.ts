import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')?.trim().toLowerCase();
  if (!slug) {
    return NextResponse.json({ error: 'Profile slug is required.' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: member, error } = await admin
      .from('members')
      .select('profile_slug, full_name, designation, bio, avatar_url, team_tag, linkedin_url')
      .eq('profile_slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch public team profile:', error);
      return NextResponse.json({ error: 'Unable to load this team profile.' }, { status: 500 });
    }

    if (!member) {
      return NextResponse.json({ error: 'This profile is unavailable.' }, { status: 404 });
    }

    return NextResponse.json(
      { profile: member },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch (error) {
    console.error('Public team profile request failed:', error);
    return NextResponse.json({ error: 'Unable to load this team profile.' }, { status: 500 });
  }
}
