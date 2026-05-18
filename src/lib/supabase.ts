import { createClient } from "@supabase/supabase-js";

// Fallbacks vides évitent un crash au build si les vars d'env ne sont pas encore définies.
// En production, NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
// doivent être configurées dans les variables d'environnement Vercel.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
