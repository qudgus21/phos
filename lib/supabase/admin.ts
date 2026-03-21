import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export function createAdminClient() {
  const cached = (globalThis as Record<string, unknown>).__supabaseAdmin as ReturnType<typeof createClient<Database>> | undefined;
  if (cached) return cached;

  const client = createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  (globalThis as Record<string, unknown>).__supabaseAdmin = client;
  return client;
}
