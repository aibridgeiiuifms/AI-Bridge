import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { AMBASSADOR_PORTAL_EMAIL } from '@/lib/access';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  // Only attempt auth refresh if valid URL is provided
  if (!supabaseUrl.includes('placeholder')) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    // 1. Restrict the ambassador portal to the designated account.
    if (pathname.startsWith('/dashboard')) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
      }

      if (user.email?.trim().toLowerCase() !== AMBASSADOR_PORTAL_EMAIL) {
        const url = request.nextUrl.clone();
        url.pathname = '/portal';
        url.searchParams.set('access_denied', 'restricted_dashboard');
        return NextResponse.redirect(url);
      }
    }

    // 2. Security Guard for /portal: Requires Authenticated User
    if (pathname.startsWith('/portal')) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
      }
    }

    // 3. Convenience: If logged-in user visits /login, redirect to their home portal
    if (pathname === '/login' && user) {
      const url = request.nextUrl.clone();
      url.pathname = user.email?.trim().toLowerCase() === AMBASSADOR_PORTAL_EMAIL
        ? '/dashboard'
        : '/portal';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
