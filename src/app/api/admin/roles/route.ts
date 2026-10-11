import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Administrative API endpoint for Role & Whitelist Management
 * Superadmin: ai.bridge.iiui.fms@gmail.com (M. Tayyab, App Development Team Lead)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Fetch Whitelist entries directly from Supabase
    const { data: whitelist } = await supabase
      .from('role_whitelist')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch Registered Profiles with their member_permissions
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*, member_permissions(*)')
      .order('created_at', { ascending: false });

    // Fetch Real Metrics from Database
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
      { success: false, error: err.message || 'Internal error fetching roles' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, target_role = 'member', team_tag = 'general', full_name = '', notes = '' } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createAdminClient();

    // Insert or update in role_whitelist
    const { data, error } = await supabase
      .from('role_whitelist')
      .upsert(
        {
          email: normalizedEmail,
          target_role,
          team_tag,
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

    return NextResponse.json({
      success: true,
      message: `User ${normalizedEmail} successfully whitelisted as ${target_role}.`,
      entry: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error adding to whitelist' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, newRole, permissions } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Update Role if provided
    if (newRole) {
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (roleError) {
        return NextResponse.json({ success: false, error: roleError.message }, { status: 400 });
      }
    }

    // Update Member Permissions if provided
    if (permissions) {
      const { error: permError } = await supabase
        .from('member_permissions')
        .upsert({
          member_id: userId,
          ...permissions,
          updated_at: new Date().toISOString(),
        });

      if (permError) {
        return NextResponse.json({ success: false, error: permError.message }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Role and permissions successfully updated in Supabase.',
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

    const supabase = createAdminClient();

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
