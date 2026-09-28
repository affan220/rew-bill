import { describe, expect, it } from "vitest";
import { calculateInvoiceTotals } from "../shared/billing";

describe("calculateInvoiceTotals", () => {
  it("splits GST into CGST and SGST for intra-state invoices", () => {
    expect(calculateInvoiceTotals([{ quantity: 2, rate: 1000, gstRate: 18 }])).toEqual({
      taxable: 2000,
      cgst: 180,
      sgst: 180,
      igst: 0,
      total: 2360,
    });
  });

  it("uses IGST for inter-state invoices", () => {
    expect(calculateInvoiceTotals([{ quantity: 3, rate: 500, gstRate: 12 }], "inter_state")).toEqual({
      taxable: 1500,
      cgst: 0,
      sgst: 0,
      igst: 180,
      total: 1680,
    });
  });
});
