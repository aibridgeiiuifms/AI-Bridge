import { cache } from 'react';
import { createClient } from './server';

/**
 * Deduplicated server-side fetcher for current user.
 * React.cache() ensures that multiple server components calling this
 * within the same render pass reuse the exact same result.
 */
export const getCurrentUser = cache(async () => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    return null;
  }
});

/**
 * Deduplicated server-side fetcher for current user's profile.
 */
export const getCurrentUserProfile = cache(async (userId: string) => {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, full_name, avatar_url, email')
      .eq('id', userId)
      .maybeSingle();
    return profile;
  } catch (err) {
    return null;
  }
});
