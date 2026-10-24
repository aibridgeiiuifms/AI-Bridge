import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerSupabase } from '@/lib/supabase/server';

function detectDeviceType(ua: string): 'mobile' | 'tablet' | 'desktop' {
  const lower = ua.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/i.test(lower)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(lower)) {
    return 'mobile';
  }
  return 'desktop';
}

function detectBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return 'Microsoft Edge';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  return 'Other Browser';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      eventName,
      pagePath,
      properties = {},
      sessionId,
      country: clientCountry,
      referrer: clientReferrer,
    } = body;

    if (!eventName || !pagePath) {
      return NextResponse.json({ error: 'Missing eventName or pagePath' }, { status: 400 });
    }

    const ua = req.headers.get('user-agent') || '';
    const deviceType = detectDeviceType(ua);
    const browser = detectBrowser(ua);
    const referrer = clientReferrer || req.headers.get('referer') || null;

    // Detect user session if logged in
    let userId: string | null = null;
    let userRole = 'guest';

    try {
      const supabaseServer = await createServerSupabase();
      const { data: { user } } = await supabaseServer.auth.getUser();

      if (user) {
        userId = user.id;
        const { data: profile } = await supabaseServer
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.role) {
          // Normalize legacy 'member' to 'team-member' to respect CHECK constraint
          userRole = profile.role === 'member' ? 'team-member' : profile.role;
        } else {
          userRole = 'student';
        }
      }
    } catch {
      // Guest or session error, default to guest
      userRole = 'guest';
    }

    // Insert into analytics_events table via admin client (bypasses RLS)
    const admin = createAdminClient();
    const { error: insertError } = await admin.from('analytics_events').insert({
      user_id: userId,
      session_id: sessionId || 'unknown_session',
      user_role: userRole,
      event_name: eventName,
      page_path: pagePath,
      properties: typeof properties === 'object' && properties !== null ? properties : {},
      referrer,
      device_type: deviceType,
      browser,
      country: clientCountry || null,
      user_agent: ua ? ua.substring(0, 500) : null,
    });

    if (insertError) {
      console.error('Error inserting analytics event:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Analytics tracking endpoint exception:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
