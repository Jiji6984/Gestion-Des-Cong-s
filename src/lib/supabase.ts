import { createBrowserClient } from "@supabase/ssr";

// createBrowserClient (from @supabase/ssr) stocke la session dans les cookies
// au lieu de localStorage — indispensable pour que le middleware SSR puisse
// lire la session et effectuer les redirections correctement.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
