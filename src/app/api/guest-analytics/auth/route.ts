import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const admin = createAdminClient();
    const body = await req.json();
    const { passcode } = body;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
               req.headers.get('x-real-ip') ||
               '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown device';

    // 1. Fetch guest settings
    const { data: settings } = await admin
      .from('guest_access_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    const isEnabled = settings?.is_enabled ?? true;
    const correctPasscode = settings?.passcode || 'AIB-Impact-2026';

    if (!isEnabled) {
      return NextResponse.json(
        { error: 'Outsider access is currently disabled by administrator.' },
        { status: 403 }
      );
    }

    // 2. Check if this IP is blocked in access logs
    const { data: blockedLogs } = await admin
      .from('guest_access_logs')
      .select('id')
      .eq('ip_address', ip)
      .eq('is_blocked', true)
      .limit(1);

    if (blockedLogs && blockedLogs.length > 0) {
      return NextResponse.json(
        { error: 'Your access has been blocked by administrator.' },
        { status: 403 }
      );
    }

    // 3. Verify passcode
    if (!passcode || passcode.trim().toLowerCase() !== correctPasscode.trim().toLowerCase()) {
      return NextResponse.json(
        { error: 'Invalid access passcode. Please scan the official QR code or check the report passcode.' },
        { status: 401 }
      );
    }

    // Determine device type
    const isMobile = /mobile|iphone|android|ipad/i.test(userAgent);
    const deviceInfo = isMobile ? 'Mobile Device' : 'Desktop / Laptop';

    // 4. Log the guest session
    await admin.from('guest_access_logs').insert({
      passcode_used: passcode.trim(),
      ip_address: ip,
      user_agent: userAgent.slice(0, 255),
      device_info: deviceInfo,
      is_blocked: false,
      accessed_at: new Date().toISOString(),
    });

    // 5. Insert notification for Admin
    await admin.from('admin_notifications').insert({
      type: 'guest_login',
      title: 'Outsider Evaluator Logged In',
      message: `A guest scanned the QR code / entered passcode from ${deviceInfo} (${ip}).`,
      metadata: { ip, deviceInfo, userAgent: userAgent.slice(0, 150) },
      is_read: false,
      created_at: new Date().toISOString(),
    });

    // 6. Issue secure guest session token
    const token = `aib_guest_verified_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const res = NextResponse.json({
      success: true,
      message: 'Access granted to AI Bridge Analytics',
      token,
      deviceInfo,
    });

    // Set secure cookie valid for 24 hours
    res.cookies.set('aib_guest_session', token, {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
