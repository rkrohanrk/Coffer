// Browser-side Supabase client. Uses @supabase/ssr so the session is persisted
// in cookies, where middleware and server components can read it too.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
