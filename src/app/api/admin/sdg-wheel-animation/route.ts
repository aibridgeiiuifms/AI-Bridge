import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireAmbassadorPortalAccess } from '@/lib/ambassador-access';

export const dynamic = 'force-dynamic';

const SETTING_KEY = 'sdg_wheel_animation';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', SETTING_KEY)
      .maybeSingle();

    if (error) {
      console.error('Failed to load SDG wheel animation setting:', error);
      return NextResponse.json(
        { success: false, error: 'Could not load the SDG wheel animation setting.' },
        { status: 500 },
      );
    }

    const savedEnabled = data?.value?.enabled;
    const enabled = savedEnabled === true;

    return NextResponse.json({
      success: true,
      enabled,
      is_default: typeof savedEnabled !== 'boolean',
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('GET /api/admin/sdg-wheel-animation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Could not load the SDG wheel animation setting.' },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const access = await requireAmbassadorPortalAccess();
    if (access instanceof NextResponse) return access;

    if (access.role !== 'admin' && access.userEmail !== 'ai.bridge.iiui.fms@gmail.com') {
      return NextResponse.json(
        { success: false, error: 'Only administrators can change website display settings.' },
        { status: 403 },
      );
    }

    const body: unknown = await req.json();
    if (
      typeof body !== 'object'
      || body === null
      || !('enabled' in body)
      || typeof body.enabled !== 'boolean'
    ) {
      return NextResponse.json(
        { success: false, error: 'Choose whether SDG wheel animation is enabled.' },
        { status: 400 },
      );
    }

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('system_settings')
      .upsert(
        {
          key: SETTING_KEY,
          value: { enabled: body.enabled },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      );

    if (error) {
      console.error('Failed to save SDG wheel animation setting:', error);
      return NextResponse.json(
        { success: false, error: 'Could not save the SDG wheel animation setting.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, enabled: body.enabled });
  } catch (error) {
    console.error('PUT /api/admin/sdg-wheel-animation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Could not save the SDG wheel animation setting.' },
      { status: 500 },
    );
  }
}
