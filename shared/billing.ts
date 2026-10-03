export type TaxMode = "intra_state" | "inter_state";

export type InvoiceLine = {
  quantity: number;
  rate: number;
  gstRate: number;
};

export type PrintSettings = {
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  bankBranch: string;
  authorizedSignatory: string;
};

export const defaultPrintSettings: PrintSettings = {
  bankName: "City Union Bank",
  bankAccount: "",
  bankIfsc: "",
  bankBranch: "",
  authorizedSignatory: "Authorised Signatory",
};

export function normalizePrintSettings(value: unknown): PrintSettings {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const text = (key: keyof PrintSettings) =>
    typeof source[key] === "string" && source[key].trim()
      ? String(source[key])
      : defaultPrintSettings[key];

  return {
    bankName: text("bankName"),
    bankAccount: text("bankAccount"),
    bankIfsc: text("bankIfsc"),
    bankBranch: text("bankBranch"),
    authorizedSignatory: text("authorizedSignatory"),
  };
}

const formatRate = (value: number) =>
  Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");

/** Returns the half-rate used for each CGST/SGST leg, or mixed rates. */
export function getSplitTaxRateLabel(lines: InvoiceLine[]): string {
  const rates = Array.from(
    new Set(
      lines
        .map(line => Number(line.gstRate))
        .filter(rate => Number.isFinite(rate) && rate >= 0)
    )
  ).sort((a, b) => a - b);

  if (!rates.length) return "0%";
  if (rates.length > 1) return "mixed rates";
  return `${formatRate(rates[0] / 2)}%`;
}

export function calculateInvoiceTotals(
  lines: InvoiceLine[],
  taxMode: TaxMode = "intra_state"
) {
  const taxable = lines.reduce((sum, line) => sum + line.quantity * line.rate, 0);
  const tax = lines.reduce(
    (sum, line) => sum + line.quantity * line.rate * (line.gstRate / 100),
    0
  );
  return {
    taxable: Math.round(taxable * 100) / 100,
    cgst: taxMode === "intra_state" ? Math.round((tax / 2) * 100) / 100 : 0,
    sgst: taxMode === "intra_state" ? Math.round((tax / 2) * 100) / 100 : 0,
    igst: taxMode === "inter_state" ? Math.round(tax * 100) / 100 : 0,
    total: Math.round((taxable + tax) * 100) / 100,
  };
}
