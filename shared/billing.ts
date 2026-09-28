export type TaxMode = "intra_state" | "inter_state";

export type InvoiceLine = {
  quantity: number;
  rate: number;
  gstRate: number;
};

export function calculateInvoiceTotals(lines: InvoiceLine[], taxMode: TaxMode = "intra_state") {
  const taxable = lines.reduce((sum, line) => sum + line.quantity * line.rate, 0);
  const tax = lines.reduce((sum, line) => sum + line.quantity * line.rate * (line.gstRate / 100), 0);
  return {
    taxable: Math.round(taxable * 100) / 100,
    cgst: taxMode === "intra_state" ? Math.round((tax / 2) * 100) / 100 : 0,
    sgst: taxMode === "intra_state" ? Math.round((tax / 2) * 100) / 100 : 0,
    igst: taxMode === "inter_state" ? Math.round(tax * 100) / 100 : 0,
    total: Math.round((taxable + tax) * 100) / 100,
  };
}
