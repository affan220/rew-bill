import { describe, expect, it } from "vitest";
import { toDocumentsCsv } from "../shared/export";

describe("document export", () => {
  it("creates a spreadsheet-friendly CSV with escaped cells", () => {
    const csv = toDocumentsCsv([{ number: "INV-1", type: "Tax Invoice", customer: 'Apex "Auto"', date: "28 Sep 2026", amount: "₹1,000", status: "Issued" }]);
    expect(csv).toContain('"Document","Type","Customer"');
    expect(csv).toContain('"Apex ""Auto"""');
    expect(csv.endsWith("\n")).toBe(true);
  });
});
