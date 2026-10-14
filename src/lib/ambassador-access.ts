import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AMBASSADOR_PORTAL_EMAIL } from '@/lib/access';

export async function requireAmbassadorPortalAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }

  if (user.email?.trim().toLowerCase() !== AMBASSADOR_PORTAL_EMAIL) {
    return NextResponse.json({ success: false, error: 'Ambassador portal access is restricted.' }, { status: 403 });
  }

  return null;
}
