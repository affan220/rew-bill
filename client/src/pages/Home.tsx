import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  ClipboardList,
  Copy,
  Download,
  FileCheck2,
  FilePlus2,
  FileText,
  Filter,
  IndianRupee,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Package,
  PanelLeft,
  Plus,
  Search,
  Settings2,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase, getCompanySettings } from "../lib/supabase";
import { toDocumentsCsv } from "../../../shared/export";
import { calculateInvoiceTotals } from "../../../shared/billing";

type Company = {
  id?: string;
  company_name: string;
  tagline: string;
  address: string;
  gstin: string;
  pan: string;
  state: string;
  state_code: string;
  contact_phone: string;
  contact_email: string;
  website: string;
  logo_url?: string | null;
};
type Customer = {
  id?: string;
  name: string;
  address: string;
  gstin: string;
  phone: string;
  email: string;
  place_of_supply: string;
};
type Product = {
  id?: string;
  part_code: string;
  description: string;
  hsn_sac: string;
  unit: string;
  default_rate: number;
  default_gst_rate: number;
  notes?: string;
};
type Row = {
  description: string;
  location: string;
  hsn: string;
  quantity: string;
  rate: string;
  gstRate: string;
  unit: string;
};
type Draft = {
  id?: string;
  documentNumber: string;
  invoiceNumber?: string;
  type: "invoice" | "challan";
  status: "draft" | "finalized" | "printed";
  customer: Customer;
  date: string;
  vehicle: string;
  challanNumber: string;
  notes: string;
  rows: Row[];
  amount: number;
};
type Doc = Draft & { tone: string };

const emptyCompany: Company = {
  company_name: "",
  tagline: "",
  address: "",
  gstin: "",
  pan: "",
  state: "",
  state_code: "",
  contact_phone: "",
  contact_email: "",
  website: "",
  logo_url: null,
};
const emptyCustomer: Customer = {
  name: "",
  address: "",
  gstin: "",
  phone: "",
  email: "",
  place_of_supply: "",
};
const emptyRows = (n = 1): Row[] =>
  Array.from({ length: n }, () => ({
    description: "",
    location: "",
    hsn: "",
    quantity: "",
    rate: "",
    gstRate: "18",
    unit: "Nos",
  }));
