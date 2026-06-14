// Server-side Supabase client for Server Components / Route Handlers. Reads and
// writes the session cookies via next/headers. The setAll try/catch is the
// documented @supabase/ssr pattern: cookie writes from a Server Component throw,
// and are safely ignored because middleware refreshes the session.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore (middleware refreshes).
          }
        },
      },
    },
  );
}
