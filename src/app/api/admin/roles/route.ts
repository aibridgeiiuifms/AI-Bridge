import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAmbassadorPortalAccess } from '@/lib/ambassador-access';

/**
 * Administrative API endpoint for Dynamic Task Assignment & Delegated Team Management
 * Superadmin: ai.bridge.iiui.fms@gmail.com (M. Tayyab, App Development Team Lead)
 */
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

    // 2. Fetch Whitelist entries
    const { data: whitelist } = await supabase
      .from('role_whitelist')
      .select('*')
      .order('created_at', { ascending: false });

    // 3. Fetch Registered Profiles with their member_permissions
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*, member_permissions(*)')
      .order('created_at', { ascending: false });

    // 4. Fetch Real Metrics from Database
    // 4. Fetch Real Metrics from Database (student_surveys + teacher_surveys with fallback to surveys)
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

    let preSurveysCount = (studentPreCount || 0) + (teacherPreCount || 0);
    if (preSurveysCount === 0) {
      const { count: legacyPreCount } = await supabase
        .from('surveys')
        .select('*', { count: 'exact', head: true })
        .eq('survey_type', 'pre');
      preSurveysCount = legacyPreCount || 0;
    }

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
    } else {
      // Fallback to legacy surveys table
      const { data: surveyHours } = await supabase
        .from('surveys')
        .select('hours_saved_estimate')
        .not('hours_saved_estimate', 'is', null);

      if (surveyHours && surveyHours.length > 0) {
        const totalHours = surveyHours.reduce((acc, curr) => acc + (Number(curr.hours_saved_estimate) || 0), 0);
        avgHours = parseFloat((totalHours / surveyHours.length).toFixed(1));
      }
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
      whitelist: whitelist || [],
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

      const { title, description = '', tag = 'General' } = body;
      if (!title || !title.trim()) {
        return NextResponse.json({ success: false, error: 'Task title is required' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('campaign_tasks')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          tag: (tag || 'General').trim()
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, task: data });
    }

    // Action B: Add/Whitelist Team Member
    const {
      email, 
      target_role = 'member', 
      assigned_tasks = [], 
      full_name = '', 
      notes = ''
    } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Only admins may grant admin roles; member invitations always remain members.
    const finalRole = access.role === 'admin' ? target_role : 'member';
    if (access.role !== 'admin' && !access.canManageTeam) {
      return NextResponse.json({ success: false, error: 'Team management access is required.' }, { status: 403 });
    }

    // Upsert in role_whitelist
    const { data, error } = await supabase
      .from('role_whitelist')
      .upsert(
        {
          email: normalizedEmail,
          target_role: finalRole,
          assigned_tasks: Array.isArray(assigned_tasks) ? assigned_tasks : [],
          full_name: full_name || null,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Also sync assigned_tasks to existing profile if user already registered
    await supabase
      .from('profiles')
      .update({
        role: finalRole,
        assigned_tasks: Array.isArray(assigned_tasks) ? assigned_tasks : [],
        updated_at: new Date().toISOString(),
      })
      .eq('email', normalizedEmail);

    return NextResponse.json({
      success: true,
      message: `User ${normalizedEmail} successfully configured as ${finalRole} with assigned tasks.`,
      entry: data,
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
      await supabase
        .from('role_whitelist')
        .update({
          assigned_tasks: Array.isArray(assigned_tasks) ? assigned_tasks : [],
          updated_at: new Date().toISOString()
        })
        .eq('email', normalizedEmail);

      await supabase
        .from('profiles')
        .update({
          assigned_tasks: Array.isArray(assigned_tasks) ? assigned_tasks : [],
          updated_at: new Date().toISOString()
        })
        .eq('email', normalizedEmail);
    }

    // 2. Update Role if provided (Only allowed by Admin)
    if (userId && newRole && access.role === 'admin') {
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (roleError) {
        return NextResponse.json({ success: false, error: roleError.message }, { status: 400 });
      }
    }

    // 3. Update Member Permissions if provided
    if (permissions && (userId || email)) {
      if (access.role !== 'admin' && !access.canManageTeam) {
        return NextResponse.json({ success: false, error: 'Team management access is required.' }, { status: 403 });
      }

      const normalizedEmail = email ? email.trim().toLowerCase() : '';

      // Synchronize mcq_access_level with can_manage_mcqs
      if (permissions.mcq_access_level !== undefined) {
        const valid = ['none', 'viewer', 'moderator', 'manager'];
        const level = valid.includes(permissions.mcq_access_level) ? permissions.mcq_access_level : 'none';
        permissions.mcq_access_level = level;
        permissions.can_manage_mcqs = level === 'manager';

        // Persist to system_settings mcq_access_levels map for 100% resilience
        if (normalizedEmail) {
          try {
            const { data: existingLevels } = await supabase
              .from('system_settings')
              .select('value')
              .eq('key', 'mcq_access_levels')
              .maybeSingle();

            const map = (existingLevels?.value && typeof existingLevels.value === 'object')
              ? { ...existingLevels.value }
              : {};
            map[normalizedEmail] = level;

            await supabase
              .from('system_settings')
              .upsert({ key: 'mcq_access_levels', value: map, updated_at: new Date().toISOString() }, { onConflict: 'key' });
          } catch (err) {
            console.warn('Could not save mcq_access_levels to system_settings:', err);
          }
        }
      }

      let targetId = userId;
      if (!targetId && normalizedEmail) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', normalizedEmail)
          .maybeSingle();
        targetId = prof?.id;
      }

      if (targetId) {
        let { error: permError } = await supabase
          .from('member_permissions')
          .upsert({
            member_id: targetId,
            ...permissions,
            updated_at: new Date().toISOString(),
          });

        // Resilient retry if mcq_access_level column doesn't exist yet in member_permissions
        if (permError && permError.message?.includes('mcq_access_level')) {
          const { mcq_access_level, ...safePermissions } = permissions;
          const retry = await supabase
            .from('member_permissions')
            .upsert({
              member_id: targetId,
              ...safePermissions,
              updated_at: new Date().toISOString(),
            });
          permError = retry.error;
        }

        if (permError) {
          return NextResponse.json({ success: false, error: permError.message }, { status: 400 });
        }
      }

      // Also ensure can_manage_team and mcq_access_level are persisted to role_whitelist for this email
      if (normalizedEmail) {
        const wlUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
        if (permissions.can_manage_team !== undefined) {
          wlUpdates.can_manage_team = Boolean(permissions.can_manage_team);
        }
        if (permissions.mcq_access_level !== undefined) {
          wlUpdates.mcq_access_level = permissions.mcq_access_level;
        }

        let { error: wlErr } = await supabase
          .from('role_whitelist')
          .update(wlUpdates)
          .eq('email', normalizedEmail);

        if (wlErr && wlErr.message?.includes('mcq_access_level')) {
          delete wlUpdates.mcq_access_level;
          await supabase
            .from('role_whitelist')
            .update(wlUpdates)
            .eq('email', normalizedEmail);
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

    // Action B: Remove Member from Whitelist
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
        { success: false, error: 'Cannot remove primary super admin from whitelist.' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('role_whitelist')
      .delete()
      .eq('email', normalizedEmail);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Removed ${normalizedEmail} from whitelist. User role reset to student.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error deleting from whitelist' },
      { status: 500 }
    );
  }
}
