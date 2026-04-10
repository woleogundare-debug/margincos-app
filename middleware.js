import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          req.cookies.set({ name, value, ...options });
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          req.cookies.set({ name, value: '', ...options });
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh the Supabase session cookie on authenticated route requests.
  // Scoped via the matcher below to /dashboard, /admin, /settings only -
  // public pages skip this to preserve edge-cache TTFB.
  await supabase.auth.getUser();

  return res;
}

export const config = {
  matcher: [
    // Only run the Supabase auth refresh on authenticated route trees.
    // Public pages (/, /login, /contact, /pricing, /platform/*, /blog/*, /join, /reset-password)
    // skip middleware entirely and serve directly from the Netlify edge cache.
    '/dashboard/:path*',
    '/admin/:path*',
    '/settings/:path*',
  ],
};
