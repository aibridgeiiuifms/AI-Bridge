import { createClient } from '@/lib/supabase/server';
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
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();
        if (profileError) {
          console.error('Failed to load profile after sign in:', profileError);
        } else if (profile?.role === 'admin' || profile?.role === 'member') {
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
