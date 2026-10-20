import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasAmbassadorPortalRole } from '@/lib/access';
import { MCQAccessLevel } from '@/types/database';

export interface AmbassadorAccess {
  role: string;
  userId: string;
  userEmail: string;
  canManageTeam: boolean;
  mcqAccessLevel: MCQAccessLevel;
  canViewMCQs: boolean;
  canToggleMCQs: boolean;
  canEditMCQs: boolean;
}

export async function requireAmbassadorPortalAccess(): Promise<NextResponse | AmbassadorAccess> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, email, members(can_manage_team, mcq_access_level)')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Failed to verify ambassador portal role:', error);
    return NextResponse.json({ success: false, error: 'Unable to verify portal access.' }, { status: 500 });
  }

  if (!profile || !hasAmbassadorPortalRole(profile.role)) {
    return NextResponse.json({ success: false, error: 'Ambassador portal access is restricted.' }, { status: 403 });
  }

  const userEmail = (profile.email || user.email || '').trim().toLowerCase();
  const isSuperAdmin = profile.role === 'admin' || userEmail === 'ai.bridge.iiui.fms@gmail.com';

  const rawMember = Array.isArray(profile.members)
    ? profile.members[0]
    : profile.members;

  const canManageTeam = isSuperAdmin || Boolean(rawMember?.can_manage_team);

  // Compute hierarchical MCQ access level
  let mcqAccessLevel: MCQAccessLevel = 'none';

  if (isSuperAdmin) {
    mcqAccessLevel = 'manager';
  } else if (rawMember?.mcq_access_level && ['none', 'viewer', 'moderator', 'manager'].includes(rawMember.mcq_access_level)) {
    mcqAccessLevel = rawMember.mcq_access_level;
  } else {
    // Check system_settings fallback for mcq_access_levels
    try {
      const { data: settingsRow } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'mcq_access_levels')
        .maybeSingle();
      if (settingsRow?.value && typeof settingsRow.value === 'object') {
        const customLevel = settingsRow.value[userEmail];
        if (customLevel && ['none', 'viewer', 'moderator', 'manager'].includes(customLevel)) {
          mcqAccessLevel = customLevel;
        }
      }
    } catch {
      // Fallback silently
    }
  }

  const canViewMCQs = isSuperAdmin || mcqAccessLevel !== 'none';
  const canToggleMCQs = isSuperAdmin || mcqAccessLevel === 'moderator' || mcqAccessLevel === 'manager';
  const canEditMCQs = isSuperAdmin || mcqAccessLevel === 'manager';

  return {
    role: profile.role,
    userId: user.id,
    userEmail,
    canManageTeam,
    mcqAccessLevel,
    canViewMCQs,
    canToggleMCQs,
    canEditMCQs,
  };
}
