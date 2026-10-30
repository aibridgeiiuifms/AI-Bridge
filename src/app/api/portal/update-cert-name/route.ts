import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatCertificateName } from '@/lib/certificate/generator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to update your certificate name.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawNewName = typeof body.newName === 'string' ? body.newName.trim() : '';
    const rawReason = typeof body.reason === 'string' ? body.reason.trim() : '';

    if (!rawNewName || rawNewName.length < 2) {
      return NextResponse.json(
        { error: 'Please enter a valid formal name (at least 2 characters).' },
        { status: 400 }
      );
    }

    if (rawNewName.length > 80) {
      return NextResponse.json(
        { error: 'Name is too long (maximum 80 characters allowed).' },
        { status: 400 }
      );
    }

    // Name format check: only letters, spaces, hyphens, periods, and apostrophes
    const nameRegex = /^[a-zA-Z\s\.\-']+$/;
    if (!nameRegex.test(rawNewName)) {
      return NextResponse.json(
        { error: 'Official name should only contain letters, spaces, and valid punctuation (. - \'). Numbers and symbols are not permitted.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Fetch existing certificate for this student
    const { data: cert, error: fetchErr } = await adminClient
      .from('certificates')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchErr) {
      console.error('Error fetching certificate for name update:', fetchErr);
      return NextResponse.json(
        { error: 'Database error fetching certificate record.' },
        { status: 500 }
      );
    }

    if (!cert) {
      return NextResponse.json(
        { error: 'No certificate found. You can update your name after completing all 3 certification steps.' },
        { status: 404 }
      );
    }

    // Strict 1-Time Rule: If already used, reject immediately
    if (cert.name_change_used) {
      return NextResponse.json(
        {
          error: 'Strict Policy: 1-time name correction has already been used for this certificate. If you need further assistance, please contact the admin team via WhatsApp or email.',
          alreadyUsed: true,
          changedAt: cert.name_changed_at,
        },
        { status: 403 }
      );
    }

    const currentName = cert.recipient_name || '';
    const formattedNewName = formatCertificateName(rawNewName);

    if (formattedNewName.toLowerCase() === currentName.toLowerCase()) {
      return NextResponse.json(
        { error: 'The new name entered is identical to the current certificate name.' },
        { status: 400 }
      );
    }

    const cleanReason = rawReason.slice(0, 300) || 'Self-service correction via student portal';
    const nowIso = new Date().toISOString();

    // 1. Update public.certificates with audit trail and lock (recipient_name column only)
    const { data: updatedCert, error: updateCertErr } = await adminClient
      .from('certificates')
      .update({
        old_name: currentName,
        recipient_name: formattedNewName,
        name_change_used: true,
        name_changed_at: nowIso,
        name_change_reason: cleanReason,
      })
      .eq('id', cert.id)
      .select()
      .single();

    if (updateCertErr) {
      console.error('Error updating certificate recipient name:', updateCertErr);
      return NextResponse.json(
        { error: 'Failed to update certificate name: ' + updateCertErr.message },
        { status: 500 }
      );
    }

    // 2. Opportunistically keep public.profiles in sync
    await adminClient
      .from('profiles')
      .update({ full_name: formattedNewName })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      message: 'Certificate recipient name successfully updated.',
      certificate: updatedCert,
      oldName: currentName,
      newName: formattedNewName,
    });
  } catch (err: any) {
    console.error('Unexpected error in update-cert-name route:', err);
    return NextResponse.json(
      { error: 'Internal server error: ' + (err.message || 'Unknown') },
      { status: 500 }
    );
  }
}
