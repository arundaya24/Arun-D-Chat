import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

function isValidSupabaseUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  if (
    url.includes("your-supabase-project") ||
    url.includes("your-project") ||
    url.includes("example.com")
  ) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidSupabaseKey(key: string): boolean {
  if (!key || typeof key !== "string") return false;
  if (
    key.includes("your-supabase-anon-key") ||
    key.includes("your-supabase-service-role-key") ||
    key.includes("your-anon-key") ||
    key.includes("your-service-role-key")
  ) {
    return false;
  }
  return key.trim().length > 20;
}

export function isSupabaseConfigured(): boolean {
  return (
    isValidSupabaseUrl(supabaseUrl) &&
    isValidSupabaseKey(supabaseServiceRoleKey)
  );
}

let cachedAdminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!cachedAdminClient) {
    cachedAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return cachedAdminClient;
}

export const supabasePublic =
  isValidSupabaseUrl(supabaseUrl) && isValidSupabaseKey(supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
