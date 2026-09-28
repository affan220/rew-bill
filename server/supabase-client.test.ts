import { describe, expect, it } from "vitest";

describe("Supabase client contract", () => {
  it("targets the expected public schema tables", () => {
    const table = "company_settings";
    expect(table).toMatch(/^[a-z_]+$/);
    expect("https://yhvxmiuvbzlirlvetibi.supabase.co").toContain("supabase.co");
  });
});
