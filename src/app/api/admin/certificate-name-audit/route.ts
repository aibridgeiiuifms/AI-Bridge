import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatCertificateName } from '@/lib/certificate/generator';

export const dynamic = 'force-dynamic';

type AdminAuthSuccess = { authorized: true; user: any; email: string; adminClient: ReturnType<typeof createAdminClient> };
type AdminAuthFailure = { authorized: false; error: string; status: number; adminClient?: never };
type AdminAuthResult = AdminAuthSuccess | AdminAuthFailure;

async function verifyAdminAccess(): Promise<AdminAuthResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }

  const email = user.email.trim().toLowerCase();
  const adminClient = createAdminClient();

  // Check admin whitelist or master admin email
  if (email === 'ai.bridge.iiui.fms@gmail.com') {
    return { authorized: true, user, email, adminClient };
  }

  const { data: white } = await adminClient
    .from('role_whitelist')
    .select('target_role')
    .eq('email', email)
    .maybeSingle();

  if (white && (white.target_role === 'admin' || white.target_role === 'team-member')) {
    return { authorized: true, user, email, adminClient };
  }

  // Profile check
  const { data: prof } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (prof && prof.role === 'admin') {
    return { authorized: true, user, email, adminClient };
  }

  return { authorized: false, error: 'Forbidden. Admin privileges required.', status: 403 };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { adminClient } = auth;

    // Fetch all certificates where name_change_used = true, or all certificates with audit info
    const { data: rows, error } = await adminClient
      .from('certificates')
      .select(`
        id,
        certificate_id,
        recipient_name,
        old_name,
        name_change_used,
        name_changed_at,
        name_change_reason,
        student_id,
        department,
        completion_date,
        created_at,
        user_id,
        profiles (
          id,
          email,
          full_name,
          role,
          student_id
        )
      `)
      .order('name_changed_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching certificate name audit logs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter to changed ones first, but also include count of total certificates
    const allCerts = rows || [];
    const changedCerts = allCerts.filter((c: any) => c.name_change_used === true);

    return NextResponse.json({
      success: true,
      totalCertificates: allCerts.length,
      totalNameChanges: changedCerts.length,
      changedCertificates: changedCerts.map((c: any) => ({
        id: c.id,
        certificateId: c.certificate_id,
        currentName: c.recipient_name,
        oldName: c.old_name || '(Initial Google Name)',
        nameChangedAt: c.name_changed_at,
        reason: c.name_change_reason || 'Self-service correction via student portal',
        department: c.department || 'Management Sciences (FMS)',
        rollNumber: c.student_id || c.profiles?.student_id || 'N/A',
        studentEmail: c.profiles?.email || 'N/A',
        userProfileName: c.profiles?.full_name || 'N/A',
        completionDate: c.completion_date,
      })),
      recentAll: allCerts.slice(0, 50).map((c: any) => ({
        id: c.id,
        certificateId: c.certificate_id,
        currentName: c.recipient_name,
        oldName: c.old_name,
        nameChangeUsed: Boolean(c.name_change_used),
        nameChangedAt: c.name_changed_at,
        reason: c.name_change_reason,
        department: c.department,
        studentEmail: c.profiles?.email || 'N/A',
      })),
    });
  } catch (err: any) {
    console.error('Error in certificate-name-audit GET:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { adminClient } = auth;
    const body = await req.json().catch(() => ({}));
    const { action, certificateId, newName, adminNote } = body;

    if (!certificateId) {
      return NextResponse.json({ error: 'Missing certificateId' }, { status: 400 });
    }

    // 1. Fetch certificate
    const { data: cert, error: fetchErr } = await adminClient
      .from('certificates')
      .select('*')
      .eq('certificate_id', certificateId)
      .maybeSingle();

    if (fetchErr || !cert) {
      return NextResponse.json({ error: 'Certificate not found: ' + certificateId }, { status: 404 });
    }

    // Action A: Reset 1-Time Lock (grants student another self-service edit chance)
    if (action === 'reset_lock') {
      const { data: updated, error: resetErr } = await adminClient
        .from('certificates')
        .update({
          name_change_used: false,
          name_change_reason: (cert.name_change_reason ? cert.name_change_reason + ' | ' : '') + `[Lock reset by admin ${auth.email} on ${new Date().toLocaleDateString()}]`,
        })
        .eq('id', cert.id)
        .select()
        .single();

      if (resetErr) {
        return NextResponse.json({ error: resetErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `1-time name correction lock reset successfully for Certificate ${certificateId}. Student can now update their name once more in the portal.`,
        certificate: updated,
      });
    }

    // Action B: Admin Direct Override Edit
    if (action === 'admin_override') {
      if (!newName || typeof newName !== 'string' || newName.trim().length < 2) {
        return NextResponse.json({ error: 'Please enter a valid formal name.' }, { status: 400 });
      }

      const formattedName = formatCertificateName(newName.trim());
      const nowIso = new Date().toISOString();
      const currentName = cert.recipient_name;

      const { data: updated, error: updateErr } = await adminClient
        .from('certificates')
        .update({
          old_name: currentName,
          recipient_name: formattedName,
          name_change_used: true,
          name_changed_at: nowIso,
          name_change_reason: adminNote?.trim() ? `[Admin Override: ${adminNote.trim()}]` : `[Direct update by admin ${auth.email}]`,
        })
        .eq('id', cert.id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // Sync profile if user_id exists
      if (cert.user_id) {
        await adminClient
          .from('profiles')
          .update({ full_name: formattedName })
          .eq('id', cert.user_id);
      }

      return NextResponse.json({
        success: true,
        message: `Certificate ${certificateId} recipient name directly updated to "${formattedName}".`,
        certificate: updated,
      });
    }

    return NextResponse.json({ error: 'Invalid action requested.' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in certificate-name-audit POST:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
