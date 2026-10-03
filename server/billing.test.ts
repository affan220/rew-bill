import { describe, expect, it } from "vitest";
import {
  calculateInvoiceTotals,
  getSplitTaxRateLabel,
  normalizePrintSettings,
} from "../shared/billing";

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

  it("derives the split CGST/SGST rate from a single invoice GST rate", () => {
    expect(
      getSplitTaxRateLabel([{ quantity: 2, rate: 1000, gstRate: 12 }])
    ).toBe("6%");
  });

  it("marks invoices with more than one GST rate as mixed", () => {
    expect(
      getSplitTaxRateLabel([
        { quantity: 1, rate: 100, gstRate: 5 },
        { quantity: 1, rate: 100, gstRate: 18 },
      ])
    ).toBe("mixed rates");
  });

  it("adds safe City Union Bank defaults without discarding unknown settings", () => {
    expect(normalizePrintSettings({ bankIfsc: "CUB0001234" })).toEqual({
      bankName: "City Union Bank",
      bankAccount: "",
      bankIfsc: "CUB0001234",
      bankBranch: "",
      authorizedSignatory: "Authorised Signatory",
    });
  });
});
