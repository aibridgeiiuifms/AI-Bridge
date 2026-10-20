export const AMBASSADOR_PORTAL_EMAIL = 'ai.bridge.iiui.fms@gmail.com';

export function hasAmbassadorPortalRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'team-member';
}
