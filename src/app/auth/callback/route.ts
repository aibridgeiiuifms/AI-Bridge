import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('exchangeCodeForSession error:', error);
      } else if (data.user) {
        // Refresh the access role on every login from members + survey forms
        try {
          const adminSupabase = createAdminClient();
          await adminSupabase.rpc('sync_user_role', { p_user_id: data.user.id });
        } catch (roleErr) {
          console.error('Error syncing user role on login:', roleErr);
        }

        // Auto-link any pre-registered surveys for this user's email
        const userEmail = (data.user.email || '').replace(/\s+/g, '').toLowerCase();
        if (userEmail) {
          try {
            const adminSupabase = createAdminClient();
            await Promise.all([
              adminSupabase
                .from('student_surveys')
                .update({ user_id: data.user.id })
                .ilike('student_email', userEmail)
                .is('user_id', null),
              adminSupabase
                .from('teacher_surveys')
                .update({ user_id: data.user.id })
                .ilike('teacher_email', userEmail)
                .is('user_id', null),
            ]);
          } catch (linkErr) {
            console.error('Error auto-linking pre-registered surveys:', linkErr);
          }
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();
        if (profileError) {
          console.error('Failed to load profile after sign in:', profileError);
        } else if (profile?.role === 'admin' || profile?.role === 'team-member') {
          return NextResponse.redirect(`${origin}/dashboard`);
        }
      }
    } catch (err) {
      console.error('Error during auth exchange:', err);
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/portal`);
}
