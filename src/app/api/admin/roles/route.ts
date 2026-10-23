import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAmbassadorPortalAccess } from '@/lib/ambassador-access';

/**
 * Administrative API for the consolidated `members` table:
 * dynamic task assignment, team roles, and delegated permissions.
 * Superadmin: ai.bridge.iiui.fms@gmail.com
 */

const MCQ_LEVELS = ['none', 'viewer', 'moderator', 'manager'];

export async function GET(req: NextRequest) {
  const access = await requireAmbassadorPortalAccess();
  if (access instanceof NextResponse) return access;

  try {
    const supabase = createAdminClient();

    // 1. Fetch Dynamic Tasks
    const { data: tasks } = await supabase
      .from('campaign_tasks')
      .select('*')
      .order('created_at', { ascending: true });

    // 2. Fetch the team roster (single source of truth: members)
    const { data: members } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    // 3. Fetch registered profiles with their linked members row
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*, members(*)')
      .order('created_at', { ascending: false });

    // 4. Fetch Real Metrics from Database
    const { count: totalProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: studentPreCount } = await supabase
      .from('student_surveys')
      .select('*', { count: 'exact', head: true })
      .eq('survey_type', 'pre');

    const { count: teacherPreCount } = await supabase
      .from('teacher_surveys')
      .select('*', { count: 'exact', head: true })
      .eq('survey_type', 'pre');

    const preSurveysCount = (studentPreCount || 0) + (teacherPreCount || 0);

    const { count: passedQuizzesCount } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('passed', true);

    const { count: certificatesCount } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true });

    // Calculate hours saved from hours_saved_category across student & teacher surveys
    const { data: studentHours } = await supabase
      .from('student_surveys')
      .select('hours_saved_category')
      .not('hours_saved_category', 'is', null);

    const { data: teacherHours } = await supabase
      .from('teacher_surveys')
      .select('hours_saved_category')
      .not('hours_saved_category', 'is', null);

    const allHourEntries = [...(studentHours || []), ...(teacherHours || [])];
    let avgHours = 0;

    if (allHourEntries.length > 0) {
      const parseCatVal = (cat: string): number => {
        const c = String(cat || '').toLowerCase();
        if (c.includes('5+') || c.includes('5 - 10') || c.includes('more than 5')) return 6.0;
        if (c.includes('3 - 5') || c.includes('3-5')) return 4.0;
        if (c.includes('1 - 2') || c.includes('1-2')) return 1.5;
        if (c.includes('0') || c.includes('none') || c.includes('less than 1')) return 0.5;
        const num = parseFloat(c.replace(/[^0-9.]/g, ''));
        return isNaN(num) ? 3.0 : num;
      };

      const totalH = allHourEntries.reduce((acc, curr) => acc + parseCatVal(curr.hours_saved_category), 0);
      avgHours = parseFloat((totalH / allHourEntries.length).toFixed(1));
    }

    // 5. Fetch mcq_access_levels map from system_settings
    let mcqAccessLevels: Record<string, string> = {};
    try {
      const { data: levelsRow } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'mcq_access_levels')
        .maybeSingle();
      if (levelsRow?.value && typeof levelsRow.value === 'object') {
        mcqAccessLevels = levelsRow.value;
      }
    } catch {
      // Fallback silently
    }

    return NextResponse.json({
      success: true,
      tasks: tasks || [],
      members: members || [],
      profiles: profiles || [],
      mcq_access_levels: mcqAccessLevels,
      stats: {
        totalProfiles: totalProfiles || 0,
        preSurveysCount: preSurveysCount || 0,
        passedQuizzesCount: passedQuizzesCount || 0,
        certificatesCount: certificatesCount || 0,
        avgHoursSaved: avgHours > 0 ? `${avgHours} hrs` : '0.0 hrs'
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error fetching roles and tasks' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const access = await requireAmbassadorPortalAccess();
  if (access instanceof NextResponse) return access;

  try {
    const body = await req.json();
    const supabase = createAdminClient();

    // Action A: Create New Campaign Task
    if (body.type === 'create_task') {
      if (access.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Admin access is required.' }, { status: 403 });
      }

      const { title, description = '' } = body;
      if (!title || !title.trim()) {
        return NextResponse.json({ success: false, error: 'Task title is required' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('campaign_tasks')
        .insert({
          title: title.trim(),
          description: description.trim() || null
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, task: data });
    }

    // Action B: Add / configure a team member (creates the members row for a pre-registered person)
    const {
      email,
      team_role = 'team-member',
      assigned_tasks = [],
      full_name = '',
      notes = '',
      team_tag,
      can_manage_team = false,
      mcq_access_level = 'none'
    } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    if (access.role !== 'admin' && !access.canManageTeam) {
      return NextResponse.json({ success: false, error: 'Team management access is required.' }, { status: 403 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Only admins may grant the admin team role; everyone else is a team-member.
    const isSuperAdminEmail = normalizedEmail === 'ai.bridge.iiui.fms@gmail.com';
    const finalTeamRole = isSuperAdminEmail
      ? 'admin'
      : (access.role === 'admin' && team_role === 'admin' ? 'admin' : 'team-member');
    const finalMcqLevel = MCQ_LEVELS.includes(mcq_access_level) ? mcq_access_level : 'none';

    const { data: existingMember } = await supabase
      .from('members')
      .select('id, can_manage_team, mcq_access_level')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    const memberPayload: Record<string, any> = {
      email: normalizedEmail,
      full_name: full_name || normalizedEmail.split('@')[0],
      team_role: finalTeamRole,
      designation: notes || null,
      assigned_tasks: Array.isArray(assigned_tasks) ? assigned_tasks : [],
      updated_at: new Date().toISOString(),
    };

    // If super admin email, always preserve full management permissions
    if (isSuperAdminEmail) {
      memberPayload.can_manage_team = true;
      memberPayload.mcq_access_level = 'manager';
    } else {
      // Preserve existing permissions if not explicitly passed in the request body
      if (body.can_manage_team !== undefined) {
        memberPayload.can_manage_team = Boolean(body.can_manage_team);
      } else if (existingMember) {
        memberPayload.can_manage_team = Boolean(existingMember.can_manage_team);
      } else {
        memberPayload.can_manage_team = false;
      }

      if (body.mcq_access_level !== undefined) {
        memberPayload.mcq_access_level = finalMcqLevel;
      } else if (existingMember) {
        memberPayload.mcq_access_level = existingMember.mcq_access_level || 'none';
      } else {
        memberPayload.mcq_access_level = finalMcqLevel;
      }
    }

    // Team tag (public badge label) — editable by admins and delegated team managers.
    if (typeof team_tag === 'string' && team_tag.trim()) {
      memberPayload.team_tag = team_tag.trim();
    }

    let saved;
    if (existingMember) {
      const { data, error } = await supabase
        .from('members')
        .update(memberPayload)
        .eq('id', existingMember.id)
        .select()
        .single();
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      saved = data;
    } else {
      const { data, error } = await supabase
        .from('members')
        .insert({ ...memberPayload, is_published: false })
        .select()
        .single();
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      saved = data;
    }

    // Recompute the linked profile's access role.
    await syncRoleForEmail(supabase, normalizedEmail);

    return NextResponse.json({
      success: true,
      message: `User ${normalizedEmail} successfully configured as ${finalTeamRole} with assigned tasks.`,
      entry: saved,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error processing request' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const access = await requireAmbassadorPortalAccess();
  if (access instanceof NextResponse) return access;

  try {
    const body = await req.json();
    const { email, userId, newRole, assigned_tasks, permissions } = body;
    const supabase = createAdminClient();

    // 1. Update Assigned Tasks for a Member
    if (email && assigned_tasks !== undefined) {
      if (access.role !== 'admin' && !access.canManageTeam) {
        return NextResponse.json({ success: false, error: 'Team management access is required.' }, { status: 403 });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const { error: taskError } = await supabase
        .from('members')
        .update({
          assigned_tasks: Array.isArray(assigned_tasks) ? assigned_tasks : [],
          updated_at: new Date().toISOString()
        })
        .ilike('email', normalizedEmail);

      if (taskError) {
        return NextResponse.json({ success: false, error: taskError.message }, { status: 400 });
      }
    }

    // 2. Update the invite/team role (Admins only)
    if (userId && newRole && access.role === 'admin') {
      const finalTeamRole = newRole === 'admin' ? 'admin' : 'team-member';
      const { error: roleError } = await supabase
        .from('members')
        .update({ team_role: finalTeamRole, updated_at: new Date().toISOString() })
        .eq('profile_id', userId);

      if (roleError) {
        return NextResponse.json({ success: false, error: roleError.message }, { status: 400 });
      }
    }

    // 3. Update member permissions (Manage Team + MCQ authority)
    if (permissions && (userId || email)) {
      if (access.role !== 'admin' && !access.canManageTeam) {
        return NextResponse.json({ success: false, error: 'Team management access is required.' }, { status: 403 });
      }

      const normalizedEmail = email ? email.trim().toLowerCase() : '';
      const permUpdates: Record<string, any> = { updated_at: new Date().toISOString() };

      if (permissions.can_manage_team !== undefined) {
        permUpdates.can_manage_team = Boolean(permissions.can_manage_team);
      }
      if (permissions.mcq_access_level !== undefined) {
        permUpdates.mcq_access_level = MCQ_LEVELS.includes(permissions.mcq_access_level)
          ? permissions.mcq_access_level
          : 'none';
      }

      if (userId) {
        const { error: permError } = await supabase
          .from('members')
          .update(permUpdates)
          .eq('profile_id', userId);
        if (permError) {
          return NextResponse.json({ success: false, error: permError.message }, { status: 400 });
        }
      } else if (normalizedEmail) {
        const { error: permError } = await supabase
          .from('members')
          .update(permUpdates)
          .ilike('email', normalizedEmail);
        if (permError) {
          return NextResponse.json({ success: false, error: permError.message }, { status: 400 });
        }
      }

      // Persist the MCQ level to system_settings for resilience/back-compat.
      if (normalizedEmail && permUpdates.mcq_access_level !== undefined) {
        try {
          const { data: existingLevels } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'mcq_access_levels')
            .maybeSingle();

          const map = (existingLevels?.value && typeof existingLevels.value === 'object')
            ? { ...existingLevels.value }
            : {};
          map[normalizedEmail] = permUpdates.mcq_access_level;

          await supabase
            .from('system_settings')
            .upsert({ key: 'mcq_access_levels', value: map, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        } catch (err) {
          console.warn('Could not save mcq_access_levels to system_settings:', err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Updated successfully in Supabase.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error updating role' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const access = await requireAmbassadorPortalAccess();
  if (access instanceof NextResponse) return access;

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const supabase = createAdminClient();

    // Action A: Delete Task from Master Task Pool
    if (action === 'delete_task') {
      if (access.role !== 'admin' && !access.canManageTeam) {
        return NextResponse.json({ success: false, error: 'Team management access is required.' }, { status: 403 });
      }

      const taskId = searchParams.get('taskId');
      if (!taskId) {
        return NextResponse.json({ success: false, error: 'Task ID required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('campaign_tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Task deleted from campaign pool.' });
    }

    // Action B: Remove a member from the team roster
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email parameter is required' }, { status: 400 });
    }

    if (access.role !== 'admin' && !access.canManageTeam) {
      return NextResponse.json({ success: false, error: 'Team management access is required.' }, { status: 403 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Super Admin protection
    if (normalizedEmail === 'ai.bridge.iiui.fms@gmail.com') {
      return NextResponse.json(
        { success: false, error: 'Cannot remove primary super admin from the team.' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('members')
      .delete()
      .ilike('email', normalizedEmail);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Removing the members row drops the person back to student/teacher/guest.
    await syncRoleForEmail(supabase, normalizedEmail);

    return NextResponse.json({
      success: true,
      message: `Removed ${normalizedEmail} from the team.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error removing member' },
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
