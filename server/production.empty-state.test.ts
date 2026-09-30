import { describe, expect, it } from "vitest";
import { calculateInvoiceTotals } from "../shared/billing";
import { toDocumentsCsv } from "../shared/export";

describe("production empty states", () => {
  it("starts invoice calculations at zero without demo line items", () => {
    expect(calculateInvoiceTotals([])).toEqual({ taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });
  });

  it("exports a valid header-only CSV when the history is empty", () => {
    expect(toDocumentsCsv([])).toBe('"Document","Type","Customer","Date","Amount / Items","Status"\n');
  });
});
