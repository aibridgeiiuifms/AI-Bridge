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
        const adminSupabase = createAdminClient();

        // 1. Auto-link any pre-registered surveys for this user's email (checking student_email, login_email & answers)
        const userEmail = (data.user.email || '').replace(/\s+/g, '').toLowerCase();
        if (userEmail) {
          try {
            await Promise.all([
              adminSupabase
                .from('student_surveys')
                .update({ user_id: data.user.id })
                .or(`student_email.ilike.${userEmail},login_email.ilike.${userEmail}`)
                .is('user_id', null),
              adminSupabase
                .from('student_surveys')
                .update({ user_id: data.user.id })
                .filter('answers->>Student Email Address', 'ilike', userEmail)
                .is('user_id', null),
              adminSupabase
                .from('teacher_surveys')
                .update({ user_id: data.user.id })
                .or(`teacher_email.ilike.${userEmail},login_email.ilike.${userEmail}`)
                .is('user_id', null),
            ]);
          } catch (linkErr) {
            console.error('Error auto-linking pre-registered surveys:', linkErr);
          }
        }

        // 2. Refresh the access role after linking surveys so role elevates from guest to student
        try {
          await adminSupabase.rpc('sync_user_role', { p_user_id: data.user.id });
        } catch (roleErr) {
          console.error('Error syncing user role on login:', roleErr);
        }
      }
    } catch (err) {
      console.error('Error during auth exchange:', err);
    }
  }

  // Redirect all users (guest, student, teacher, admin, member) directly to Home page on login
  return NextResponse.redirect(`${origin}/`);
}
