import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import QRCode from 'qrcode';

async function checkAdmin(supabase: any, admin: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAuthorized: false, user: null, isAdmin: false };

  const isSuperAdmin = user.email?.toLowerCase() === 'ai.bridge.iiui.fms@gmail.com';
  if (isSuperAdmin) return { isAuthorized: true, user, isAdmin: true };

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = profile?.role === 'admin';
  return { isAuthorized: true, user, isAdmin };
}

// GET: Admin fetches outsider guest access settings, QR code, and live audit logs
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const admin = createAdminClient();
    const { isAdmin } = await checkAdmin(supabase, admin);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    // 1. Get Settings
    const { data: settings } = await admin
      .from('guest_access_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    const currentPasscode = settings?.passcode || 'AIB-Impact-2026';
    const isEnabled = settings?.is_enabled ?? true;

    // 2. Generate dynamic QR Code linking to /guest-analytics
    const origin = req.nextUrl.origin || 'https://ai-bridge-iiui.vercel.app';
    const guestUrl = `${origin}/guest-analytics`;
    const qrDataUrl = await QRCode.toDataURL(guestUrl, {
      margin: 2,
      width: 320,
      color: {
        dark: '#064e3b', // Deep emerald
        light: '#ffffff',
      },
    });

    // 3. Fetch Recent Guest Access Logs
    const { data: logs } = await admin
      .from('guest_access_logs')
      .select('*')
      .order('accessed_at', { ascending: false })
      .limit(50);

    // 4. Fetch Unread Admin Notifications (specifically guest login alerts)
    const { data: notifications } = await admin
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    const unreadCount = (notifications || []).filter((n: any) => !n.is_read).length;

    return NextResponse.json({
      settings: {
        passcode: currentPasscode,
        isEnabled,
        guestUrl,
        qrDataUrl,
        updatedAt: settings?.updated_at || new Date().toISOString(),
      },
      logs: logs || [],
      notifications: notifications || [],
      unreadNotificationsCount: unreadCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Admin manages guest access settings and session blocks
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const admin = createAdminClient();
    const { isAdmin } = await checkAdmin(supabase, admin);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // 1. Update Passcode
    if (action === 'update_passcode') {
      const { passcode } = body;
      if (!passcode || passcode.trim().length < 4) {
        return NextResponse.json({ error: 'Passcode must be at least 4 characters long' }, { status: 400 });
      }

      await admin.from('guest_access_settings').upsert({
        id: 'global',
        passcode: passcode.trim(),
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, message: 'Guest passcode updated successfully' });
    }

    // 2. Toggle Guest Access On/Off
    if (action === 'toggle_access') {
      const { is_enabled } = body;
      await admin.from('guest_access_settings').upsert({
        id: 'global',
        is_enabled: Boolean(is_enabled),
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        is_enabled: Boolean(is_enabled),
        message: `Guest access ${is_enabled ? 'enabled' : 'blocked/disabled'} successfully`,
      });
    }

    // 3. Block or Unblock a Session / IP
    if (action === 'block_session') {
      const { log_id, is_blocked } = body;
      if (!log_id) {
        return NextResponse.json({ error: 'Missing log_id' }, { status: 400 });
      }

      await admin
        .from('guest_access_logs')
        .update({ is_blocked: Boolean(is_blocked) })
        .eq('id', log_id);

      return NextResponse.json({
        success: true,
        message: `Session ${is_blocked ? 'blocked' : 'unblocked'} successfully`,
      });
    }

    // 4. Mark notifications as read
    if (action === 'mark_notifications_read') {
      await admin
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
