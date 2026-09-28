import { describe, expect, it } from "vitest";

describe("Supabase runtime configuration", () => {
  it("can reach the configured REST endpoint with the publishable key", async () => {
    const url = process.env.VITE_SUPABASE_URL ?? "https://yhvxmiuvbzlirlvetibi.supabase.co";
    const publishableKey = process.env.VITE_SUPABASE_ANON_KEY ?? "sb_publishable_7-AYNeHSocpU12x7NDJLAw_X_xGL5fJ";
    const response = await fetch(`${url}/rest/v1/company_settings?select=id&limit=1`, {
      headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}` },
    });
    expect(response.ok).toBe(true);
    expect(Array.isArray(await response.json())).toBe(true);
  });
});
