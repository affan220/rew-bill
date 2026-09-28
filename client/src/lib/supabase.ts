import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = supabaseUrl && supabasePublishableKey
  ? createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

export async function getCompanySettings() {
  if (!supabase) return null;
  const { data, error } = await supabase.from("company_settings").select("company_name, tagline, address, gstin, state_code").limit(1).maybeSingle();
  if (error) {
    console.warn("[Supabase] Company settings unavailable until sign-in:", error.message);
    return null;
  }
  return data;
}
