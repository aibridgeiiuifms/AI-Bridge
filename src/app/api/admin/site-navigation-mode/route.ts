import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireAmbassadorPortalAccess } from '@/lib/ambassador-access';

export const dynamic = 'force-dynamic';

const SETTING_KEY = 'site_navigation_mode';
const DEFAULT_MODE = 'continuous';
type MobileNavigationMode = 'continuous' | 'separate';

function isMobileNavigationMode(value: unknown): value is MobileNavigationMode {
  return value === 'continuous' || value === 'separate';
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', SETTING_KEY)
      .maybeSingle();

    if (error) {
      console.error('Failed to load mobile navigation setting:', error);
      return NextResponse.json(
        { success: false, error: 'Could not load the mobile navigation setting.' },
        { status: 500 },
      );
    }

    const savedMode = data?.value?.mobile;
    const mode = isMobileNavigationMode(savedMode) ? savedMode : DEFAULT_MODE;

    return NextResponse.json({
      success: true,
      mobile: mode,
      is_default: !isMobileNavigationMode(savedMode),
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('GET /api/admin/site-navigation-mode failed:', error);
    return NextResponse.json(
      { success: false, error: 'Could not load the mobile navigation setting.' },
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
      || !('mobile' in body)
      || !isMobileNavigationMode(body.mobile)
    ) {
      return NextResponse.json(
        { success: false, error: 'Choose continuous or separate mobile pages.' },
        { status: 400 },
      );
    }

    const adminSupabase = createAdminClient();
    const value = { mobile: body.mobile };
    const { error } = await adminSupabase
      .from('system_settings')
      .upsert(
        { key: SETTING_KEY, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      );

    if (error) {
      console.error('Failed to save mobile navigation setting:', error);
      return NextResponse.json(
        { success: false, error: 'Could not save the mobile navigation setting.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, mobile: body.mobile });
  } catch (error) {
    console.error('PUT /api/admin/site-navigation-mode failed:', error);
    return NextResponse.json(
      { success: false, error: 'Could not save the mobile navigation setting.' },
      { status: 500 },
    );
  }
}
