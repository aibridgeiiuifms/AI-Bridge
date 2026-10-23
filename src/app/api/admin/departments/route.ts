import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAmbassadorPortalAccess } from '@/lib/ambassador-access';

/**
 * Department & Faculty Mappings Management API
 * Allows the admin to view all extracted email codes (e.g. BSBA, BSIR, BSFTE),
 * see live student survey entry counts for each code, and edit/save
 * the Standard Department Name and Faculty Name.
 */
export async function GET() {
  const access = await requireAmbassadorPortalAccess();
  if (access instanceof NextResponse) return access;

  try {
    const supabase = createAdminClient();

    // 1. Try to fetch from RPC first for fast server-side aggregated counts
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_department_mapping_stats');

    if (!rpcError && rpcData) {
      return NextResponse.json({
        success: true,
        departments: rpcData,
      });
    }

    // 2. Fallback if RPC is not yet executed in Supabase:
    // Query department_mappings and compute student counts manually
    const { data: mappings, error: mapError } = await supabase
      .from('department_mappings')
      .select('*')
      .order('code', { ascending: true });

    if (mapError) {
      // If table doesn't exist yet, return helpful response
      return NextResponse.json({
        success: false,
        error: mapError.message,
        hint: 'Please ensure migration 008_department_mappings.sql is applied in your Supabase SQL editor.',
        departments: []
      }, { status: 200 });
    }

    // Query surveys count per dept_code from student_surveys (with fallback to legacy surveys)
    const { data: studentDeptCounts } = await supabase
      .from('student_surveys')
      .select('dept_code');

    const countsMap: Record<string, number> = {};
    if (studentDeptCounts && studentDeptCounts.length > 0) {
      for (const row of studentDeptCounts) {
        if (row.dept_code) {
          const c = row.dept_code.toUpperCase();
          countsMap[c] = (countsMap[c] || 0) + 1;
        }
      }
    }
    const { data: teacherDeptCounts } = await supabase
      .from('teacher_surveys')
      .select('dept_code');

    if (teacherDeptCounts) {
      for (const row of teacherDeptCounts) {
        if (row.dept_code) {
          const c = row.dept_code.toUpperCase();
          countsMap[c] = (countsMap[c] || 0) + 1;
        }
      }
    }

    const enriched = (mappings || []).map((m: any) => ({
      code: m.code,
      standard_dept_name: m.standard_dept_name,
      faculty_name: m.faculty_name,
      faculty_code: m.faculty_code || '',
      student_count: countsMap[m.code.toUpperCase()] || 0,
      updated_at: m.updated_at
    })).sort((a: any, b: any) => b.student_count - a.student_count || a.code.localeCompare(b.code));

    return NextResponse.json({
      success: true,
      departments: enriched,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const access = await requireAmbassadorPortalAccess();
  if (access instanceof NextResponse) return access;
  if (access.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access is required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { code, standard_dept_name, faculty_name, faculty_code = '' } = body;

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, error: 'Extracted program code is required (e.g. BSBA)' },
        { status: 400 }
      );
    }

    if (!standard_dept_name || !standard_dept_name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Standard Department Name is required' },
        { status: 400 }
      );
    }

    if (!faculty_name || !faculty_name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Faculty Name is required' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('department_mappings')
      .upsert({
        code: cleanCode,
        standard_dept_name: standard_dept_name.trim(),
        faculty_name: faculty_name.trim(),
        faculty_code: (faculty_code || '').trim().toUpperCase() || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully saved mapping for ${cleanCode} (${standard_dept_name})`,
      department: data
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update department mapping' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const access = await requireAmbassadorPortalAccess();
  if (access instanceof NextResponse) return access;
  if (access.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access is required.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ success: false, error: 'Code is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('department_mappings')
      .delete()
      .eq('code', code.trim().toUpperCase());

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Mapping for ${code} removed successfully.`
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete department mapping' },
      { status: 500 }
    );
  }
}
