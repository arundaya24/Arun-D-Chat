import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
const isPlaceholderValue = (value: string) =>
  /your-project\.supabase\.co|your[-_ ]|placeholder|example|change.?me|_here|isi_/i.test(
    value
  );
const hasSupabaseConfig =
  Boolean(supabaseUrl && supabaseServiceRoleKey) &&
  !isPlaceholderValue(supabaseUrl) &&
  !isPlaceholderValue(supabaseAnonKey) &&
  !isPlaceholderValue(supabaseServiceRoleKey);

export const supabasePublic = hasSupabaseConfig && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function getSupabaseAdmin() {
  if (!hasSupabaseConfig) {
    console.warn(
      "Supabase belum dikonfigurasi dengan kredensial valid; menggunakan mode lokal."
    );
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
