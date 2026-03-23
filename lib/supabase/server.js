import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export function createSupabaseServerClient(req, res) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies[name];
        },
        set(name, value, options) {
          const existing = res.getHeader('Set-Cookie') ?? [];
          const cookies = Array.isArray(existing) ? existing : existing ? [String(existing)] : [];
          res.setHeader('Set-Cookie', [
            ...cookies,
            `${name}=${value}; Path=${options?.path || '/'}; HttpOnly; Secure; SameSite=Lax${options?.maxAge ? `; Max-Age=${options.maxAge}` : ''}`,
          ]);
        },
        remove(name) {
          const existing = res.getHeader('Set-Cookie') ?? [];
          const cookies = Array.isArray(existing) ? existing : existing ? [String(existing)] : [];
          res.setHeader('Set-Cookie', [
            ...cookies,
            `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
          ]);
        },
      },
    }
  );
}

// Service role client — bypasses RLS for admin operations.
// Never expose this to browser clients.
export function createSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Verify the session via server-side cookie and server-validated getUser().
// Returns { redirect: true } if unauthenticated.
// Returns { redirect: false, user, supabase, session } if authenticated.
export async function requireAuth(req, res) {
  const supabase = createSupabaseServerClient(req, res);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { redirect: true, user: null, supabase: null, session: null };
  }
  return { redirect: false, user, supabase, session: { user } };
}
