import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const SETTING_KEY = 'certificate_issuance';

/**
 * GET /api/admin/certificate-toggle
 * Returns the current issuance ON/OFF state.
 * Anyone authenticated or guest can read it (portal UI needs it).
 */
export async function GET() {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('system_settings')
      .select('value, updated_at')
      .eq('key', SETTING_KEY)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const value = data?.value ?? {};
    return NextResponse.json({
      success: true,
      issuance_enabled: value.issuance_enabled !== false, // default true
      closed_message: value.closed_message ?? 'The evaluation and certification window for this phase has now closed. Thank you for your participation.',
      updated_at: data?.updated_at ?? value.updated_at ?? null,
      updated_by: value.updated_by ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/certificate-toggle
 * Toggles or sets the issuance window. Admin-only.
 * Body: { issuance_enabled: boolean, closed_message?: string }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const userEmail = (user.email || '').trim().toLowerCase();

    // 2. Multi-tier Admin Verification Guard
    let isAuthorizedAdmin = 
      userEmail === 'ai.bridge.iiui.fms@gmail.com';

    if (!isAuthorizedAdmin) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role === 'admin') {
        isAuthorizedAdmin = true;
      }
    }

    if (!isAuthorizedAdmin) {
      const { data: white } = await adminClient
        .from('role_whitelist')
        .select('target_role')
        .eq('email', userEmail)
        .maybeSingle();

      if (white && (white.target_role === 'admin' || white.target_role === 'team-member')) {
        isAuthorizedAdmin = true;
      }
    }

    if (!isAuthorizedAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Only administrators can toggle certificate issuance.' },
        { status: 403 }
      );
    }

    // 3. Parse body
    const body = await req.json();
    const { issuance_enabled, closed_message } = body;

    if (typeof issuance_enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: '"issuance_enabled" must be true or false.' },
        { status: 400 }
      );
    }

    // 4. Read current value so we don't overwrite other fields
    const { data: existing } = await adminClient
      .from('system_settings')
      .select('value')
      .eq('key', SETTING_KEY)
      .maybeSingle();

    const currentValue = existing?.value ?? {};

    const newValue = {
      ...currentValue,
      issuance_enabled,
      closed_message: closed_message?.trim() ||
        currentValue.closed_message ||
        'The evaluation and certification window for this phase has now closed. Thank you for your participation.',
      updated_by: userEmail,
      updated_at: new Date().toISOString(),
    };

    // 5. Upsert into system_settings
    const { error: upsertErr } = await adminClient
      .from('system_settings')
      .upsert(
        { key: SETTING_KEY, value: newValue, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (upsertErr) {
      return NextResponse.json({ success: false, error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      issuance_enabled,
      message: issuance_enabled
        ? '✅ Certificate issuance is now OPEN. New students can generate certificates.'
        : '🔒 Certificate issuance is now CLOSED. Existing certificates still work.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
