import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { mergeSurveyChartPermissions } from '@/lib/surveyChartPermissions';
import QRCode from 'qrcode';

// In-memory rate limiting map: ip -> { attempts: number, lockUntil: number }
const rateLimitMap = new Map<string, { attempts: number; lockUntil: number }>();

function checkRateLimit(ip: string): { allowed: boolean; waitMinutes?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry) return { allowed: true };

  if (entry.lockUntil > now) {
    const waitMinutes = Math.ceil((entry.lockUntil - now) / 60000);
    return { allowed: false, waitMinutes };
  }

  if (entry.lockUntil <= now && entry.attempts >= 5) {
    rateLimitMap.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordAttempt(ip: string, success: boolean) {
  const now = Date.now();
  if (success) {
    rateLimitMap.delete(ip);
    return;
  }
  const entry = rateLimitMap.get(ip) || { attempts: 0, lockUntil: 0 };
  entry.attempts += 1;
  if (entry.attempts >= 5) {
    entry.lockUntil = now + 15 * 60 * 1000; // 15-minute lockout
  }
  rateLimitMap.set(ip, entry);
}

/**
 * GET: Retrieves reviewer access configuration & generated QR code for Admin
 * OR verifies existing reviewer cookie/token
 */
export async function GET(req: NextRequest) {
  try {
    const admin = createAdminClient();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'check';

    // 1. If mode === 'check', verify if current user has valid session
    if (mode === 'check') {
      const reviewerCookie = req.cookies.get('aib_reviewer_session')?.value;
      const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
      const token = reviewerCookie || authHeader;

      if (token && token.startsWith('aib_verified_')) {
        return NextResponse.json({ authenticated: true, role: 'reviewer' });
      }

      // Check if logged in team member / admin
      const supabase = await createServerSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await admin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const isSuperAdmin = user.email?.toLowerCase() === 'ai.bridge.iiui.fms@gmail.com';
        if (isSuperAdmin || profile?.role === 'admin') {
          return NextResponse.json({ authenticated: true, role: 'admin' });
        }

        const { data: access } = await admin
          .from('analytics_access_control')
          .select('can_view_analytics')
          .eq('member_id', user.id)
          .maybeSingle();

        if (access?.can_view_analytics) {
          return NextResponse.json({ authenticated: true, role: 'team-member' });
        }
      }

      return NextResponse.json({ authenticated: false });
    }

    // 2. Admin settings view: require Admin authentication
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await admin.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();
    const isSuperAdmin = user.email?.toLowerCase() === 'ai.bridge.iiui.fms@gmail.com';
    if (!isSuperAdmin && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch reviewer settings and chart permissions
    const [accessRes, chartRes] = await Promise.all([
      admin.from('system_settings').select('value').eq('key', 'reviewer_dashboard_access').maybeSingle(),
      admin.from('system_settings').select('value').eq('key', 'survey_dashboard_chart_permissions').maybeSingle(),
    ]);

    const accessConfig = accessRes.data?.value || {
      is_enabled: true,
      password_plain: 'HHP-AIB-2026',
      session_duration_hours: 24,
      evaluator_organization: 'Hum Hain Pakistan National SDG Campaign Evaluators',
      allow_chart_downloads: true,
    };

    const chartPermissions = mergeSurveyChartPermissions(chartRes.data?.value);

    // Generate live QR code data URL
    const targetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-bridge-iiui.vercel.app'}/dashboard/survey-analytics?ref=report_qr`;
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#047857', // emerald-700
        light: '#ffffff',
      },
    });

    const qrSvg = await QRCode.toString(targetUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#047857',
        light: '#ffffff',
      },
    });

    return NextResponse.json({
      success: true,
      targetUrl,
      qrDataUrl,
      qrSvg,
      accessConfig,
      chartPermissions,
    });
  } catch (err: any) {
    console.error('Reviewer access GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

/**
 * POST: Validates reviewer password and sets secure session cookie
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: `Too many failed attempts. Access locked. Please wait ${rateCheck.waitMinutes} minute(s).`,
      }, { status: 429 });
    }

    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: setting } = await admin
      .from('system_settings')
      .select('value')
      .eq('key', 'reviewer_dashboard_access')
      .maybeSingle();

    const expectedPassword = setting?.value?.password_plain || 'HHP-AIB-2026';
    const isMatch = password.trim() === expectedPassword.trim();

    if (!isMatch) {
      recordAttempt(ip, false);
      return NextResponse.json({
        success: false,
        error: 'Invalid evaluator password. Please check the code printed on the official report.',
      }, { status: 401 });
    }

    recordAttempt(ip, true);

    const token = `aib_verified_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const sessionHours = Number(setting?.value?.session_duration_hours || 24);

    const response = NextResponse.json({
      success: true,
      token,
      organization: setting?.value?.evaluator_organization || 'Official Evaluator',
      expiresInHours: sessionHours,
    });

    response.cookies.set('aib_reviewer_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionHours * 60 * 60,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    console.error('Reviewer access POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

/**
 * PATCH: Admin updates reviewer password or chart visibility matrix
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();
    const isSuperAdmin = user.email?.toLowerCase() === 'ai.bridge.iiui.fms@gmail.com';
    if (!isSuperAdmin && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Only administrators can update access settings.' }, { status: 403 });
    }

    const body = await req.json();

    if (body.accessConfig) {
      const { data: current } = await admin.from('system_settings').select('value').eq('key', 'reviewer_dashboard_access').maybeSingle();
      const updatedValue = {
        ...(current?.value || {}),
        ...body.accessConfig,
        last_updated_by: profile?.full_name || user.email,
        updated_at: new Date().toISOString(),
      };

      await admin.from('system_settings').upsert({
        key: 'reviewer_dashboard_access',
        value: updatedValue,
        updated_at: new Date().toISOString(),
      });
    }

    if (body.chartPermissions) {
      if (typeof body.chartPermissions !== 'object' || Array.isArray(body.chartPermissions)) {
        return NextResponse.json({ error: 'Chart permissions must be an object.' }, { status: 400 });
      }

      const { data: current, error: currentError } = await admin
        .from('system_settings')
        .select('value')
        .eq('key', 'survey_dashboard_chart_permissions')
        .maybeSingle();
      if (currentError) {
        throw new Error(`Failed to load chart permissions: ${currentError.message}`);
      }
      const currentPermissions = mergeSurveyChartPermissions(current?.value);
      const updatedPermissions = {
        ...currentPermissions,
        ...body.chartPermissions,
      };
      const { error: chartPermissionSaveError } = await admin.from('system_settings').upsert({
        key: 'survey_dashboard_chart_permissions',
        value: updatedPermissions,
        updated_at: new Date().toISOString(),
      });
      if (chartPermissionSaveError) {
        throw new Error(`Failed to save chart permissions: ${chartPermissionSaveError.message}`);
      }
    }

    return NextResponse.json({ success: true, message: 'Reviewer settings updated successfully' });
  } catch (err: any) {
    console.error('Reviewer access PATCH error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