const blankDraft = (type: "invoice" | "challan"): Draft => ({
  type,
  documentNumber: `${type === "invoice" ? "INV" : "CH"}-DRAFT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  invoiceNumber: type === "invoice" ? "" : "",
  status: "draft",
  customer: { ...emptyCustomer },
  date: new Date().toISOString().slice(0, 10),
  vehicle: "",
  challanNumber: "",
  notes: "",
  rows: emptyRows(1),
  amount: 0,
});
const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
const navGroups = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", icon: LayoutDashboard },
      { label: "Invoices", icon: FileText },
      { label: "Delivery Challans", icon: Truck },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Customers", icon: Users },
      { label: "Products & Parts", icon: Package },
      { label: "Import / Export", icon: Upload },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Reports", icon: BookOpen },
      { label: "Settings", icon: Settings2 },
    ],
  },
];

function Logo({
  company,
  collapsed = false,
}: {
  company: Company;
  collapsed?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange text-white shadow-[0_10px_24px_rgba(239,93,39,.25)]">
        {company.logo_url ? (
          <img
            src={company.logo_url}
            alt="Company logo"
            className="h-full w-full object-contain bg-white"
          />
        ) : (
          <span className="font-display text-xl font-bold">
            {company.company_name.trim().charAt(0) || "R"}
          </span>
        )}
        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-navy bg-white" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <div className="truncate font-display text-[14px] font-bold tracking-[.08em] text-white">
            {company.company_name || "Company Profile"}
          </div>
          <div className="text-[9px] font-semibold tracking-[.18em] text-white/50">
            BILLING DESK
          </div>
        </div>
      )}
    </div>
  );
}

function PrintDocument({
  draft,
  company,
  onClose,
  onEdit,
}: {
  draft: Draft;
  company: Company;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const invoice = draft.type === "invoice";
  const activeRows = draft.rows.filter(
    r => r.description || Number(r.quantity)
  );
  const totals = calculateInvoiceTotals(
    activeRows.map(r => ({
      quantity: Number(r.quantity) || 0,
      rate: Number(r.rate) || 0,
      gstRate: Number(r.gstRate) || 0,
    })),
    "intra_state"
  );
  const paperRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const print = () => {
    window.print();
  };
  const downloadPdf = async () => {
    if (!paperRef.current || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const filename = `${draft.invoiceNumber || draft.documentNumber || "billing-document"}.pdf`;
      await html2pdf()
        .set({
          margin: 0,
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
            onclone: (clonedDocument: Document) => {
              const clonedPaper = clonedDocument.getElementById(
                "billing-pdf-document"
              );
              if (!clonedPaper || !paperRef.current) return;

              const sourceNodes = [
                paperRef.current,
                ...Array.from(paperRef.current.querySelectorAll("*")),
              ];
              const clonedNodes = [
                clonedPaper,
                ...Array.from(clonedPaper.querySelectorAll("*")),
              ];

              // html2canvas cannot parse modern oklab/oklch declarations
              // emitted by Tailwind. Inline the browser-resolved values,
              // which are RGB-compatible, then remove the original stylesheets.
              sourceNodes.forEach((sourceNode, index) => {
                const clonedNode = clonedNodes[index] as
                  | HTMLElement
                  | undefined;
                if (!clonedNode) return;
                const computed = window.getComputedStyle(sourceNode);
                for (
                  let propertyIndex = 0;
                  propertyIndex < computed.length;
                  propertyIndex += 1
                ) {
                  const property = computed.item(propertyIndex);
                  const value = computed.getPropertyValue(property);
                  if (value) clonedNode.style.setProperty(property, value);
                }
              });

              clonedDocument
                .querySelectorAll("style, link[rel='stylesheet']")
                .forEach((styleNode: Element) => styleNode.remove());
            },
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(paperRef.current)
        .save();
      toast.success("PDF downloaded");
    } catch (error) {
      console.error("PDF download failed", error);
      toast.error(
        error instanceof Error && error.message
          ? `Could not create the PDF: ${error.message}`
          : "Could not create the PDF. Please try again."
      );
    } finally {
      setDownloadingPdf(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-3 backdrop-blur-sm">
      <div className="flex max-h-[96vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line bg-[#fbfbfa] px-5 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-ink-muted hover:bg-black/5"
              aria-label="Back to editor"
            >
              <ArrowLeft size={17} />
            </button>
            <div>
              <div className="font-display text-sm font-bold uppercase tracking-[.12em] text-navy">
                Print preview
              </div>
              <div className="text-xs text-ink-muted">
                Actual A4 document • {draft.documentNumber}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={print}>
              <FileText size={15} /> Print
            </Button>
            <Button
              className="bg-orange text-white hover:bg-orange/90"
              onClick={downloadPdf}
              disabled={downloadingPdf}
            >
              <Download size={15} />
              {downloadingPdf ? "Creating PDF…" : "Download PDF"}
            </Button>
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                Edit
              </Button>
            )}
          </div>
        </div>
        <div className="overflow-auto bg-[#e9edf1] p-5">
          <div
            ref={paperRef}
            id="billing-pdf-document"
            className="invoice-paper mx-auto bg-white p-7 text-[10px] text-[#152a45] shadow-xl"
          >
            <div className="flex items-start justify-between border-b-2 border-[#152a45] pb-4">
              <div className="flex gap-3">
                {company.logo_url && (
                  <img
                    src={company.logo_url}
                    alt="Company logo"
                    className="h-14 w-14 object-contain"
                  />
                )}
                <div>
                  <div className="text-[9px] font-bold tracking-[.25em] text-[#ed5c27]">
                    {company.tagline || ""}
                  </div>
                  <div className="mt-1 break-words text-[24px] font-black tracking-[.04em]">
                    {company.company_name || "COMPANY NAME"}
                  </div>
                  <div className="mt-1 text-[9px] font-semibold tracking-[.18em] text-[#ed5c27]">
                    PRECISION • PERFORMANCE • TRUST
                  </div>
                </div>
              </div>
              <div className="max-w-[300px] text-right leading-4">
                <div className="font-bold">
                  GSTIN/UIN: {company.gstin || "—"}
                </div>
                <div>
                  {company.contact_phone || "—"} • {company.website || "—"}
                </div>
                <div>{company.address || "—"}</div>
                <div>
                  State Code: {company.state_code || "—"} • PAN:{" "}
                  {company.pan || "—"}
                </div>
              </div>
            </div>
            <div className="py-3 text-center text-[16px] font-black tracking-[.25em] text-[#ed5c27]">
              {invoice ? "TAX INVOICE" : "DELIVERY CHALLAN"}
            </div>
            <div className="grid grid-cols-[1.45fr_1fr] border border-[#152a45]">
              <div className="min-w-0 border-r border-[#152a45] p-3">
                <div className="mb-2 inline-block bg-[#152a45] px-2 py-1 text-[9px] font-bold uppercase tracking-[.15em] text-white">
                  Buyer (Customer)
                </div>
                <div className="break-words font-bold">
                  {draft.customer.name || "—"}
                </div>
                <div className="whitespace-pre-wrap break-words">
                  {draft.customer.address || "—"}
                </div>
                <div className="mt-1 font-semibold">
                  GSTIN/UIN: {draft.customer.gstin || "—"}
                </div>
              </div>
              <div className="p-3 leading-5">
                <div className="flex justify-between gap-3">
                  <b>{invoice ? "Invoice No." : "Invoice No."}</b>
                  <span>
                    {draft.invoiceNumber ||
                      (invoice ? draft.documentNumber : "—")}
                  </span>
                </div>
                {!invoice && (
                  <div className="flex justify-between gap-3">
                    <b>Challan No.</b>
                    <span>{draft.challanNumber || draft.documentNumber}</span>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <b>Date</b>
                  <span>{draft.date}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <b>{invoice ? "Challan No." : "Vehicle No."}</b>
                  <span>
                    {invoice
                      ? draft.challanNumber || "—"
                      : draft.vehicle || "—"}
                  </span>
                </div>
              </div>
            </div>
            <table className="mt-4 w-full table-fixed border-collapse border border-[#152a45] text-[9px]">
              <thead>
                <tr className="bg-[#152a45] text-white">
                  <th className="w-8 border-r border-white/30 p-2">Sr.</th>
                  <th className="border-r border-white/30 p-2 text-left">
                    Description of Goods
                  </th>
                  {invoice ? (
                    <>
                      <th className="w-16 border-r border-white/30 p-2">
                        HSN/SAC
                      </th>
                      <th className="w-12 border-r border-white/30 p-2">Qty</th>
                      <th className="w-16 border-r border-white/30 p-2 text-right">
                        Rate (₹)
                      </th>
                      <th className="w-20 p-2 text-right">Amount (₹)</th>
                    </>
                  ) : (
                    <>
                      <th className="w-20 border-r border-white/30 p-2">
                        Location
                      </th>
                      <th className="w-16 p-2">Quantity</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {(activeRows.length
                  ? activeRows
                  : [
                      {
                        description: "",
                        location: "",
                        hsn: "",
                        quantity: "",
                        rate: "",
                        gstRate: "18",
                        unit: "Nos",
                      },
                    ]
                ).map((row, i) => (
                  <tr key={i}>
                    <td className="border-t border-r border-[#152a45] p-2 text-center align-top">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td className="min-w-0 whitespace-pre-wrap break-words border-t border-r border-[#152a45] p-2 align-top">
                      {row.description}
                    </td>
                    {invoice ? (
                      <>
                        <td className="border-t border-r border-[#152a45] p-2 align-top">
                          {row.hsn}
                        </td>
                        <td className="border-t border-r border-[#152a45] p-2 text-center align-top">
                          {row.quantity}
                        </td>
                        <td className="border-t border-r border-[#152a45] p-2 text-right align-top">
                          {row.rate}
                        </td>
                        <td className="border-t border-[#152a45] p-2 text-right align-top">
                          {money(
                            (Number(row.quantity) || 0) *
                              (Number(row.rate) || 0)
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border-t border-r border-[#152a45] p-2 align-top">
                          {row.location}
                        </td>
                        <td className="border-t border-[#152a45] p-2 text-center align-top">
                          {row.quantity}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {invoice ? (
              <div className="mt-3 grid grid-cols-[1fr_230px] gap-6">
                <div className="min-h-[100px] break-words border border-[#152a45] p-3">
                  <div className="font-bold uppercase tracking-[.15em] text-[#ed5c27]">
                    Total in words
                  </div>
                  <div className="mt-2">{draft.notes || "—"}</div>
                </div>
                <div className="border border-[#152a45]">
                  <div className="flex justify-between border-b border-[#152a45] p-2">
                    <span>Amount Before GST</span>
                    <b>{money(totals.taxable)}</b>
                  </div>
                  <div className="flex justify-between border-b border-[#152a45] p-2">
                    <span>CGST / SGST</span>
                    <span>{money(totals.cgst + totals.sgst)}</span>
                  </div>
                  <div className="flex justify-between bg-[#ed5c27] p-2 font-black text-white">
                    <span>Total Amount</span>
                    <span>{money(totals.total)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-[1fr_230px] gap-6">
                <div className="min-h-[100px] whitespace-pre-wrap break-words border border-[#152a45] p-3">
                  <div className="font-bold uppercase tracking-[.15em] text-[#ed5c27]">
                    Remarks
                  </div>
                  {draft.notes}
                </div>
                <div className="border border-[#152a45] p-3 text-center font-bold">
                  FOR {company.company_name || "COMPANY NAME"}
                  <br />
                  <br />
                  <span className="font-normal">Authorised Signature</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Editor({
  initial,
  company,
  customers,
  products,
  onClose,
  onSaved,
  onPreview,
}: {
  initial: Draft;
  company: Company;
  customers: Customer[];
  products: Product[];
  onClose: () => void;
  onSaved: (draft: Draft) => void;
  onPreview: (draft: Draft) => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [customerQuery, setCustomerQuery] = useState(initial.customer.name);
  const [productQuery, setProductQuery] = useState("");
  const invoice = draft.type === "invoice";
  const storageKey = `reshma-draft-${draft.documentNumber}`;
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft, storageKey]);
  const totals = calculateInvoiceTotals(
    draft.rows.map(r => ({
      quantity: Number(r.quantity) || 0,
      rate: Number(r.rate) || 0,
      gstRate: Number(r.gstRate) || 0,
    })),
    "intra_state"
  );
  const update = (patch: Partial<Draft>) =>
    setDraft(current => ({ ...current, ...patch }));
  const updateRow = (index: number, patch: Partial<Row>) =>
    setDraft(current => ({
      ...current,
      rows: current.rows.map((row, i) =>
        i === index ? { ...row, ...patch } : row
      ),
    }));
  const save = async () => {
    onSaved({ ...draft, amount: totals.total });
    if (supabase) {
      const table = invoice ? "invoices" : "challans";
      const payload: Record<string, unknown> = invoice
        ? {
            document_number: draft.documentNumber,
            invoice_date: draft.date,
            challan_number: draft.challanNumber || null,
            place_of_supply: draft.customer.place_of_supply || null,
            taxable_amount: totals.taxable,
            cgst_amount: totals.cgst,
            sgst_amount: totals.sgst,
            igst_amount: totals.igst,
            total_amount: totals.total,
            status: "draft",
          }
        : {
            document_number: draft.documentNumber,
            challan_date: draft.date,
            invoice_number: draft.invoiceNumber || null,
            vehicle_number: draft.vehicle || null,
            status: "draft",
            notes: draft.notes || null,
          };
      let result: any;
      if (draft.id) {
        result = await supabase
          .from(table)
          .update(payload)
          .eq("id", draft.id)
          .select("id")
          .maybeSingle();
      } else {
        result = await supabase
          .from(table)
          .insert(payload as any)
          .select("id")
          .maybeSingle();
      }
      if (!result.error && result.data?.id && !draft.id)
        setDraft(current => ({ ...current, id: result.data.id }));
      const parentId = draft.id || result.data?.id;
      if (!result.error && parentId) {
        const itemTable = invoice ? "invoice_items" : "challan_items";
        const foreignKey = invoice ? "invoice_id" : "challan_id";
        await supabase.from(itemTable).delete().eq(foreignKey, parentId);
        const activeRows = draft.rows.filter(
          r => r.description || Number(r.quantity)
        );
        const items = invoice
          ? activeRows.map((row, index) => ({
              invoice_id: parentId,
              sr_no: index + 1,
              description: row.description,
              hsn_sac: row.hsn || null,
              quantity: Number(row.quantity) || 0,
              unit: row.unit || "Nos",
              rate: Number(row.rate) || 0,
              taxable_amount:
                (Number(row.quantity) || 0) * (Number(row.rate) || 0),
              gst_rate: Number(row.gstRate) || 0,
            }))
          : activeRows.map((row, index) => ({
              challan_id: parentId,
              sr_no: index + 1,
              particulars: row.description,
              location: row.location || null,
              quantity: Number(row.quantity) || 0,
              remarks: draft.notes || null,
            }));
        if (items.length) await supabase.from(itemTable).insert(items as any);
      }
    }
    toast.success("Draft saved", {
      description: `${draft.documentNumber} is available from Recent Documents.`,
    });
  };
  const chooseCustomer = (customer: Customer) => {
    update({ customer });
    setCustomerQuery(customer.name);
  };
  const matches = customers
    .filter(
      c =>
        customerQuery &&
        c.name.toLowerCase().includes(customerQuery.toLowerCase())
    )
    .slice(0, 5);
  const productMatches = products
    .filter(
      p =>
        productQuery &&
        `${p.part_code} ${p.description}`
          .toLowerCase()
          .includes(productQuery.toLowerCase())
    )
    .slice(0, 5);
  return (
    <div className="fixed inset-0 z-40 overflow-auto bg-navy/50 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-6 py-4">
          <div>
            <div className="eyebrow">
              {invoice ? "Tax invoice" : "Delivery challan"} • {draft.status}
            </div>
            <h2 className="font-display text-2xl font-bold text-navy">
              {draft.documentNumber}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onPreview({ ...draft, amount: totals.total })}
            >
              <FileCheck2 size={15} /> Preview & Print
            </Button>
            <Button
              onClick={save}
              className="bg-orange text-white hover:bg-orange/90"
            >
              Save Draft
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-ink-muted hover:bg-black/5"
              aria-label="Close editor"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="grid gap-5 p-6 lg:grid-cols-3">
          <section className="panel p-5 lg:col-span-2">
            <div className="eyebrow">Customer & document details</div>
            <div className="relative mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                value={customerQuery}
                onChange={e => {
                  setCustomerQuery(e.target.value);
                  update({
                    customer: { ...draft.customer, name: e.target.value },
                  });
                }}
                placeholder="Customer name"
              />
              {matches.length > 0 && (
                <div className="absolute left-0 top-11 z-10 w-full rounded-xl border border-line bg-white p-1 shadow-xl">
                  {matches.map(c => (
                    <button
                      key={c.id || c.name}
                      onClick={() => chooseCustomer(c)}
                      className="block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-[#f5f6f7]"
                    >
                      {c.name}
                      <span className="ml-2 text-ink-muted">{c.gstin}</span>
                    </button>
                  ))}
                </div>
              )}
              <Input
                value={draft.invoiceNumber || ""}
                onChange={e => update({ invoiceNumber: e.target.value })}
                placeholder="Invoice number (optional for challan)"
              />
              <Input
                value={draft.documentNumber}
                onChange={e => update({ documentNumber: e.target.value })}
                placeholder={
                  invoice ? "Bill / document number" : "Challan number"
                }
              />
              <Input
                value={draft.date}
                onChange={e => update({ date: e.target.value })}
                type="date"
              />
              <Textarea
                className="sm:col-span-2"
                value={draft.customer.address}
                onChange={e =>
                  update({
                    customer: { ...draft.customer, address: e.target.value },
                  })
                }
                placeholder="Customer address"
              />
              <div className="grid gap-3 sm:col-span-2 sm:grid-cols-3">
                <Input
                  value={draft.customer.gstin}
                  onChange={e =>
                    update({
                      customer: { ...draft.customer, gstin: e.target.value },
                    })
                  }
                  placeholder="GSTIN/UIN"
                />
                <Input
                  value={draft.customer.phone}
                  onChange={e =>
                    update({
                      customer: { ...draft.customer, phone: e.target.value },
                    })
                  }
                  placeholder="Contact number"
                />
                <Input
                  value={draft.customer.place_of_supply}
                  onChange={e =>
                    update({
                      customer: {
                        ...draft.customer,
                        place_of_supply: e.target.value,
                      },
                    })
                  }
                  placeholder="Place of supply"
                />
              </div>
              {invoice ? (
                <Input
                  value={draft.challanNumber}
                  onChange={e => update({ challanNumber: e.target.value })}
                  placeholder="Challan number (optional)"
                />
              ) : (
                <Input
                  value={draft.vehicle}
                  onChange={e => update({ vehicle: e.target.value })}
                  placeholder="Vehicle number"
                />
              )}
              <Textarea
                className="sm:col-span-2"
                value={draft.notes}
                onChange={e => update({ notes: e.target.value })}
                placeholder={invoice ? "Amount in words / terms" : "Remarks"}
              />
            </div>
          </section>
          <section className="panel p-5">
            <div className="eyebrow">Live total</div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">Amount before GST</span>
                <b>{money(totals.taxable)}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">CGST / SGST</span>
                <b>{money(totals.cgst + totals.sgst)}</b>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base text-navy">
                <span>Total</span>
                <b>{money(totals.total)}</b>
              </div>
              <div className="mt-5 rounded-xl bg-[#f5f6f7] p-3 text-xs text-ink-muted">
                Drafts auto-save locally while you type. Use Save Draft to sync
                the document record to Supabase.
              </div>
            </div>
          </section>
          <section className="panel overflow-hidden p-5 lg:col-span-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="eyebrow">Items</div>
                <h3 className="mt-1 font-display text-lg font-bold text-navy">
                  {invoice ? "Invoice rows" : "Challan rows"}
                </h3>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  setDraft(current => ({
                    ...current,
                    rows: [...current.rows, ...emptyRows(1)],
                  }))
                }
              >
                <Plus size={14} /> Add item row
              </Button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-[10px] uppercase tracking-[.12em] text-ink-muted">
                    <th className="w-10 p-2">#</th>
                    <th className="p-2">Description of goods</th>
                    {!invoice && <th className="w-32 p-2">Location</th>}
                    {invoice && <th className="w-24 p-2">HSN/SAC</th>}
                    <th className="w-20 p-2">Qty</th>
                    {invoice && (
                      <>
                        <th className="w-24 p-2">Rate</th>
                        <th className="w-24 p-2">GST %</th>
                      </>
                    )}
                    <th className="w-12 p-2" />
                  </tr>
                </thead>
                <tbody>
                  {draft.rows.map((row, index) => (
                    <tr key={index} className="border-b border-line/70">
                      <td className="p-2 text-ink-muted">{index + 1}</td>
                      <td className="relative p-2">
                        <Input
                          value={row.description}
                          onChange={e => {
                            updateRow(index, { description: e.target.value });
                            setProductQuery(e.target.value);
                          }}
                          className="h-8 min-w-[290px] text-xs"
                          placeholder="Description of goods"
                        />
                        {productMatches.length > 0 &&
                          index === draft.rows.findIndex(r => r === row) && (
                            <div className="absolute left-2 top-11 z-10 w-[290px] rounded-xl border border-line bg-white p-1 shadow-xl">
                              {productMatches.map(p => (
                                <button
                                  key={p.id || p.description}
                                  onClick={() => {
                                    updateRow(index, {
                                      description: p.description,
                                      hsn: p.hsn_sac,
                                      rate: String(p.default_rate),
                                      unit: p.unit,
                                      gstRate: String(p.default_gst_rate),
                                    });
                                    setProductQuery("");
                                  }}
                                  className="block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-[#f5f6f7]"
                                >
                                  {p.description}
                                </button>
                              ))}
                            </div>
                          )}
                      </td>
                      {!invoice && (
                        <td className="p-2">
                          <Input
                            value={row.location}
                            onChange={e =>
                              updateRow(index, { location: e.target.value })
                            }
                            className="h-8 text-xs"
                            placeholder="Location"
                          />
                        </td>
                      )}
                      {invoice && (
                        <td className="p-2">
                          <Input
                            value={row.hsn}
                            onChange={e =>
                              updateRow(index, { hsn: e.target.value })
                            }
                            className="h-8 text-xs"
                            placeholder="HSN"
                          />
                        </td>
                      )}
                      <td className="p-2">
                        <Input
                          value={row.quantity}
                          onChange={e =>
                            updateRow(index, { quantity: e.target.value })
                          }
                          className="h-8 text-xs"
                          placeholder="0"
                        />
                      </td>
                      {invoice && (
                        <>
                          <td className="p-2">
                            <Input
                              value={row.rate}
                              onChange={e =>
                                updateRow(index, { rate: e.target.value })
                              }
                              className="h-8 text-xs"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={row.gstRate}
                              onChange={e =>
                                updateRow(index, { gstRate: e.target.value })
                              }
                              className="h-8 text-xs"
                              placeholder="18"
                            />
                          </td>
                        </>
                      )}
                      <td className="p-2">
                        <button
                          disabled={draft.rows.length === 1}
                          onClick={() =>
                            setDraft(current => ({
                              ...current,
                              rows: current.rows.filter((_, i) => i !== index),
                            }))
                          }
                          className="rounded-lg p-2 text-ink-muted hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                          aria-label="Delete item row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({
  company,
  onClose,
  onSaved,
}: {
  company: Company;
  onClose: () => void;
  onSaved: (c: Company) => void;
}) {
  const [form, setForm] = useState(company);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (key: keyof Company, value: string) =>
    setForm(v => ({ ...v, [key]: value }));
  const upload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2_000_000) {
      toast.error("Use a PNG or JPG logo under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("logo_url", String(reader.result));
    reader.readAsDataURL(file);
  };
  const save = async () => {
    if (supabase && form.id)
      await supabase
        .from("company_settings")
        .update({
          company_name: form.company_name,
          tagline: form.tagline,
          address: form.address,
          gstin: form.gstin,
          pan: form.pan,
          state: form.state,
          state_code: form.state_code,
          contact_phone: form.contact_phone,
          contact_email: form.contact_email,
          website: form.website,
          logo_url: form.logo_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", form.id);
    localStorage.setItem("reshma-company", JSON.stringify(form));
    onSaved(form);
    toast.success("Company settings saved");
    onClose();
  };
  return (
    <div className="fixed inset-0 z-40 overflow-auto bg-navy/50 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <div className="eyebrow">Settings • Company profile & branding</div>
            <h2 className="font-display text-2xl font-bold text-navy">
              Company Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink-muted"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="sm:col-span-2 rounded-xl border border-line p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-[#f5f6f7]">
                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    alt="Uploaded logo"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="font-display text-2xl font-bold text-orange">
                    {form.company_name.charAt(0) || "R"}
                  </span>
                )}
              </div>
              <div>
                <div className="font-semibold text-navy">Company Branding</div>
                <div className="mt-1 text-xs text-ink-muted">
                  PNG or JPG, up to 2MB. Appears on invoice and challan
                  printouts.
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                  >
                    Upload Company Logo
                  </Button>
                  {form.logo_url && (
                    <Button
                      variant="outline"
                      onClick={() => set("logo_url", "")}
                    >
                      Remove
                    </Button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={e => upload(e.target.files?.[0])}
                  />
                </div>
              </div>
            </div>
          </div>
          <Input
            value={form.company_name}
            onChange={e => set("company_name", e.target.value)}
            placeholder="Company name"
          />
          <Input
            value={form.tagline}
            onChange={e => set("tagline", e.target.value)}
            placeholder="Tagline"
          />
          <Input
            value={form.gstin}
            onChange={e => set("gstin", e.target.value)}
            placeholder="GSTIN/UIN"
          />
          <Input
            value={form.pan}
            onChange={e => set("pan", e.target.value)}
            placeholder="PAN"
          />
          <Input
            value={form.state}
            onChange={e => set("state", e.target.value)}
            placeholder="State"
          />
          <Input
            value={form.state_code}
            onChange={e => set("state_code", e.target.value)}
            placeholder="State code"
          />
          <Input
            value={form.contact_phone}
            onChange={e => set("contact_phone", e.target.value)}
            placeholder="Phone number"
          />
          <Input
            value={form.contact_email}
            onChange={e => set("contact_email", e.target.value)}
            placeholder="Email"
          />
          <Input
            value={form.website}
            onChange={e => set("website", e.target.value)}
            placeholder="Website"
          />
          <Textarea
            className="sm:col-span-2"
            value={form.address}
            onChange={e => set("address", e.target.value)}
            placeholder="Address"
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={save}
            className="bg-orange text-white hover:bg-orange/90"
          >
            Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}

function MasterData({
  mode,
  customers,
  products,
  onCustomers,
  onProducts,
}: {
  mode: "Customers" | "Products & Parts";
  customers: Customer[];
  products: Product[];
  onCustomers: (v: Customer[]) => void;
  onProducts: (v: Product[]) => void;
}) {
  const isCustomer = mode === "Customers";
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Customer | Product | null>(null);
  const [form, setForm] = useState<any>(
    isCustomer
      ? { ...emptyCustomer }
      : {
          part_code: "",
          description: "",
          hsn_sac: "",
          unit: "Nos",
          default_rate: 0,
          default_gst_rate: 18,
          notes: "",
        }
  );
  const list = (isCustomer ? customers : products).filter(item =>
    JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
  );
  const save = async () => {
    if (isCustomer) {
      const next = {
        ...(form as Customer),
        id: editing?.id || crypto.randomUUID(),
      };
      onCustomers(
        customers.some(c => c.id === next.id)
          ? customers.map(c => (c.id === next.id ? next : c))
          : [next, ...customers]
      );
      if (supabase) await supabase.from("customers").upsert(next);
    } else {
      const next = {
        ...(form as Product),
        id: editing?.id || crypto.randomUUID(),
      };
      onProducts(
        products.some(p => p.id === next.id)
          ? products.map(p => (p.id === next.id ? next : p))
          : [next, ...products]
      );
      if (supabase) await supabase.from("products").upsert(next);
    }
    setEditing(null);
    setForm(
      isCustomer
        ? { ...emptyCustomer }
        : {
            part_code: "",
            description: "",
            hsn_sac: "",
            unit: "Nos",
            default_rate: 0,
            default_gst_rate: 18,
            notes: "",
          }
    );
    toast.success(`${mode.slice(0, -1)} saved`);
  };
  const remove = async (item: any) => {
    if (!confirm(`Delete ${item.name || item.description}?`)) return;
    if (isCustomer) {
      onCustomers(customers.filter(c => c.id !== item.id));
      if (supabase && item.id)
        await supabase.from("customers").delete().eq("id", item.id);
    } else {
      onProducts(products.filter(p => p.id !== item.id));
      if (supabase && item.id)
        await supabase.from("products").delete().eq("id", item.id);
    }
  };
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-5">
          <div>
            <div className="eyebrow">Manage</div>
            <h2 className="font-display text-xl font-bold text-navy">{mode}</h2>
          </div>
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="h-9 max-w-[240px]"
            placeholder={`Search ${mode.toLowerCase()}...`}
          />
        </div>
        <div className="divide-y divide-line">
          {list.length ? (
            list.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <div className="font-semibold text-navy">
                    {isCustomer
                      ? (item as Customer).name
                      : (item as Product).description}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {isCustomer
                      ? (item as Customer).gstin || (item as Customer).phone
                      : `${(item as Product).part_code || "No code"} • ${(item as Product).hsn_sac || "No HSN"} • ${money(Number((item as Product).default_rate || 0))}`}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(item);
                      setForm({ ...item });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => remove(item)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-sm text-ink-muted">
              No saved {mode.toLowerCase()} yet.
            </div>
          )}
        </div>
      </section>
      <section className="panel p-5">
        <div className="eyebrow">
          {editing ? "Edit" : "Add"}{" "}
          {isCustomer ? "customer" : "product / part"}
        </div>
        <div className="mt-4 space-y-3">
          {isCustomer ? (
            <>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Name"
              />
              <Textarea
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Address"
              />
              <Input
                value={form.gstin}
                onChange={e => setForm({ ...form, gstin: e.target.value })}
                placeholder="GSTIN/UIN"
              />
              <Input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="Contact number"
              />
              <Input
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
              />
              <Input
                value={form.place_of_supply}
                onChange={e =>
                  setForm({ ...form, place_of_supply: e.target.value })
                }
                placeholder="Default location / place of supply"
              />
            </>
          ) : (
            <>
              <Input
                value={form.part_code}
                onChange={e => setForm({ ...form, part_code: e.target.value })}
                placeholder="Part code"
              />
              <Textarea
                value={form.description}
                onChange={e =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Description"
              />
              <Input
                value={form.hsn_sac}
                onChange={e => setForm({ ...form, hsn_sac: e.target.value })}
                placeholder="HSN/SAC"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={form.unit}
                  onChange={e => setForm({ ...form, unit: e.target.value })}
                  placeholder="Unit"
                />
                <Input
                  type="number"
                  value={form.default_rate}
                  onChange={e =>
                    setForm({ ...form, default_rate: Number(e.target.value) })
                  }
                  placeholder="Default rate"
                />
              </div>
              <Input
                type="number"
                value={form.default_gst_rate}
                onChange={e =>
                  setForm({ ...form, default_gst_rate: Number(e.target.value) })
                }
                placeholder="GST %"
              />
              <Textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes"
              />
            </>
          )}
          <div className="flex gap-2">
            <Button
              onClick={save}
              className="bg-orange text-white hover:bg-orange/90"
            >
              {editing ? "Save changes" : "Add"}
            </Button>
            {editing && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setForm(
                    isCustomer
                      ? { ...emptyCustomer }
                      : {
                          part_code: "",
                          description: "",
                          hsn_sac: "",
                          unit: "Nos",
                          default_rate: 0,
                          default_gst_rate: 18,
                          notes: "",
                        }
                  );
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  const [company, setCompany] = useState<Company>(
    () =>
      JSON.parse(localStorage.getItem("reshma-company") || "null") ||
      emptyCompany
  );
  const [active, setActive] = useState("Overview");
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarSide, setSidebarSide] = useState<"left" | "right">("left");
  const [sidebarNavOpen, setSidebarNavOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [docs, setDocs] = useState<Doc[]>(() =>
    JSON.parse(localStorage.getItem("reshma-docs") || "[]")
  );
  const [editor, setEditor] = useState<Draft | null>(null);
  const [preview, setPreview] = useState<Draft | null>(null);
  const [settings, setSettings] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [period, setPeriod] = useState("This month");
  useEffect(() => {
    (async () => {
      const profile = await getCompanySettings();
      if (profile) setCompany(c => ({ ...c, ...profile }));
      if (!supabase) return;
      const [c, p] = await Promise.all([
        supabase
          .from("customers")
          .select("id,name,address,gstin,phone,email,place_of_supply")
          .order("name")
          .limit(200),
        supabase
          .from("products")
          .select(
            "id,part_code,description,hsn_sac,unit,default_rate,default_gst_rate,notes"
          )
          .order("description")
          .limit(200),
      ]);
      if (!c.error) setCustomers((c.data || []) as Customer[]);
      if (!p.error) setProducts((p.data || []) as Product[]);
      const [invoices, challans] = await Promise.all([
        supabase
          .from("invoices")
          .select(
            "id,document_number,invoice_date,total_amount,status,customer_id"
          )
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("challans")
          .select(
            "id,document_number,challan_date,invoice_number,status,customer_id"
          )
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      const dbDocs: Doc[] = [
        ...((invoices.data || []) as any[]).map(row => ({
          id: row.id,
          documentNumber: row.document_number,
          invoiceNumber: row.document_number,
          type: "invoice" as const,
          status: (row.status === "issued"
            ? "finalized"
            : "draft") as Draft["status"],
          customer: { ...emptyCustomer },
          date: row.invoice_date,
          vehicle: "",
          challanNumber: "",
          notes: "",
          rows: emptyRows(0),
          amount: Number(row.total_amount) || 0,
          tone: "navy",
        })),
        ...((challans.data || []) as any[]).map(row => ({
          id: row.id,
          documentNumber: row.document_number,
          invoiceNumber: row.invoice_number || "",
          type: "challan" as const,
          status: (row.status === "ready"
            ? "finalized"
            : "draft") as Draft["status"],
          customer: { ...emptyCustomer },
          date: row.challan_date,
          vehicle: "",
          challanNumber: row.document_number,
          notes: "",
          rows: emptyRows(0),
          amount: 0,
          tone: "orange",
        })),
      ];
      if (dbDocs.length)
        setDocs(current => [
          ...dbDocs,
          ...current.filter(
            doc => !dbDocs.some(db => db.documentNumber === doc.documentNumber)
          ),
        ]);
    })();
  }, []);
  useEffect(
    () => localStorage.setItem("reshma-docs", JSON.stringify(docs)),
    [docs]
  );
  const filtered = useMemo(
    () =>
      docs.filter(d =>
        `${d.documentNumber} ${d.customer.name} ${d.type}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [docs, query]
  );
  const openNew = (type: "invoice" | "challan") => setEditor(blankDraft(type));
  const saveDoc = (draft: Draft) =>
    setDocs(current => {
      const doc = {
        ...draft,
        tone: draft.type === "invoice" ? "navy" : "orange",
      };
      return current.some(d => d.documentNumber === draft.documentNumber)
        ? current.map(d =>
            d.documentNumber === draft.documentNumber ? doc : d
          )
        : [doc, ...current];
    });
  const openDoc = (doc: Doc) => {
    const stored = localStorage.getItem(`reshma-draft-${doc.documentNumber}`);
    setEditor(stored ? JSON.parse(stored) : doc);
    if (!stored && supabase && doc.id) {
      const itemTable =
        doc.type === "invoice" ? "invoice_items" : "challan_items";
      const foreignKey = doc.type === "invoice" ? "invoice_id" : "challan_id";
      supabase
        .from(itemTable)
        .select("*")
        .eq(foreignKey, doc.id)
        .order("sr_no")
        .then(({ data }) => {
          if (!data?.length) return;
          const rows = (data as any[]).map(row => ({
            description: row.description || row.particulars || "",
            location: row.location || "",
            hsn: row.hsn_sac || "",
            quantity: String(row.quantity ?? ""),
            rate: String(row.rate ?? ""),
            gstRate: String(row.gst_rate ?? "18"),
            unit: row.unit || "Nos",
          }));
          setEditor(current =>
            current?.documentNumber === doc.documentNumber
              ? { ...current, rows }
              : current
          );
        });
    }
  };
  const duplicateDoc = (doc: Doc) => {
    const copy = {
      ...doc,
      id: undefined,
      documentNumber: `${doc.type === "invoice" ? "INV" : "CH"}-DRAFT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      status: "draft" as const,
      customer: { ...doc.customer },
      rows: doc.rows.map(row => ({ ...row })),
    };
    setEditor(copy);
    toast.success("Document duplicated", {
      description: "The duplicate is a new editable draft.",
    });
  };
  const deleteDoc = async (doc: Doc) => {
    if (!confirm(`Delete ${doc.documentNumber}?`)) return;
    setDocs(current =>
      current.filter(d => d.documentNumber !== doc.documentNumber)
    );
    localStorage.removeItem(`reshma-draft-${doc.documentNumber}`);
    if (supabase && doc.id)
      await supabase
        .from(doc.type === "invoice" ? "invoices" : "challans")
        .delete()
        .eq("id", doc.id);
    toast.success("Document deleted");
  };
  const go = (section: string) => {
    setActive(section);
    setMobileNav(false);
    if (section === "Settings") setSettings(true);
  };
  const stats = {
    invoices: docs.filter(d => d.type === "invoice").length,
    invoiceDrafts: docs.filter(
      d => d.type === "invoice" && d.status === "draft"
    ).length,
    challans: docs.filter(d => d.type === "challan").length,
    challanDrafts: docs.filter(
      d => d.type === "challan" && d.status === "draft"
    ).length,
  };
  const exportDocs = () => {
    const csv = toDocumentsCsv(
      docs.map(d => ({
        number: d.documentNumber,
        type: d.type === "invoice" ? "Tax Invoice" : "Delivery Challan",
        customer: d.customer.name,
        date: d.date,
        amount:
          d.type === "invoice"
            ? money(d.amount)
            : `${d.rows.filter(r => r.description).length} items`,
        status: d.status,
      }))
    );
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "reshma-documents.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  };
  const content =
    active === "Customers" || active === "Products & Parts" ? (
      <MasterData
        mode={active}
        customers={customers}
        products={products}
        onCustomers={setCustomers}
        onProducts={setProducts}
      />
    ) : (
      <>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-orange">
              <Sparkles size={14} />{" "}
              {company.tagline || "Production billing workspace"}
            </div>
            <h1 className="font-display text-[32px] font-bold tracking-[-.04em] text-navy sm:text-[38px]">
              {active === "Overview" ? "Good afternoon." : active}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {active === "Overview"
                ? "Your live billing desk, ready for real records."
                : `Manage ${active.toLowerCase()} from one place.`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setPeriod(
                  period === "This month"
                    ? "Last month"
                    : period === "Last month"
                      ? "This FY"
                      : "This month"
                )
              }
              className="h-10 gap-2 bg-white text-xs"
            >
              <Filter size={15} /> {period} <ChevronDown size={14} />
            </Button>
            <Button
              onClick={() => openNew("invoice")}
              className="h-10 gap-2 bg-orange text-white hover:bg-orange/90"
            >
              <Plus size={16} /> Create invoice
            </Button>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <Stat
            label="Total invoices"
            value={stats.invoices}
            icon={FileText}
            tone="blue"
          />
          <Stat
            label="Draft invoices"
            value={stats.invoiceDrafts}
            icon={FileCheck2}
            tone="orange"
          />
          <Stat
            label="Finalized invoices"
            value={stats.invoices - stats.invoiceDrafts}
            icon={ShieldCheck}
            tone="green"
          />
          <Stat
            label="Total challans"
            value={stats.challans}
            icon={Truck}
            tone="orange"
          />
          <Stat
            label="Draft challans"
            value={stats.challanDrafts}
            icon={ClipboardList}
            tone="blue"
          />
          <Stat
            label="Customers / parts"
            value={customers.length + products.length}
            icon={Users}
            tone="purple"
          />
        </div>
        <div className="mt-6 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
          <section className="panel overflow-hidden">
            <div className="border-b border-line px-5 py-5">
              <div className="eyebrow">Sales overview</div>
              <h2 className="mt-1 font-display text-2xl font-bold text-navy">
                {docs.length
                  ? `${docs.length} live documents`
                  : "No sales data yet"}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Create or import an invoice to see live sales analytics.
              </p>
            </div>
            <div className="flex h-[190px] items-center justify-center text-center text-sm text-ink-muted">
              <div>
                <ClipboardList className="mx-auto mb-3" size={28} />
                <div>Charts will populate from issued invoices.</div>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="px-5 py-5">
              <div className="eyebrow">Quick actions</div>
              <h2 className="mt-1 font-display text-xl font-bold text-navy">
                Start a real document
              </h2>
            </div>
            <div className="space-y-2 px-5 pb-5">
              <button
                onClick={() => openNew("invoice")}
                className="quick-action"
              >
                <span className="quick-icon bg-orange/10 text-orange">
                  <FilePlus2 size={17} />
                </span>
                <span>
                  <b>Create invoice</b>
                  <small>Save, reopen and print drafts</small>
                </span>
                <ArrowUpRight size={16} className="ml-auto text-ink-muted" />
              </button>
              <button
                onClick={() => openNew("challan")}
                className="quick-action"
              >
                <span className="quick-icon bg-blue/10 text-blue">
                  <Truck size={17} />
                </span>
                <span>
                  <b>New delivery challan</b>
                  <small>20-row goods dispatch form</small>
                </span>
                <ArrowUpRight size={16} className="ml-auto text-ink-muted" />
              </button>
              <button
                onClick={() =>
                  toast.info("Import flow ready", {
                    description:
                      "Upload preview and column mapping is the next import step.",
                  })
                }
                className="quick-action"
              >
                <span className="quick-icon bg-green/10 text-green">
                  <Upload size={17} />
                </span>
                <span>
                  <b>Import from Excel / CSV</b>
                  <small>Review before saving</small>
                </span>
                <ArrowUpRight size={16} className="ml-auto text-ink-muted" />
              </button>
            </div>
          </section>
        </div>
        <section className="panel mt-5">
          <div className="flex flex-col gap-4 border-b border-line px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="eyebrow">Recent documents</div>
              <h2 className="mt-1 font-display text-xl font-bold text-navy">
                Document history
              </h2>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={exportDocs}
                className="h-9 gap-2 bg-white text-xs"
              >
                <Download size={14} /> Export
              </Button>
              <Button
                variant="outline"
                onClick={() => openNew("invoice")}
                className="h-9 gap-2 bg-white text-xs"
              >
                <Plus size={14} /> New
              </Button>
            </div>
          </div>
          {filtered.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-line text-[10px] uppercase tracking-[.12em] text-ink-muted">
                    <th className="px-5 py-3">Document</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Amount / items</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(doc => (
                    <tr
                      key={doc.documentNumber}
                      className="border-b border-line/70 text-sm last:border-0"
                    >
                      <td className="px-5 py-4 font-semibold text-navy">
                        {doc.documentNumber}
                      </td>
                      <td className="px-4 py-4 text-ink-muted">
                        {doc.type === "invoice"
                          ? "Tax Invoice"
                          : "Delivery Challan"}
                      </td>
                      <td className="px-4 py-4 text-xs text-ink-muted">
                        {doc.date}
                      </td>
                      <td className="px-4 py-4">{doc.customer.name || "—"}</td>
                      <td className="px-4 py-4 font-semibold">
                        {doc.type === "invoice"
                          ? money(doc.amount)
                          : `${doc.rows.filter(r => r.description).length} items`}
                      </td>
                      <td className="px-4 py-4">
                        <span className="status">{doc.status}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDoc(doc)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreview(doc)}
                          >
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => duplicateDoc(doc)}
                            title="Duplicate document"
                          >
                            <Copy size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteDoc(doc)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText className="mx-auto mb-3 text-ink-muted" size={28} />
              <div className="font-display text-lg font-bold text-navy">
                No documents created yet
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                Create an invoice or delivery challan to start your history.
              </p>
            </div>
          )}
        </section>
      </>
    );
  return (
    <div className="min-h-screen bg-[#f5f6f7] text-ink">
      <aside
        className={`fixed inset-y-0 z-30 hidden shrink-0 flex-col overflow-y-auto overscroll-contain bg-navy px-4 py-5 text-white transition-all lg:flex ${sidebarSide === "left" ? "left-0" : "right-0"} ${collapsed ? "w-[82px]" : "w-[250px]"}`}
      >
        <div className="flex items-center justify-between px-1">
          <Logo company={company} collapsed={collapsed} />
          <button
            onClick={() => setCollapsed(v => !v)}
            className="rounded-lg p-2 text-white/55 hover:bg-white/10"
            aria-label="Collapse sidebar"
          >
            {collapsed ? <ChevronLeft size={17} /> : <PanelLeft size={17} />}
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setSidebarSide(sidebarSide === "left" ? "right" : "left")
              }
              className="rounded-lg p-2 text-white/55 hover:bg-white/10"
              aria-label="Slide sidebar left or right"
              title="Slide sidebar left / right"
            >
              {sidebarSide === "left" ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </button>
            <button
              onClick={() => setSidebarNavOpen(v => !v)}
              className="rounded-lg p-2 text-white/55 hover:bg-white/10"
              aria-label="Slide sidebar navigation up or down"
              title="Slide sidebar navigation up / down"
            >
              {sidebarNavOpen ? (
                <ChevronsUp size={16} />
              ) : (
                <ChevronsDown size={16} />
              )}
            </button>
          </div>
        </div>
        {!collapsed && (
          <div className="mt-10 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
            <BriefcaseBusiness size={16} className="text-orange" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">
                Main workspace
              </div>
              <div className="text-[10px] text-white/45">Production data</div>
            </div>
            <ChevronDown size={14} className="text-white/40" />
          </div>
        )}
        <nav
          className={`mt-8 flex-none space-y-7 transition-all duration-300 ${sidebarNavOpen ? "max-h-[2000px] opacity-100" : "max-h-0 overflow-hidden opacity-0"}`}
        >
          {navGroups.map(group => (
            <div key={group.label}>
              <div
                className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/35 ${collapsed ? "hidden" : "block"}`}
              >
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map(item => (
                  <button
                    title={collapsed ? item.label : undefined}
                    key={item.label}
                    onClick={() => go(item.label)}
                    className={`sidebar-link ${active === item.label ? "active" : ""} ${collapsed ? "justify-center px-2" : ""}`}
                  >
                    <item.icon size={17} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        {!collapsed && (
          <div className="border-t border-white/10 pt-4">
            <div className="px-2 text-xs font-semibold">
              Authenticated workspace
            </div>
            <div className="px-2 text-[10px] text-white/45">
              Ready for production records
            </div>
          </div>
        )}
      </aside>
      <div
        className={`transition-all ${sidebarSide === "left" ? (collapsed ? "lg:pl-[82px]" : "lg:pl-[250px]") : collapsed ? "lg:pr-[82px]" : "lg:pr-[250px]"}`}
      >
        <header className="sticky top-0 z-20 border-b border-line bg-[#f5f6f7]/90 backdrop-blur">
          <div className="flex h-[74px] items-center gap-4 px-5 sm:px-8">
            <button
              onClick={() => setMobileNav(true)}
              className="rounded-lg p-2 text-ink-muted lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <div className="hidden items-center gap-2 text-sm text-ink-muted sm:flex">
              <ShieldCheck size={16} className="text-green" />
              <span>Supabase workspace connected</span>
            </div>
            <div className="relative ml-auto w-full max-w-[300px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                size={16}
              />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search documents..."
                className="h-10 border-line bg-white pl-9 text-xs shadow-none"
              />
            </div>
            <button
              className="rounded-xl border border-line bg-white p-2.5 text-ink-muted"
              aria-label="Notifications"
            >
              <Bell size={17} />
            </button>
            <Button
              onClick={() => openNew("invoice")}
              className="h-10 gap-2 bg-orange px-4 text-xs font-bold text-white hover:bg-orange/90"
            >
              <Plus size={16} /> Create new
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8">
          {content}
        </main>
      </div>
      {mobileNav && (
        <div
          className="fixed inset-0 z-50 bg-navy/50 lg:hidden"
          onClick={() => setMobileNav(false)}
        >
          <aside
            className="h-full w-[280px] overflow-y-auto overscroll-contain bg-navy p-5 text-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Logo company={company} />
              <button onClick={() => setMobileNav(false)}>
                <X size={18} />
              </button>
            </div>
            <nav className="mt-8 space-y-2">
              {navGroups
                .flatMap(g => g.items)
                .map(item => (
                  <button
                    key={item.label}
                    onClick={() => go(item.label)}
                    className="sidebar-link"
                  >
                    <item.icon size={17} />
                    <span>{item.label}</span>
                  </button>
                ))}
            </nav>
          </aside>
        </div>
      )}
      {settings && (
        <SettingsPanel
          company={company}
          onClose={() => setSettings(false)}
          onSaved={setCompany}
        />
      )}
      {editor && (
        <Editor
          initial={editor}
          company={company}
          customers={customers}
          products={products}
          onClose={() => setEditor(null)}
          onSaved={saveDoc}
          onPreview={setPreview}
        />
      )}
      {preview && (
        <PrintDocument
          draft={preview}
          company={company}
          onClose={() => setPreview(null)}
          onEdit={() => {
            setEditor(preview);
            setPreview(null);
          }}
        />
      )}
    </div>
  );
}
function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: any;
  tone: string;
}) {
  return (
    <div className="stat-card">
      <div className={`icon-tile ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="mt-4 text-[10px] font-semibold uppercase tracking-[.12em] text-ink-muted">
        {label}
      </div>
      <div className="mt-1 font-display text-[25px] font-bold text-ink">
        {value}
      </div>
    </div>
  );
}
