import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAmbassadorPortalAccess } from '@/lib/ambassador-access';

/**
 * Team Management API
 * Accessible to public for GET, and Superadmin / Delegated Team Managers for mutations.
 * Backed by the consolidated `members` table (roster + invite role + permissions).
 */

export const revalidate = 300; // Cache team data for 5 minutes

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const includeUnpublished = searchParams.get('all') === 'true';

    let query = supabase
      .from('members')
      .select('*')
      .order('position_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (!includeUnpublished) {
      query = query
        .eq('is_published', true)
        .neq('email', 'ai.bridge.iiui.fms@gmail.com');
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist yet, return empty list gracefully
      return NextResponse.json({ success: true, team: [] });
    }

    return NextResponse.json(
      { success: true, team: data || [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error fetching team members' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const access = await requireAmbassadorPortalAccess();
  if (access instanceof NextResponse) return access;
  if (access.role !== 'admin' && !access.canManageTeam) {
    return NextResponse.json({ success: false, error: 'Team management access is required.' }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();
    const body = await req.json();

    const {
      email,
      full_name,
      team_role = 'team-member',
      designation,
      bio = '',
      avatar_url = null,
      position_order = 99,
      team_tag = 'General',
      assigned_tasks = [],
      linkedin_url = null,
      can_manage_team = false,
      mcq_access_level = 'none',
      is_published = true
    } = body;

    if (!full_name || !designation) {
      return NextResponse.json(
        { success: false, error: 'Full name and designation are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email ? email.trim().toLowerCase() : null;
    const isSuperAdminEmail = normalizedEmail === 'ai.bridge.iiui.fms@gmail.com';

    // Only admins may grant the admin team role. Super admin email is always admin.
    const finalTeamRole = isSuperAdminEmail
      ? 'admin'
      : (access.role === 'admin' && team_role === 'admin' ? 'admin' : 'team-member');

    const { data: created, error } = await supabase
      .from('members')
      .insert({
        email: normalizedEmail,
        full_name: full_name.trim(),
        team_role: finalTeamRole,
        designation: designation.trim(),
        bio: bio?.trim() || null,
        avatar_url: avatar_url || null,
        position_order: Number(position_order) || 99,
        team_tag,
        assigned_tasks: Array.isArray(assigned_tasks) ? assigned_tasks : [],
        linkedin_url: linkedin_url?.trim() || null,
        can_manage_team: isSuperAdminEmail ? true : Boolean(can_manage_team),
        mcq_access_level: isSuperAdminEmail
          ? 'manager'
          : (['none', 'viewer', 'moderator', 'manager'].includes(mcq_access_level) ? mcq_access_level : 'none'),
        is_published: Boolean(is_published)
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Recompute the linked profile's role now that a members row exists.
    if (created?.email) {
      await syncRoleForEmail(supabase, created.email);
    }

    return NextResponse.json({ success: true, member: created });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error creating team member' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const access = await requireAmbassadorPortalAccess();
  if (access instanceof NextResponse) return access;
  if (access.role !== 'admin' && !access.canManageTeam) {
    return NextResponse.json({ success: false, error: 'Team management access is required.' }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Member ID is required' }, { status: 400 });
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.full_name !== undefined) updatePayload.full_name = updates.full_name.trim();
    if (updates.designation !== undefined) updatePayload.designation = updates.designation.trim();
    if (updates.bio !== undefined) updatePayload.bio = updates.bio.trim();
    if (updates.avatar_url !== undefined) updatePayload.avatar_url = updates.avatar_url;
    if (updates.position_order !== undefined) updatePayload.position_order = Number(updates.position_order);
    if (updates.team_tag !== undefined) updatePayload.team_tag = updates.team_tag;
    if (updates.assigned_tasks !== undefined) updatePayload.assigned_tasks = updates.assigned_tasks;
    if (updates.linkedin_url !== undefined) updatePayload.linkedin_url = updates.linkedin_url?.trim() || null;
    if (updates.is_published !== undefined) updatePayload.is_published = Boolean(updates.is_published);
    if (updates.email !== undefined) updatePayload.email = updates.email?.trim().toLowerCase() || null;
    if (updates.can_manage_team !== undefined) updatePayload.can_manage_team = Boolean(updates.can_manage_team);
    if (updates.mcq_access_level !== undefined) {
      updatePayload.mcq_access_level = ['none', 'viewer', 'moderator', 'manager'].includes(updates.mcq_access_level)
        ? updates.mcq_access_level
        : 'none';
    }
    // Only admins may change the invite/team role.
    if (updates.team_role !== undefined && access.role === 'admin') {
      updatePayload.team_role = updates.team_role === 'admin' ? 'admin' : 'team-member';
    }

    const { data, error } = await supabase
      .from('members')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Keep the linked profile role in sync (team_role / email changes).
    if (data?.email) {
      await syncRoleForEmail(supabase, data.email);
    }

    return NextResponse.json({ success: true, member: data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error updating team member' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const access = await requireAmbassadorPortalAccess();
  if (access instanceof NextResponse) return access;
  if (access.role !== 'admin' && !access.canManageTeam) {
    return NextResponse.json({ success: false, error: 'Team management access is required.' }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Member ID is required' }, { status: 400 });
    }

    // Remember the email so we can recompute the (now ex-) member's profile role.
    const { data: existing } = await supabase
      .from('members')
      .select('email')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Removing the members row drops the person back to student/teacher/guest.
    if (existing?.email) {
      await syncRoleForEmail(supabase, existing.email);
    }

    return NextResponse.json({ success: true, message: 'Member deleted successfully' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error deleting team member' },
      { status: 500 }
    );
  }
}

/** Recompute a profile's access role from its members row + survey forms. */
async function syncRoleForEmail(supabase: ReturnType<typeof createAdminClient>, email: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (profile?.id) {
      await supabase.rpc('sync_user_role', { p_user_id: profile.id });
    }
  } catch (err) {
    console.error('Error syncing user role:', err);
  }
}
