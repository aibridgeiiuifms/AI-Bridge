import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerSupabase } from '@/lib/supabase/server';

/**
 * Checks whether the current user is an admin or has been granted analytics view permissions.
 */
async function verifyAnalyticsViewer() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { authorized: false, isSuperAdmin: false, user: null };
  }

  const emailLower = user.email.toLowerCase();
  const isSuperAdmin = emailLower === 'ai.bridge.iiui.fms@gmail.com';

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = isSuperAdmin || profile?.role === 'admin';

  if (isAdmin) {
    return { authorized: true, isAdmin: true, isSuperAdmin, user };
  }

  // Check analytics_access_control table
  const adminClient = createAdminClient();
  const { data: access } = await adminClient
    .from('analytics_access_control')
    .select('can_view_analytics')
    .eq('member_id', user.id)
    .maybeSingle();

  if (access?.can_view_analytics) {
    return { authorized: true, isAdmin: false, isSuperAdmin: false, user };
  }

  return { authorized: false, isAdmin: false, isSuperAdmin: false, user };
}

export async function GET(req: NextRequest) {
  try {
    const authCheck = await verifyAnalyticsViewer();
    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Unauthorized to view analytics' }, { status: 403 });
    }

    const admin = createAdminClient();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Total & Time-bound Page Views
    const { count: totalPageViews } = await admin
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', 'page_view');

    const { count: views7d } = await admin
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', 'page_view')
      .gte('created_at', sevenDaysAgo);

    const { count: views30d } = await admin
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', 'page_view')
      .gte('created_at', thirtyDaysAgo);

    // 2. Total Likes across all gallery events
    const { count: totalLikes } = await admin
      .from('event_likes')
      .select('id', { count: 'exact', head: true });

    // 3. Recent 50 events for Live Activity Feed
    const { data: recentEvents } = await admin
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // 4. Sample latest events for aggregation
    const { data: sampleEvents } = await admin
      .from('analytics_events')
      .select('event_name, page_path, session_id, user_id, user_role, device_type, browser, country, properties, created_at')
      .order('created_at', { ascending: false })
      .limit(3000);

    // Aggregate statistics in memory
    const pageCounts: Record<string, number> = {};
    const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    const browserCounts: Record<string, number> = {};
    const countryCounts: Record<string, number> = {};
    const uniqueSessions = new Set<string>();
    const folderViewCounts: Record<string, number> = {};
    const folderDurations: Record<string, { total: number; count: number }> = {};
    let authViews = 0;
    let guestViews = 0;

    // Funnel counters
    let funnelPreStarted = 0;
    let funnelPreSubmitted = 0;
    let funnelQuizStarted = 0;
    let funnelQuizCompleted = 0;
    let funnelPostSubmitted = 0;
    let funnelCertDownloaded = 0;

    if (sampleEvents) {
      for (const ev of sampleEvents) {
        if (ev.session_id) uniqueSessions.add(ev.session_id);

        if (ev.event_name === 'page_view') {
          pageCounts[ev.page_path] = (pageCounts[ev.page_path] || 0) + 1;
          if (ev.user_id) authViews++;
          else guestViews++;
        }

        if (ev.device_type) {
          deviceCounts[ev.device_type] = (deviceCounts[ev.device_type] || 0) + 1;
        }

        if (ev.browser) {
          browserCounts[ev.browser] = (browserCounts[ev.browser] || 0) + 1;
        }

        if (ev.country) {
          countryCounts[ev.country] = (countryCounts[ev.country] || 0) + 1;
        }

        // Folder views and duration
        if (ev.event_name === 'event_folder_opened' && ev.properties?.folder_slug) {
          const slug = String(ev.properties.folder_slug);
          folderViewCounts[slug] = (folderViewCounts[slug] || 0) + 1;
        }

        if (ev.event_name === 'event_time_on_page' && ev.properties?.folder_slug && ev.properties?.duration_seconds) {
          const slug = String(ev.properties.folder_slug);
          const dur = Number(ev.properties.duration_seconds) || 0;
          if (!folderDurations[slug]) folderDurations[slug] = { total: 0, count: 0 };
          folderDurations[slug].total += dur;
          folderDurations[slug].count += 1;
        }

        // Funnel triggers
        if (ev.event_name === 'survey_started' && ev.properties?.survey_type === 'pre') funnelPreStarted++;
        if (ev.event_name === 'survey_submitted' && ev.properties?.survey_type === 'pre') funnelPreSubmitted++;
        if (ev.event_name === 'quiz_started') funnelQuizStarted++;
        if (ev.event_name === 'quiz_completed') funnelQuizCompleted++;
        if (ev.event_name === 'survey_submitted' && ev.properties?.survey_type === 'post') funnelPostSubmitted++;
        if (ev.event_name === 'certificate_downloaded') funnelCertDownloaded++;
      }
    }

    // Top pages list
    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top countries list
    const topCountries = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 5. Most Liked Events (Join with gallery_events)
    const { data: topLikedEvents } = await admin
      .from('gallery_events')
      .select('id, title, slug, folder_id, gallery_folders(title, slug), event_likes(count)')
      .order('created_at', { ascending: false });

    const formattedLikes = (topLikedEvents || [])
      .map((ev: any) => ({
        id: ev.id,
        title: ev.title,
        slug: ev.slug,
        folderTitle: ev.gallery_folders?.title || 'Album',
        folderSlug: ev.gallery_folders?.slug || '',
        likeCount: Array.isArray(ev.event_likes) ? ev.event_likes[0]?.count || 0 : 0,
      }))
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, 10);

    // 6. Access Control Roster (Only if admin requesting)
    let teamAccessList: any[] = [];
    if (authCheck.isAdmin) {
      const { data: members } = await admin
        .from('members')
        .select('id, profile_id, full_name, email, team_role, designation, avatar_url')
        .order('position_order', { ascending: true });

      const { data: grantedAccess } = await admin
        .from('analytics_access_control')
        .select('*');

      const grantedMap = new Map((grantedAccess || []).map((g: any) => [g.member_id, g.can_view_analytics]));

      teamAccessList = (members || []).map((m) => ({
        ...m,
        can_view_analytics: m.profile_id ? Boolean(grantedMap.get(m.profile_id)) : false,
      }));
    }

    return NextResponse.json({
      success: true,
      isAdmin: authCheck.isAdmin,
      metrics: {
        totalPageViews: totalPageViews || 0,
        views7d: views7d || 0,
        views30d: views30d || 0,
        uniqueVisitors: uniqueSessions.size,
        authViews,
        guestViews,
        totalLikes: totalLikes || 0,
      },
      topPages,
      deviceCounts,
      browserCounts,
      topCountries,
      folderViewCounts,
      folderDurations,
      funnel: {
        preStarted: funnelPreStarted,
        preSubmitted: funnelPreSubmitted,
        quizStarted: funnelQuizStarted,
        quizCompleted: funnelQuizCompleted,
        postSubmitted: funnelPostSubmitted,
        certDownloaded: funnelCertDownloaded,
      },
      topLikedEvents: formattedLikes,
      recentEvents: recentEvents || [],
      teamAccessList,
    });
  } catch (err: any) {
    console.error('Analytics API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * Admin toggles analytics read access for team members.
 */
export async function PATCH(req: NextRequest) {
  try {
    const authCheck = await verifyAnalyticsViewer();
    if (!authCheck.authorized || !authCheck.isAdmin) {
      return NextResponse.json({ error: 'Only admins can modify analytics permissions' }, { status: 403 });
    }

    const { profileId, canViewAnalytics } = await req.json();
    if (!profileId) {
      return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('analytics_access_control')
      .upsert({
        member_id: profileId,
        can_view_analytics: Boolean(canViewAnalytics),
        granted_by: authCheck.user.id,
        granted_at: new Date().toISOString(),
      }, { onConflict: 'member_id' });

    if (error) throw error;

    return NextResponse.json({ success: true, profileId, canViewAnalytics });
  } catch (err: any) {
    console.error('Analytics access toggle error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update access' }, { status: 500 });
  }
}
