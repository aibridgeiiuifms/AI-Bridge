import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAmbassadorPortalAccess } from '@/lib/ambassador-access';

/**
 * Team Management API
 * Accessible to public for GET, and Superadmin / Delegated Team Managers for mutations.
 */

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const includeUnpublished = searchParams.get('all') === 'true';

    let query = supabase
      .from('team_members')
      .select('*')
      .order('position_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (!includeUnpublished) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist yet, return empty list gracefully
      return NextResponse.json({ success: true, team: [] });
    }

    return NextResponse.json({ success: true, team: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error fetching team members' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const accessDenied = await requireAmbassadorPortalAccess();
  if (accessDenied) return accessDenied;

  try {
    const supabase = createAdminClient();
    const body = await req.json();

    // ACTION: 1-Click Sync / Import from Whitelist (Zero Redundancy)
    if (body.action === 'sync_from_whitelist') {
      const { data: whitelist, error: wlError } = await supabase
        .from('role_whitelist')
        .select('*');

      if (wlError) {
        return NextResponse.json({ success: false, error: wlError.message }, { status: 400 });
      }

      const { data: existingMembers } = await supabase
        .from('team_members')
        .select('email, position_order');

      const existingEmails = new Set((existingMembers || []).map((m: any) => m.email?.toLowerCase()));
      let nextPosition = Math.max(0, ...(existingMembers || []).map((m: any) => m.position_order || 0)) + 1;

      const toInsert: any[] = [];

      (whitelist || []).forEach((w: any) => {
        const emailLower = (w.email || '').trim().toLowerCase();
        if (!existingEmails.has(emailLower)) {
          // Dynamic values directly from whitelist entry without hardcoded text
          const designation = w.notes || (w.target_role === 'admin' ? 'Project Lead / Administrator' : 'SDG Ambassador');
          const teamTag = w.team_tag || (w.assigned_tasks?.[0] ? w.assigned_tasks[0] : 'General');

          toInsert.push({
            email: emailLower,
            full_name: w.full_name || emailLower.split('@')[0],
            designation,
            bio: w.notes || '',
            position_order: nextPosition++,
            team_tag: teamTag,
            assigned_tasks: w.assigned_tasks || [],
            is_published: true,
          });
        }
      });

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('team_members')
          .insert(toInsert);

        if (insertError) {
          return NextResponse.json({ success: false, error: insertError.message }, { status: 400 });
        }
      }

      // Return refreshed roster
      const { data: updated } = await supabase
        .from('team_members')
        .select('*')
        .order('position_order', { ascending: true });

      return NextResponse.json({
        success: true,
        message: `Successfully synchronized ${toInsert.length} new members from whitelist!`,
        team: updated || []
      });
    }

    // ACTION: Create / Add New Custom Member
    const {
      email,
      full_name,
      designation,
      bio = '',
      avatar_url = null,
      position_order = 99,
      team_tag = 'general',
      assigned_tasks = [],
      linkedin_url = null,
      is_published = true
    } = body;

    if (!full_name || !designation) {
      return NextResponse.json(
        { success: false, error: 'Full name and designation are required' },
        { status: 400 }
      );
    }

    const { data: created, error } = await supabase
      .from('team_members')
      .insert({
        email: email ? email.trim().toLowerCase() : null,
        full_name: full_name.trim(),
        designation: designation.trim(),
        bio: bio?.trim() || null,
        avatar_url: avatar_url || null,
        position_order: Number(position_order) || 99,
        team_tag,
        assigned_tasks: Array.isArray(assigned_tasks) ? assigned_tasks : [],
        linkedin_url: linkedin_url?.trim() || null,
        is_published: Boolean(is_published)
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
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
  const accessDenied = await requireAmbassadorPortalAccess();
  if (accessDenied) return accessDenied;

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

    const { data, error } = await supabase
      .from('team_members')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
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
  const accessDenied = await requireAmbassadorPortalAccess();
  if (accessDenied) return accessDenied;

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Member ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Member deleted successfully' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error deleting team member' },
      { status: 500 }
    );
  }
}
