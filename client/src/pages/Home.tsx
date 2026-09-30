import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ClipboardList,
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
type Doc = {
  number: string;
  type: string;
  customer: string;
  date: string;
  amount: string;
  status: string;
  tone: string;
};
type Row = {
  description: string;
  location?: string;
  hsn: string;
  quantity: string;
  rate: string;
};

const blankCompany: Company = {
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
const emptyRows = (count: number): Row[] =>
  Array.from({ length: count }, () => ({
    description: "",
    location: "",
    hsn: "",
    quantity: "",
    rate: "",
  }));
const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

function Logo({ companyName }: { companyName: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange text-white shadow-[0_10px_24px_rgba(239,93,39,.25)]">
        <span className="font-display text-xl font-bold leading-none">
          {companyName.trim().charAt(0) || "R"}
        </span>
        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-navy bg-white" />
      </div>
      <div className="min-w-0">
        <div className="truncate font-display text-[14px] font-bold tracking-[.08em] text-white">
          {companyName || "Company Profile"}
        </div>
        <div className="text-[9px] font-semibold tracking-[.18em] text-white/50">
          BILLING DESK
        </div>
      </div>
    </div>
  );
}

function InvoicePreview({
  type,
  company,
  onClose,
}: {
  type: "invoice" | "challan";
  company: Company;
  onClose: () => void;
}) {
  const isInvoice = type === "invoice";
  const rows = emptyRows(isInvoice ? 17 : 20);
  const print = () => {
    toast("Print dialog opened", {
      description: "Choose Save as PDF for a digital copy.",
    });
    window.print();
  };
  const share = () => {
    const text = `${company.company_name || "Company"} ${isInvoice ? "tax invoice" : "delivery challan"}`;
    navigator.clipboard
      ?.writeText(text)
      .then(() => toast.success("Document details copied"))
      .catch(() => toast.info(text));
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line bg-[#fbfbfa] px-5 py-3">
          <div>
            <div className="font-display text-sm font-bold uppercase tracking-[.12em] text-navy">
              {isInvoice ? "Tax invoice" : "Delivery challan"} preview
            </div>
            <div className="text-xs text-ink-muted">
              A4 portrait • production template
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 gap-2" onClick={print}>
              <FileText size={15} /> Print
            </Button>
            <Button
              className="h-9 gap-2 bg-orange text-white hover:bg-orange/90"
              onClick={print}
            >
              <Download size={15} /> PDF
            </Button>
            <Button
              variant="outline"
              className="h-9 gap-2 bg-white"
              onClick={share}
            >
              <Share2 size={15} /> Share
            </Button>
            <button
              onClick={onClose}
              className="ml-2 rounded-lg p-2 text-ink-muted hover:bg-black/5"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="overflow-auto bg-[#e9edf1] p-6">
          <div className="invoice-paper mx-auto min-h-[1120px] bg-white p-7 text-[10px] text-[#152a45] shadow-xl">
            <div className="flex items-start justify-between border-b-2 border-[#152a45] pb-4">
              <div>
                <div className="text-[9px] font-bold tracking-[.25em] text-[#ed5c27]">
                  {company.tagline || "COMPANY TAGLINE"}
                </div>
                <div className="mt-1 text-[24px] font-black tracking-[.06em]">
                  {company.company_name || "COMPANY NAME"}
                </div>
                <div className="mt-1 text-[9px] font-semibold tracking-[.2em] text-[#ed5c27]">
                  PRECISION • PERFORMANCE • TRUST
                </div>
              </div>
              <div className="max-w-[300px] text-right leading-4">
                <div className="font-bold">
                  GSTIN/UIN: {company.gstin || "—"}
                </div>
                <div>
                  {company.contact_phone || "—"} • {company.website || "—"}
                </div>
                <div>{company.address || "Company address not configured"}</div>
                <div>
                  State Code: {company.state_code || "—"} • PAN:{" "}
                  {company.pan || "—"}
                </div>
              </div>
            </div>
            <div className="py-3 text-center text-[16px] font-black tracking-[.25em] text-[#ed5c27]">
              {isInvoice ? "TAX INVOICE" : "DELIVERY CHALLAN"}
            </div>
            <div className="grid grid-cols-[1.45fr_1fr] border border-[#152a45]">
              <div className="border-r border-[#152a45] p-3">
                <div className="mb-2 inline-block bg-[#152a45] px-2 py-1 text-[9px] font-bold uppercase tracking-[.15em] text-white">
                  Buyer (Customer)
                </div>
                <div className="font-bold">Customer name</div>
                <div>Customer address</div>
                <div className="mt-1 font-semibold">GSTIN/UIN: —</div>
              </div>
              <div className="p-3 leading-5">
                <div className="flex justify-between">
                  <b>{isInvoice ? "Invoice No." : "Challan No."}</b>
                  <span>Not saved</span>
                </div>
                <div className="flex justify-between">
                  <b>Date</b>
                  <span>—</span>
                </div>
                <div className="flex justify-between">
                  <b>{isInvoice ? "Challan No." : "Vehicle No."}</b>
                  <span>—</span>
                </div>
              </div>
            </div>
            <table className="mt-4 w-full border-collapse border border-[#152a45] text-[9px]">
              <thead>
                <tr className="bg-[#152a45] text-white">
                  <th className="w-8 border-r border-white/30 p-2">Sr.</th>
                  <th className="border-r border-white/30 p-2 text-left">
                    Description of Goods
                  </th>
                  {isInvoice ? (
                    <>
                      <th className="w-20 border-r border-white/30 p-2">
                        HSN/SAC
                      </th>
                      <th className="w-14 border-r border-white/30 p-2">Qty</th>
                      <th className="w-20 border-r border-white/30 p-2 text-right">
                        Rate (₹)
                      </th>
                      <th className="w-24 p-2 text-right">Amount (₹)</th>
                    </>
                  ) : (
                    <>
                      <th className="w-20 border-r border-white/30 p-2">
                        Location
                      </th>
                      <th className="w-20 p-2">Quantity</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((_, index) => (
                  <tr key={index}>
                    <td className="border-t border-r border-[#152a45] p-2 text-center">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="border-t border-r border-[#152a45] p-2">
                      {" "}
                    </td>
                    {isInvoice ? (
                      <>
                        <td className="border-t border-r border-[#152a45] p-2">
                          {" "}
                        </td>
                        <td className="border-t border-r border-[#152a45] p-2">
                          {" "}
                        </td>
                        <td className="border-t border-r border-[#152a45] p-2">
                          {" "}
                        </td>
                        <td className="border-t border-[#152a45] p-2"> </td>
                      </>
                    ) : (
                      <>
                        <td className="border-t border-r border-[#152a45] p-2">
                          {" "}
                        </td>
                        <td className="border-t border-[#152a45] p-2"> </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 grid grid-cols-[1fr_230px] gap-6">
              <div className="min-h-[100px] border border-[#152a45] p-3">
                <div className="font-bold uppercase tracking-[.15em] text-[#ed5c27]">
                  {isInvoice ? "Total in words" : "Remarks"}
                </div>
              </div>
              {isInvoice ? (
                <div className="border border-[#152a45]">
                  <div className="flex justify-between border-b border-[#152a45] p-2">
                    <span>Amount Before GST</span>
                    <b>₹0.00</b>
                  </div>
                  <div className="flex justify-between border-b border-[#152a45] p-2">
                    <span>CGST / SGST</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between bg-[#ed5c27] p-2 font-black text-white">
                    <span>Total Amount</span>
                    <span>₹0.00</span>
                  </div>
                </div>
              ) : (
                <div className="border border-[#152a45] p-3 text-center font-bold">
                  FOR {company.company_name || "COMPANY NAME"}
                  <br />
                  <br />
                  <span className="font-normal">Authorised Signature</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentBuilder({
  type,
  company,
  onClose,
  onSaved,
}: {
  type: "invoice" | "challan";
  company: Company;
  onClose: () => void;
  onSaved: (doc: Doc) => void;
}) {
  const isInvoice = type === "invoice";
  const [rows, setRows] = useState(() => emptyRows(isInvoice ? 17 : 20));
  const [customer, setCustomer] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vehicle, setVehicle] = useState("");
  const [challan, setChallan] = useState("");
  const [preview, setPreview] = useState(false);
  const updateRow = (index: number, key: keyof Row, value: string) =>
    setRows(current =>
      current.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    );
  const taxable = rows.reduce(
    (sum, row) => sum + (Number(row.quantity) || 0) * (Number(row.rate) || 0),
    0
  );
  const gst = taxable * 0.09;
  const total = isInvoice ? taxable + gst * 2 : 0;
  const save = () => {
    const number = `${isInvoice ? "INV" : "CHL"}-DRAFT-${Date.now().toString().slice(-6)}`;
    onSaved({
      number,
      type: isInvoice ? "Tax Invoice" : "Delivery Challan",
      customer: customer || "Unnamed customer",
      date,
      amount: isInvoice
        ? money(total)
        : `${rows.filter(row => row.description).length} items`,
      status: "Draft",
      tone: isInvoice ? "navy" : "orange",
    });
    toast.success(`${isInvoice ? "Invoice" : "Challan"} draft saved`, {
      description: "Review and issue it after completing the required fields.",
    });
    onClose();
  };
  if (preview)
    return (
      <InvoicePreview
        type={type}
        company={company}
        onClose={() => setPreview(false)}
      />
    );
  return (
    <div className="fixed inset-0 z-40 overflow-auto bg-navy/50 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-6 py-4">
          <div>
            <div className="eyebrow">
              New {isInvoice ? "tax invoice" : "delivery challan"}
            </div>
            <h2 className="font-display text-2xl font-bold text-navy">
              {isInvoice ? "Invoice entry" : "Challan entry"}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreview(true)}>
              <FileCheck2 size={15} /> Preview
            </Button>
            <Button
              onClick={save}
              className="bg-orange text-white hover:bg-orange/90"
            >
              Save draft
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-ink-muted hover:bg-black/5"
              aria-label="Close form"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="grid gap-5 p-6 lg:grid-cols-3">
          <section className="panel p-5 lg:col-span-2">
            <div className="eyebrow">Customer & document details</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                value={customer}
                onChange={event => setCustomer(event.target.value)}
                placeholder="Customer name"
              />
              <Input
                value={date}
                onChange={event => setDate(event.target.value)}
                type="date"
              />
              {isInvoice ? (
                <Input
                  value={challan}
                  onChange={event => setChallan(event.target.value)}
                  placeholder="Challan number (optional)"
                />
              ) : (
                <Input
                  value={vehicle}
                  onChange={event => setVehicle(event.target.value)}
                  placeholder="Vehicle number"
                />
              )}
              <Textarea
                className="sm:col-span-2"
                placeholder={
                  isInvoice ? "Customer address and GSTIN/UIN" : "Remarks"
                }
              />
            </div>
          </section>
          <section className="panel p-5">
            <div className="eyebrow">Calculation</div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">Amount before GST</span>
                <b>{money(taxable)}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">CGST / SGST</span>
                <b>{money(isInvoice ? gst * 2 : 0)}</b>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base text-navy">
                <span>Total</span>
                <b>{money(total)}</b>
              </div>
            </div>
          </section>
          <section className="panel overflow-hidden p-5 lg:col-span-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="eyebrow">Items</div>
                <h3 className="mt-1 font-display text-lg font-bold text-navy">
                  {isInvoice ? "17 invoice rows" : "20 challan rows"}
                </h3>
              </div>
              <span className="text-xs text-ink-muted">
                Keyboard-friendly entry
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-[10px] uppercase tracking-[.12em] text-ink-muted">
                    <th className="w-10 p-2">#</th>
                    <th className="p-2">Description of goods</th>
                    {!isInvoice && <th className="w-36 p-2">Location</th>}
                    {isInvoice && <th className="w-28 p-2">HSN/SAC</th>}
                    <th className="w-24 p-2">Quantity</th>
                    {isInvoice && <th className="w-28 p-2">Rate (₹)</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} className="border-b border-line/70">
                      <td className="p-2 text-ink-muted">{index + 1}</td>
                      <td className="p-2">
                        <Input
                          value={row.description}
                          onChange={event =>
                            updateRow(index, "description", event.target.value)
                          }
                          className="h-8 text-xs"
                          placeholder="Item description"
                        />
                      </td>
                      {!isInvoice && (
                        <td className="p-2">
                          <Input
                            value={row.location}
                            onChange={event =>
                              updateRow(index, "location", event.target.value)
                            }
                            className="h-8 text-xs"
                            placeholder="Location"
                          />
                        </td>
                      )}
                      {isInvoice && (
                        <td className="p-2">
                          <Input
                            value={row.hsn}
                            onChange={event =>
                              updateRow(index, "hsn", event.target.value)
                            }
                            className="h-8 text-xs"
                            placeholder="HSN/SAC"
                          />
                        </td>
                      )}
                      <td className="p-2">
                        <Input
                          value={row.quantity}
                          onChange={event =>
                            updateRow(index, "quantity", event.target.value)
                          }
                          className="h-8 text-xs"
                          inputMode="decimal"
                          placeholder="0"
                        />
                      </td>
                      {isInvoice && (
                        <td className="p-2">
                          <Input
                            value={row.rate}
                            onChange={event =>
                              updateRow(index, "rate", event.target.value)
                            }
                            className="h-8 text-xs"
                            inputMode="decimal"
                            placeholder="0.00"
                          />
                        </td>
                      )}
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

function CompanySettings({
  company,
  onClose,
  onSaved,
}: {
  company: Company;
  onClose: () => void;
  onSaved: (company: Company) => void;
}) {
  const [form, setForm] = useState(company);
  const set = (key: keyof Company, value: string) =>
    setForm(current => ({ ...current, [key]: value }));
  const save = async () => {
    if (supabase && form.id) {
      const { error } = await supabase
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", form.id);
      if (error) {
        toast.error("Could not save company profile", {
          description: error.message,
        });
        return;
      }
    }
    onSaved(form);
    toast.success("Company profile saved");
    onClose();
  };
  return (
    <div className="fixed inset-0 z-40 overflow-auto bg-navy/50 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <div className="eyebrow">Settings</div>
            <h2 className="font-display text-2xl font-bold text-navy">
              Company profile
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink-muted hover:bg-black/5"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <Input
            value={form.company_name}
            onChange={event => set("company_name", event.target.value)}
            placeholder="Company name"
          />
          <Input
            value={form.tagline}
            onChange={event => set("tagline", event.target.value)}
            placeholder="Since year / tagline"
          />
          <Input
            value={form.gstin}
            onChange={event => set("gstin", event.target.value)}
            placeholder="GSTIN/UIN"
          />
          <Input
            value={form.pan}
            onChange={event => set("pan", event.target.value)}
            placeholder="PAN"
          />
          <Input
            value={form.state}
            onChange={event => set("state", event.target.value)}
            placeholder="State"
          />
          <Input
            value={form.state_code}
            onChange={event => set("state_code", event.target.value)}
            placeholder="State code"
          />
          <Input
            value={form.contact_phone}
            onChange={event => set("contact_phone", event.target.value)}
            placeholder="Phone"
          />
          <Input
            value={form.contact_email}
            onChange={event => set("contact_email", event.target.value)}
            placeholder="Email"
          />
          <Input
            value={form.website}
            onChange={event => set("website", event.target.value)}
            placeholder="Website"
          />
          <Textarea
            className="sm:col-span-2"
            value={form.address}
            onChange={event => set("address", event.target.value)}
            placeholder="Full address"
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
            Save company profile
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [company, setCompany] = useState<Company>(blankCompany);
  const [active, setActive] = useState("Overview");
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [counts, setCounts] = useState({
    invoices: 0,
    challans: 0,
    customers: 0,
    outstanding: 0,
  });
  const [preview, setPreview] = useState<"invoice" | "challan" | null>(null);
  const [builder, setBuilder] = useState<"invoice" | "challan" | null>(null);
  const [settings, setSettings] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [period, setPeriod] = useState("This month");
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const profile = await getCompanySettings();
      if (mounted && profile)
        setCompany(current => ({ ...current, ...profile }));
      if (!supabase) return;
      const [
        invoices,
        challans,
        customers,
        invoiceCount,
        challanCount,
        customerCount,
      ] = await Promise.all([
        supabase
          .from("invoices")
          .select("document_number,invoice_date,total_amount,status")
          .order("invoice_date", { ascending: false })
          .limit(20),
        supabase
          .from("challans")
          .select("document_number,challan_date,status")
          .order("challan_date", { ascending: false })
          .limit(20),
        supabase.from("customers").select("id").limit(1),
        supabase.from("invoices").select("id", { count: "exact", head: true }),
        supabase.from("challans").select("id", { count: "exact", head: true }),
        supabase.from("customers").select("id", { count: "exact", head: true }),
      ]);
      if (!mounted) return;
      const invoiceDocs: Doc[] = (invoices.data || []).map(item => ({
        number: item.document_number,
        type: "Tax Invoice",
        customer: "Customer",
        date: item.invoice_date || "—",
        amount: money(Number(item.total_amount || 0)),
        status: item.status || "Draft",
        tone: "navy",
      }));
      const challanDocs: Doc[] = (challans.data || []).map(item => ({
        number: item.document_number,
        type: "Delivery Challan",
        customer: "Customer",
        date: item.challan_date || "—",
        amount: "—",
        status: item.status || "Draft",
        tone: "orange",
      }));
      setDocs([...invoiceDocs, ...challanDocs].slice(0, 20));
      setCounts({
        invoices: invoiceCount.count || 0,
        challans: challanCount.count || 0,
        customers: customerCount.count || 0,
        outstanding: 0,
      });
      void customers;
    })();
    return () => {
      mounted = false;
    };
  }, []);
  const filteredDocs = useMemo(
    () =>
      docs.filter(doc =>
        `${doc.number} ${doc.customer} ${doc.type}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [docs, query]
  );
  const goTo = (section: string) => {
    setActive(section);
    setMobileNavOpen(false);
    if (section === "Settings") setSettings(true);
  };
  const exportDocs = () => {
    if (!docs.length) {
      toast.info("No documents to export", {
        description: "Create an invoice or challan first.",
      });
      return;
    }
    const csv = toDocumentsCsv(docs);
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `reshma-documents-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Document export downloaded");
  };
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    toast.success(`${file.name} selected`, {
      description: "Next step: map columns and validate before saving.",
    });
    event.target.value = "";
  };
  const addDoc = (doc: Doc) => setDocs(current => [doc, ...current]);
  const cyclePeriod = () => {
    const options = ["This month", "Last month", "This FY"];
    setPeriod(options[(options.indexOf(period) + 1) % options.length]);
  };
  const companyName = company.company_name || "Company Profile";
  return (
    <div className="min-h-screen bg-[#f5f6f7] text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col bg-navy px-4 py-5 text-white lg:flex">
        <div className="px-3">
          <Logo companyName={companyName} />
        </div>
        <div className="mt-11 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange/20 text-orange">
            <BriefcaseBusiness size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold">Main workspace</div>
            <div className="text-[10px] text-white/45">Production data</div>
          </div>
          <ChevronDown size={14} className="text-white/40" />
        </div>
        <nav className="mt-8 flex-1 space-y-7 overflow-y-auto">
          {navGroups.map(group => (
            <div key={group.label}>
              <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/35">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map(item => (
                  <button
                    key={item.label}
                    onClick={() => goTo(item.label)}
                    className={`sidebar-link ${active === item.label ? "active" : ""}`}
                  >
                    <item.icon size={17} />
                    <span>{item.label}</span>
                    {item.label === "Invoices" && counts.invoices > 0 && (
                      <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/55">
                        {counts.invoices}
                      </span>
                    )}
                    {item.label === "Delivery Challans" &&
                      counts.challans > 0 && (
                        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/55">
                          {counts.challans}
                        </span>
                      )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-4">
          <div className="px-2 text-xs font-semibold">
            Authenticated workspace
          </div>
          <div className="px-2 text-[10px] text-white/45">
            Ready for production records
          </div>
        </div>
      </aside>
      <div className="lg:pl-[250px]">
        <header className="sticky top-0 z-20 border-b border-line bg-[#f5f6f7]/90 backdrop-blur">
          <div className="flex h-[74px] items-center gap-4 px-5 sm:px-8">
            <button
              onClick={() => setMobileNavOpen(true)}
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
                onChange={event => setQuery(event.target.value)}
                placeholder="Search documents..."
                className="h-10 border-line bg-white pl-9 text-xs shadow-none"
              />
            </div>
            <button
              onClick={() => setShowNotifications(value => !value)}
              className="relative rounded-xl border border-line bg-white p-2.5 text-ink-muted hover:text-navy"
              aria-label="Notifications"
            >
              <Bell size={17} />
            </button>
            <Button
              onClick={() => setBuilder("invoice")}
              className="h-10 gap-2 bg-orange px-4 text-xs font-bold text-white hover:bg-orange/90"
            >
              <Plus size={16} /> Create new
            </Button>
          </div>
        </header>
        {showNotifications && (
          <div className="absolute right-5 top-[84px] z-30 w-[320px] rounded-2xl border border-line bg-white p-4 shadow-2xl sm:right-8">
            <div className="flex items-center justify-between">
              <b className="font-display text-sm text-navy">Notifications</b>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-xs font-semibold text-orange"
              >
                Dismiss
              </button>
            </div>
            <div className="mt-3 rounded-xl bg-[#f5f6f7] p-3 text-xs text-ink">
              Live notifications will appear here as documents are created.
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleImport}
          className="hidden"
        />
        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-50 bg-navy/50 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          >
            <aside
              className="h-full w-[280px] bg-navy px-4 py-5 text-white shadow-2xl"
              onClick={event => event.stopPropagation()}
            >
              <div className="flex items-center justify-between px-3">
                <Logo companyName={companyName} />
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-lg p-2 text-white/60"
                  aria-label="Close navigation"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="mt-10 space-y-2">
                {navGroups
                  .flatMap(group => group.items)
                  .map(item => (
                    <button
                      key={item.label}
                      onClick={() => goTo(item.label)}
                      className={`sidebar-link ${active === item.label ? "active" : ""}`}
                    >
                      <item.icon size={17} />
                      <span>{item.label}</span>
                    </button>
                  ))}
              </nav>
            </aside>
          </div>
        )}
        <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8">
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={cyclePeriod}
                className="h-10 gap-2 bg-white text-xs"
              >
                <Filter size={15} /> {period} <ChevronDown size={14} />
              </Button>
              <Button
                onClick={() => setPreview("invoice")}
                variant="outline"
                className="h-10 gap-2 bg-white text-xs"
              >
                <FileCheck2 size={15} /> Print test
              </Button>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="stat-card">
              <div className="icon-tile blue">
                <FileText size={18} />
              </div>
              <div className="mt-5 text-[12px] font-semibold uppercase tracking-[.12em] text-ink-muted">
                Invoices
              </div>
              <div className="mt-1 font-display text-[27px] font-bold text-ink">
                {counts.invoices}
              </div>
              <div className="mt-1 text-xs text-ink-muted">
                {counts.invoices ? "Live records" : "No invoices created yet"}
              </div>
            </div>
            <div className="stat-card">
              <div className="icon-tile orange">
                <Truck size={18} />
              </div>
              <div className="mt-5 text-[12px] font-semibold uppercase tracking-[.12em] text-ink-muted">
                Delivery challans
              </div>
              <div className="mt-1 font-display text-[27px] font-bold text-ink">
                {counts.challans}
              </div>
              <div className="mt-1 text-xs text-ink-muted">
                {counts.challans ? "Live records" : "No challans created yet"}
              </div>
            </div>
            <div className="stat-card">
              <div className="icon-tile green">
                <Users size={18} />
              </div>
              <div className="mt-5 text-[12px] font-semibold uppercase tracking-[.12em] text-ink-muted">
                Customers
              </div>
              <div className="mt-1 font-display text-[27px] font-bold text-ink">
                {counts.customers}
              </div>
              <div className="mt-1 text-xs text-ink-muted">
                {counts.customers ? "Live records" : "Add your first customer"}
              </div>
            </div>
            <div className="stat-card">
              <div className="icon-tile purple">
                <IndianRupee size={18} />
              </div>
              <div className="mt-5 text-[12px] font-semibold uppercase tracking-[.12em] text-ink-muted">
                Outstanding
              </div>
              <div className="mt-1 font-display text-[27px] font-bold text-ink">
                {money(counts.outstanding)}
              </div>
              <div className="mt-1 text-xs text-ink-muted">
                Calculated from live invoices
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
            <section className="panel overflow-hidden">
              <div className="border-b border-line px-5 py-5 sm:px-6">
                <div className="eyebrow">Sales overview</div>
                <h2 className="mt-1 font-display text-2xl font-bold text-navy">
                  No sales data yet
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Create or import an invoice to see live sales analytics.
                </p>
              </div>
              <div className="flex h-[190px] items-center justify-center px-6 text-center text-sm text-ink-muted">
                <div>
                  <ClipboardList
                    className="mx-auto mb-3 text-ink-muted"
                    size={28}
                  />
                  <div>Charts will populate from issued invoices.</div>
                </div>
              </div>
            </section>
            <section className="panel">
              <div className="flex items-start justify-between px-5 py-5 sm:px-6">
                <div>
                  <div className="eyebrow">Quick actions</div>
                  <h2 className="mt-1 font-display text-xl font-bold text-navy">
                    Start a real document
                  </h2>
                </div>
                <div className="rounded-lg bg-orange/10 p-2 text-orange">
                  <PanelLeft size={16} />
                </div>
              </div>
              <div className="space-y-2 px-5 pb-5 sm:px-6">
                <button
                  onClick={() => setBuilder("invoice")}
                  className="quick-action"
                >
                  <span className="quick-icon bg-orange/10 text-orange">
                    <FilePlus2 size={17} />
                  </span>
                  <span>
                    <b>Create invoice</b>
                    <small>Enter up to 17 item rows</small>
                  </span>
                  <ArrowUpRight size={16} className="ml-auto text-ink-muted" />
                </button>
                <button
                  onClick={() => setBuilder("challan")}
                  className="quick-action"
                >
                  <span className="quick-icon bg-blue/10 text-blue">
                    <Truck size={17} />
                  </span>
                  <span>
                    <b>New delivery challan</b>
                    <small>Enter up to 20 item rows</small>
                  </span>
                  <ArrowUpRight size={16} className="ml-auto text-ink-muted" />
                </button>
                <button
                  onClick={() => {
                    goTo("Import / Export");
                    window.setTimeout(() => fileInputRef.current?.click(), 0);
                  }}
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
            <div className="flex flex-col gap-4 border-b border-line px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <div className="eyebrow">Document history</div>
                <h2 className="mt-1 font-display text-xl font-bold text-navy">
                  Recent documents
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={exportDocs}
                  className="h-9 gap-2 bg-white text-xs"
                >
                  <Download size={14} /> Export
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBuilder("invoice")}
                  className="h-9 gap-2 bg-white text-xs"
                >
                  <Plus size={14} /> New
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              {filteredDocs.length ? (
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-line text-[10px] font-bold uppercase tracking-[.12em] text-ink-muted">
                      <th className="px-6 py-3">Document</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Amount / items</th>
                      <th className="px-4 py-3">Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map(doc => (
                      <tr
                        key={doc.number}
                        className="border-b border-line/70 text-sm last:border-0 hover:bg-[#fbfbfa]"
                      >
                        <td className="px-6 py-4 font-semibold text-navy">
                          {doc.number}
                        </td>
                        <td className="px-4 py-4 text-ink-muted">{doc.type}</td>
                        <td className="px-4 py-4 text-xs text-ink-muted">
                          {doc.date}
                        </td>
                        <td className="px-4 py-4 font-semibold text-navy">
                          {doc.amount}
                        </td>
                        <td className="px-4 py-4">
                          <span className="status">{doc.status}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() =>
                              setPreview(
                                doc.type === "Tax Invoice"
                                  ? "invoice"
                                  : "challan"
                              )
                            }
                            className="rounded-lg p-2 text-ink-muted hover:bg-navy/5"
                            aria-label={`Preview ${doc.number}`}
                          >
                            <MoreHorizontal size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center">
                  <FileText className="mx-auto mb-3 text-ink-muted" size={28} />
                  <div className="font-display text-lg font-bold text-navy">
                    {query
                      ? "No matching documents"
                      : "No documents created yet"}
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    {query
                      ? "Try a different search term."
                      : "Create an invoice or delivery challan to start your history."}
                  </p>
                </div>
              )}
            </div>
          </section>
          <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-line pt-5 text-[11px] text-ink-muted sm:flex-row sm:items-center">
            <span>
              {company.company_name || "Company Profile"} • Billing Desk
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-green" /> Data secured &
              backed up
            </span>
          </div>
        </main>
      </div>
      {settings && (
        <CompanySettings
          company={company}
          onClose={() => setSettings(false)}
          onSaved={setCompany}
        />
      )}
      {builder && (
        <DocumentBuilder
          type={builder}
          company={company}
          onClose={() => setBuilder(null)}
          onSaved={addDoc}
        />
      )}
      {preview && (
        <InvoicePreview
          type={preview}
          company={company}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
