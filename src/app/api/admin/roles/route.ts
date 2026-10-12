import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Administrative API endpoint for Dynamic Task Assignment & Delegated Team Management
 * Superadmin: ai.bridge.iiui.fms@gmail.com (M. Tayyab, App Development Team Lead)
 */
export async function GET(req: NextRequest) {
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
    const { count: totalProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: preSurveysCount } = await supabase
      .from('surveys')
      .select('*', { count: 'exact', head: true })
      .eq('survey_type', 'pre');

    const { count: passedQuizzesCount } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('passed', true);

    const { count: certificatesCount } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true });

    const { data: surveyHours } = await supabase
      .from('surveys')
      .select('hours_saved_estimate')
      .not('hours_saved_estimate', 'is', null);

    let avgHours = 0;
    if (surveyHours && surveyHours.length > 0) {
      const totalHours = surveyHours.reduce((acc, curr) => acc + (Number(curr.hours_saved_estimate) || 0), 0);
      avgHours = parseFloat((totalHours / surveyHours.length).toFixed(1));
    }

    return NextResponse.json({
      success: true,
      tasks: tasks || [],
      whitelist: whitelist || [],
      profiles: profiles || [],
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
  try {
    const body = await req.json();
    const supabase = createAdminClient();

    // Action A: Create New Campaign Task
    if (body.type === 'create_task') {
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
      notes = '',
      isRequesterAdmin = false
    } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Security Rule: If requester is NOT admin (e.g. delegated member), enforce role = 'member'
    const finalRole = isRequesterAdmin ? target_role : 'member';

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
  try {
    const body = await req.json();
    const { email, userId, newRole, assigned_tasks, permissions, isRequesterAdmin = false } = body;
    const supabase = createAdminClient();

    // 1. Update Assigned Tasks for a Member
    if (email && assigned_tasks !== undefined) {
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
    if (userId && newRole && isRequesterAdmin) {
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
      let targetId = userId;
      if (!targetId && email) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();
        targetId = prof?.id;
      }

      if (targetId) {
        const { error: permError } = await supabase
          .from('member_permissions')
          .upsert({
            member_id: targetId,
            ...permissions,
            updated_at: new Date().toISOString(),
          });

        if (permError) {
          return NextResponse.json({ success: false, error: permError.message }, { status: 400 });
        }
      }

      // Also ensure can_manage_team is persisted to role_whitelist for this email
      if (email && permissions.can_manage_team !== undefined) {
        await supabase
          .from('role_whitelist')
          .update({
            can_manage_team: Boolean(permissions.can_manage_team),
            updated_at: new Date().toISOString()
          })
          .eq('email', email.trim().toLowerCase());
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
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const supabase = createAdminClient();

    // Action A: Delete Task from Master Task Pool
    if (action === 'delete_task') {
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
