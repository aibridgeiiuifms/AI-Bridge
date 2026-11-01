import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { ANALYTICS_V2_CHARTS } from '@/lib/surveyAnalyticsV2Catalog';

async function checkAdmin(supabase: any, admin: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAuthorized: false, user: null, isAdmin: false };

  const isSuperAdmin = user.email?.toLowerCase() === 'ai.bridge.iiui.fms@gmail.com';
  if (isSuperAdmin) return { isAuthorized: true, user, isAdmin: true };

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = profile?.role === 'admin';
  return { isAuthorized: true, user, isAdmin };
}

// GET: returns members list with their granted chart permissions
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const admin = createAdminClient();
    const { isAuthorized, user, isAdmin } = await checkAdmin(supabase, admin);

    if (!isAuthorized || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If caller is non-admin team member, return their own allowed chart list
    if (!isAdmin) {
      const { data: perms } = await admin
        .from('member_chart_permissions')
        .select('chart_id, is_allowed')
        .eq('member_id', user.id);

      const allowedMap: Record<string, boolean> = {};
      ANALYTICS_V2_CHARTS.forEach(c => {
        allowedMap[c.id] = c.defaultVisible;
      });

      if (perms && perms.length > 0) {
        perms.forEach((p: any) => {
          allowedMap[p.chart_id] = p.is_allowed;
        });
      }

      return NextResponse.json({
        isAdmin: false,
        memberId: user.id,
        allowedCharts: allowedMap,
      });
    }

    // Admin view: get all team members + their specific chart permissions
    const { data: members } = await admin
      .from('profiles')
      .select('id, full_name, email, role, avatar_url')
      .in('role', ['admin', 'member'])
      .order('full_name');

    const { data: allPerms } = await admin
      .from('member_chart_permissions')
      .select('member_id, chart_id, is_allowed');

    const permsByMember: Record<string, Record<string, boolean>> = {};
    if (allPerms) {
      allPerms.forEach((p: any) => {
        if (!permsByMember[p.member_id]) permsByMember[p.member_id] = {};
        permsByMember[p.member_id][p.chart_id] = p.is_allowed;
      });
    }

    return NextResponse.json({
      isAdmin: true,
      charts: ANALYTICS_V2_CHARTS,
      members: (members || []).map(m => ({
        ...m,
        permissions: permsByMember[m.id] || {},
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Admin updates chart permissions for a member
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const admin = createAdminClient();
    const { isAdmin } = await checkAdmin(supabase, admin);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { member_id, permissions } = body;

    if (!member_id || typeof permissions !== 'object') {
      return NextResponse.json({ error: 'Invalid payload: member_id and permissions map required' }, { status: 400 });
    }

    const upsertRows = Object.entries(permissions).map(([chart_id, is_allowed]) => ({
      member_id,
      chart_id,
      is_allowed: Boolean(is_allowed),
      updated_at: new Date().toISOString(),
    }));

    if (upsertRows.length > 0) {
      const { error } = await admin
        .from('member_chart_permissions')
        .upsert(upsertRows, { onConflict: 'member_id,chart_id' });

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Permissions updated for member ${member_id}`,
      count: upsertRows.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
