import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client côté navigateur (singleton)
// Les types sont gérés manuellement dans chaque composant via les interfaces locales
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
