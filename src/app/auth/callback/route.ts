import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('exchangeCodeForSession error:', error);
      }
    } catch (err) {
      console.error('Error during auth exchange:', err);
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/portal`);
}
