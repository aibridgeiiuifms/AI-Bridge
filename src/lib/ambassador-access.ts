import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasAmbassadorPortalRole } from '@/lib/access';

export async function requireAmbassadorPortalAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, member_permissions(can_manage_team)')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Failed to verify ambassador portal role:', error);
    return NextResponse.json({ success: false, error: 'Unable to verify portal access.' }, { status: 500 });
  }

  if (!profile || !hasAmbassadorPortalRole(profile.role)) {
    return NextResponse.json({ success: false, error: 'Ambassador portal access is restricted.' }, { status: 403 });
  }

  return {
    role: profile.role,
    userId: user.id,
    canManageTeam: profile.member_permissions?.some((permission) => permission.can_manage_team) ?? false,
  };
}
