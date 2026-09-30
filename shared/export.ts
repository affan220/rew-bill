export type ExportDocument = {
  number: string;
  type: string;
  customer: string;
  date: string;
  amount: string;
  status: string;
};

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function toDocumentsCsv(documents: ExportDocument[]) {
  const header = ["Document", "Type", "Customer", "Date", "Amount / Items", "Status"];
  return [header, ...documents.map((doc) => [doc.number, doc.type, doc.customer, doc.date, doc.amount, doc.status])]
    .map((row) => row.map(csvCell).join(","))
    .join("\n") + "\n";
}
