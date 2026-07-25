// Server-only Supabase client. Uses the service role key so it can reach
// tables that have no anon/authenticated grants (see security-hardening
// migration). All device_id scoping is enforced in server function handlers.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

let _client: SupabaseClient<Database> | undefined;

export function getDb(): SupabaseClient<Database> {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  _client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
  return _client;
}

