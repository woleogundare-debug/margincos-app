import { createServerClient } from '@supabase/ssr';

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
          const cookies = Array.isArray(existing) ? existing : [String(existing)];
          res.setHeader('Set-Cookie', [
            ...cookies,
            `${name}=${value}; Path=/; HttpOnly; SameSite=Lax${options?.maxAge ? `; Max-Age=${options.maxAge}` : ''}`,
          ]);
        },
        remove(name) {
          const existing = res.getHeader('Set-Cookie') ?? [];
          const cookies = Array.isArray(existing) ? existing : [String(existing)];
          res.setHeader('Set-Cookie', [
            ...cookies,
            `${name}=; Path=/; Max-Age=0`,
          ]);
        },
      },
    }
  );
}

// Convenience: verify session and return user, or redirect
export async function requireAuth(req, res) {
  const supabase = createSupabaseServerClient(req, res);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  return { session, supabase };
}
