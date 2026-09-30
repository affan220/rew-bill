import { useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
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
  Share2,
  Settings2,
  ShieldCheck,
  Sparkles,
  Truck,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { toDocumentsCsv } from "../../../shared/export";

const navGroups = [
  { label: "Workspace", items: [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Invoices", icon: FileText, count: "24" },
    { label: "Delivery Challans", icon: Truck, count: "8" },
  ]},
  { label: "Manage", items: [
    { label: "Customers", icon: Users },
    { label: "Products & Parts", icon: Package },
    { label: "Import / Export", icon: Upload },
  ]},
  { label: "Insights", items: [
    { label: "Reports", icon: BookOpen },
    { label: "Settings", icon: Settings2 },
  ]},
];

const recentDocs = [
  { number: "INV-26-27-0042", type: "Tax Invoice", customer: "Apex Auto Components", date: "28 Sep 2026", amount: "₹1,48,500", status: "Issued", tone: "navy" },
  { number: "CHL-26-27-0088", type: "Delivery Challan", customer: "Bharat Fabricators", date: "28 Sep 2026", amount: "18 items", status: "Ready", tone: "orange" },
  { number: "INV-26-27-0041", type: "Tax Invoice", customer: "Shree Ganesh Works", date: "27 Sep 2026", amount: "₹82,600", status: "Part-paid", tone: "green" },
  { number: "CHL-26-27-0087", type: "Delivery Challan", customer: "Mitra Engineering", date: "26 Sep 2026", amount: "7 items", status: "In transit", tone: "blue" },
];

const chart = [34, 46, 40, 62, 55, 74, 64, 80, 68, 92, 84, 98];

function downloadDocuments() {
  const csv = toDocumentsCsv(recentDocs);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `reshma-documents-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  toast.success("Document export downloaded", { description: "Your recent document history is ready as a CSV file." });
}

function shareInvoice() {
  const shareText = "Reshma Engineering Works invoice INV-26-27-0042 — ₹1,75,230.00";
  if (navigator.share) {
    navigator.share({ title: "Reshma Engineering Works invoice", text: shareText }).then(() => toast.success("Invoice shared")).catch(() => undefined);
    return;
  }
  navigator.clipboard?.writeText(shareText).then(() => toast.success("Invoice details copied", { description: "You can paste them into WhatsApp or email." })).catch(() => toast.info(shareText));
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3">
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange text-white shadow-[0_10px_24px_rgba(239,93,39,.25)]">
      <span className="font-display text-xl font-bold leading-none">R</span>
      <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-navy bg-white" />
    </div>
    {!compact && <div className="min-w-0"><div className="font-display text-[15px] font-bold tracking-[.08em] text-white">RESHMA</div><div className="text-[9px] font-semibold tracking-[.18em] text-white/50">ENGINEERING WORKS</div></div>}
  </div>;
}

function StatCard({ icon: Icon, label, value, change, accent, helper }: { icon: any; label: string; value: string; change: string; accent: string; helper: string }) {
  return <div className="stat-card group">
    <div className="flex items-start justify-between"><div className={`icon-tile ${accent}`}><Icon size={18} /></div><span className="trend-pill"><ArrowUpRight size={12} />{change}</span></div>
    <div className="mt-5 text-[12px] font-semibold uppercase tracking-[.12em] text-ink-muted">{label}</div>
    <div className="mt-1 font-display text-[27px] font-bold tracking-[-.03em] text-ink">{value}</div>
    <div className="mt-1 text-xs text-ink-muted">{helper}</div>
  </div>;
}

function InvoicePreview({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
    <div className="flex max-h-[94vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-line bg-[#fbfbfa] px-5 py-3">
        <div><div className="font-display text-sm font-bold uppercase tracking-[.12em] text-navy">Invoice preview</div><div className="text-xs text-ink-muted">A4 portrait • ready to print</div></div>
        <div className="flex items-center gap-2"><Button variant="outline" className="h-9 gap-2" onClick={() => { toast("Print dialog opened", { description: "Choose Save as PDF in your browser to create a PDF copy." }); window.print(); }}><FileText size={15} /> Print</Button><Button className="h-9 gap-2 bg-orange text-white hover:bg-orange/90" onClick={() => { toast("PDF export ready", { description: "Use the browser print dialog and select Save as PDF." }); window.print(); }}><Download size={15} /> PDF</Button><Button variant="outline" className="h-9 gap-2 bg-white" onClick={shareInvoice}><Share2 size={15} /> Share</Button><button onClick={onClose} className="ml-2 rounded-lg p-2 text-ink-muted hover:bg-black/5"><X size={18} /></button></div>
      </div>
      <div className="overflow-auto bg-[#e9edf1] p-6">
        <div className="invoice-paper mx-auto bg-white p-7 text-[10px] text-[#152a45] shadow-xl">
          <div className="flex items-start justify-between border-b-2 border-[#152a45] pb-4">
            <div><div className="text-[9px] font-bold tracking-[.25em] text-[#ed5c27]">SINCE 2008</div><div className="mt-1 text-[24px] font-black tracking-[.06em]">RESHMA ENGINEERING WORKS</div><div className="mt-1 text-[9px] font-semibold tracking-[.2em] text-[#ed5c27]">PRECISION • PERFORMANCE • TRUST</div></div>
            <div className="text-right leading-4"><div className="font-bold">GSTIN/UIN: 27AABFR1234D1ZK</div><div>+91 98220 48117 • reshmaengineering.in</div><div>Plot 14, MIDC Industrial Estate, Pune, Maharashtra</div><div>State Code: 27 • PAN: AABFR1234D</div></div>
          </div>
          <div className="py-3 text-center text-[16px] font-black tracking-[.25em] text-[#ed5c27]">TAX INVOICE</div>
          <div className="grid grid-cols-[1.45fr_1fr] border border-[#152a45]">
            <div className="border-r border-[#152a45] p-3"><div className="mb-2 inline-block bg-[#152a45] px-2 py-1 text-[9px] font-bold uppercase tracking-[.15em] text-white">Buyer (Customer)</div><div className="font-bold">Apex Auto Components Pvt. Ltd.</div><div>Unit 4, Chakan Industrial Park, Pune 410501</div><div className="mt-1 font-semibold">GSTIN/UIN: 27AAECA7890K1ZP</div></div>
            <div className="p-3 leading-5"><div className="flex justify-between"><b>Invoice No.</b><span>INV-26-27-0042</span></div><div className="flex justify-between"><b>Date</b><span>28 Sep 2026</span></div><div className="flex justify-between"><b>Challan No.</b><span>CHL-26-27-0088</span></div><div className="flex justify-between"><b>Place of Supply</b><span>Maharashtra (27)</span></div></div>
          </div>
          <table className="mt-4 w-full border-collapse border border-[#152a45] text-[9px]"><thead><tr className="bg-[#152a45] text-white"><th className="w-8 border-r border-white/30 p-2">Sr.</th><th className="border-r border-white/30 p-2 text-left">Description of Goods</th><th className="w-20 border-r border-white/30 p-2">HSN/SAC</th><th className="w-14 border-r border-white/30 p-2">Qty</th><th className="w-20 border-r border-white/30 p-2 text-right">Rate (₹)</th><th className="w-24 p-2 text-right">Amount (₹)</th></tr></thead><tbody>{[["01","CNC turned steel spacer — 42mm","8466","120","860.00","1,03,200.00"],["02","Mild steel fabricated bracket","7326","40","780.00","31,200.00"],["03","Zinc plated fastener kit","7318","20","705.00","14,100.00"]].map(row => <tr key={row[0]}>{row.map((cell, i) => <td key={cell} className={`border-t border-r border-[#152a45] p-2 ${i > 3 ? "text-right" : i === 1 ? "text-left" : "text-center"}`}>{cell}</td>)}</tr>)}</tbody></table>
          <div className="mt-3 grid grid-cols-[1fr_230px] gap-6"><div className="flex flex-col justify-between"><div><div className="font-bold uppercase tracking-[.15em] text-[#ed5c27]">Amount in words</div><div className="mt-1 font-semibold">One Lakh Forty Eight Thousand Five Hundred Rupees Only</div></div><div className="mt-7 text-[9px] leading-4 text-[#4b5e72]">Terms: Goods once sold will not be taken back. Subject to Pune jurisdiction.<br />Thank you for your business with Reshma Engineering Works.</div></div><div className="border border-[#152a45]"><div className="flex justify-between border-b border-[#152a45] p-2"><span>Amount Before GST</span><b>₹1,48,500.00</b></div><div className="flex justify-between border-b border-[#152a45] p-2"><span>CGST @ 9%</span><span>₹13,365.00</span></div><div className="flex justify-between border-b border-[#152a45] p-2"><span>SGST @ 9%</span><span>₹13,365.00</span></div><div className="flex justify-between bg-[#ed5c27] p-2 font-black text-white"><span>Total Amount</span><span>₹1,75,230.00</span></div></div></div>
          <div className="mt-10 flex justify-end"><div className="w-48 border-t border-[#152a45] pt-2 text-center text-[9px] font-bold uppercase tracking-[.13em]">For Reshma Engineering Works<br /><span className="font-normal tracking-normal text-[#4b5e72]">Authorised Signature</span></div></div>
        </div>
      </div>
    </div>
  </div>;
}

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [period, setPeriod] = useState("This month");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filteredDocs = useMemo(() => recentDocs.filter((doc) => `${doc.number} ${doc.customer} ${doc.type}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const goTo = (section: string) => { setActive(section); setMobileNavOpen(false); toast.success(`${section} selected`); };
  const cyclePeriod = () => {
    const options = ["This month", "Last month", "This FY"];
    const next = options[(options.indexOf(period) + 1) % options.length];
    setPeriod(next);
    toast.success(`Filter changed to ${next}`);
  };
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.name.toLowerCase().endsWith(".csv")) {
      toast.success("CSV selected for validation", { description: `${file.name} is ready for a preview before import.` });
    } else {
      toast.info("Excel file selected", { description: `${file.name} is ready for header mapping and validation.` });
    }
    event.target.value = "";
  };
  return <div className="min-h-screen bg-[#f5f6f7] text-ink">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col bg-navy px-4 py-5 text-white lg:flex">
      <div className="px-3"><Logo /></div>
      <div className="mt-11 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange/20 text-orange"><BriefcaseBusiness size={16}/></div><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold">Pune Workshop</div><div className="text-[10px] text-white/45">FY 2026–27</div></div><ChevronDown size={14} className="text-white/40"/></div>
      <nav className="mt-8 flex-1 space-y-7 overflow-y-auto">{navGroups.map(group => <div key={group.label}><div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/35">{group.label}</div><div className="space-y-1">{group.items.map(item => <button key={item.label} onClick={() => goTo(item.label)} className={`sidebar-link ${active === item.label ? "active" : ""}`}><item.icon size={17}/><span>{item.label}</span>{item.count && <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/55">{item.count}</span>}</button>)}</div></div>)}</nav>
      <div className="border-t border-white/10 pt-4"><div className="flex items-center gap-3 rounded-xl px-2 py-2"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0cda7] text-sm font-bold text-navy">AK</div><div className="min-w-0"><div className="truncate text-xs font-semibold">Aarav Kulkarni</div><div className="text-[10px] text-white/45">Administrator</div></div><MoreHorizontal size={17} className="ml-auto text-white/35"/></div></div>
    </aside>
    <div className="lg:pl-[250px]"><header className="sticky top-0 z-20 border-b border-line bg-[#f5f6f7]/90 backdrop-blur"><div className="flex h-[74px] items-center gap-4 px-5 sm:px-8"><button onClick={() => setMobileNavOpen(true)} className="rounded-lg p-2 text-ink-muted lg:hidden" aria-label="Open navigation"><Menu size={20}/></button><div className="hidden items-center gap-2 text-sm text-ink-muted sm:flex"><ShieldCheck size={16} className="text-green"/><span>All systems operational</span></div><div className="relative ml-auto w-full max-w-[300px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16}/><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search documents, GSTIN..." className="h-10 border-line bg-white pl-9 text-xs shadow-none"/></div><button onClick={() => setShowNotifications((value) => !value)} className="relative rounded-xl border border-line bg-white p-2.5 text-ink-muted hover:text-navy" aria-label="Notifications"><Bell size={17}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange"/></button><div className="hidden h-8 w-px bg-line sm:block"/><Button onClick={() => setShowCreate(true)} className="h-10 gap-2 bg-orange px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(239,93,39,.2)] hover:bg-orange/90"><Plus size={16}/> Create new</Button></div></header>
      {showNotifications && <div className="absolute right-5 top-[84px] z-30 w-[320px] rounded-2xl border border-line bg-white p-4 shadow-2xl sm:right-8"><div className="flex items-center justify-between"><div className="font-display text-sm font-bold text-navy">Notifications</div><button onClick={() => setShowNotifications(false)} className="text-xs font-semibold text-orange">Dismiss</button></div><div className="mt-3 rounded-xl bg-[#f5f6f7] p-3 text-xs text-ink"><b>2 challans</b> are ready to be converted into invoices.<div className="mt-1 text-ink-muted">Updated just now</div></div><div className="mt-2 rounded-xl bg-[#f5f6f7] p-3 text-xs text-ink"><b>Backup complete.</b> Your billing data is secured.<div className="mt-1 text-ink-muted">Today, 08:15</div></div></div>}
      <input ref={fileInputRef} type="file" accept=".csv,.xlsx" onChange={handleImport} className="hidden" />
      {mobileNavOpen && <div className="fixed inset-0 z-50 bg-navy/50 lg:hidden" onClick={() => setMobileNavOpen(false)}><aside className="h-full w-[280px] bg-navy px-4 py-5 text-white shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between px-3"><Logo /><button onClick={() => setMobileNavOpen(false)} className="rounded-lg p-2 text-white/60" aria-label="Close navigation"><X size={18}/></button></div><nav className="mt-10 space-y-2">{navGroups.flatMap((group) => group.items).map((item) => <button key={item.label} onClick={() => goTo(item.label)} className={`sidebar-link ${active === item.label ? "active" : ""}`}><item.icon size={17}/><span>{item.label}</span></button>)}</nav></aside></div>}
      <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-orange"><Sparkles size={14}/> Monday, 28 September 2026</div><h1 className="font-display text-[32px] font-bold tracking-[-.04em] text-navy sm:text-[38px]">{active === "Overview" ? "Good afternoon, Aarav." : active}</h1><p className="mt-1 text-sm text-ink-muted">{active === "Overview" ? "Here’s the pulse of your billing desk today." : `Manage ${active.toLowerCase()} from one place.`}</p></div><div className="flex items-center gap-2"><Button variant="outline" onClick={cyclePeriod} className="h-10 gap-2 bg-white text-xs"><Filter size={15}/> {period} <ChevronDown size={14}/></Button><Button onClick={() => setPreview(true)} variant="outline" className="h-10 gap-2 bg-white text-xs"><FileCheck2 size={15}/> Print test</Button></div></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={FileText} label="Invoices issued" value="24" change="12.5%" accent="blue" helper="6 more than last month"/><StatCard icon={Truck} label="Delivery challans" value="08" change="8.2%" accent="orange" helper="2 awaiting invoice"/><StatCard icon={IndianRupee} label="This month sales" value="₹8.42L" change="18.4%" accent="green" helper="vs ₹7.11L last month"/><StatCard icon={ClipboardList} label="Outstanding" value="₹2.18L" change="4.6%" accent="purple" helper="3 invoices overdue"/></div>
        <div className="mt-6 grid gap-5 xl:grid-cols-[1.6fr_1fr]"><section className="panel overflow-hidden"><div className="flex items-start justify-between border-b border-line px-5 py-5 sm:px-6"><div><div className="eyebrow">Sales overview</div><div className="mt-1 flex items-baseline gap-2"><h2 className="font-display text-2xl font-bold text-navy">₹8,42,600</h2><span className="text-xs font-semibold text-green">+18.4%</span></div></div><button onClick={() => toast.info("Sales chart options", { description: "Choose a date range from the filter above." })} className="rounded-lg p-2 text-ink-muted hover:bg-[#f5f6f7]" aria-label="Sales chart options"><MoreHorizontal size={18}/></button></div><div className="px-5 pb-5 pt-3 sm:px-6"><div className="flex h-[190px] items-end gap-2 border-b border-line pb-0 sm:gap-4">{chart.map((height, i) => <div key={i} className="group flex flex-1 flex-col items-center justify-end gap-2"><div className={`w-full max-w-[32px] rounded-t-md transition-all duration-200 group-hover:bg-orange ${i === 11 ? "bg-orange" : "bg-[#dce5ed]"}`} style={{height: `${height}%`}}/><span className="text-[10px] text-ink-muted">{["Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"][i]}</span></div>)}</div><div className="mt-5 flex items-center gap-4 text-[11px] text-ink-muted"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-orange"/> Current year</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#dce5ed]"/> Previous year</span><span className="ml-auto hidden sm:block">Gross sales • FY 2026–27</span></div></div></section><section className="panel"><div className="flex items-start justify-between px-5 py-5 sm:px-6"><div><div className="eyebrow">Quick actions</div><h2 className="mt-1 font-display text-xl font-bold text-navy">Keep work moving</h2></div><div className="rounded-lg bg-orange/10 p-2 text-orange"><PanelLeft size={16}/></div></div><div className="space-y-2 px-5 pb-5 sm:px-6"><button onClick={() => setShowCreate(true)} className="quick-action"><span className="quick-icon bg-orange/10 text-orange"><FilePlus2 size={17}/></span><span><b>Create invoice</b><small>Start from a blank template</small></span><ArrowUpRight size={16} className="ml-auto text-ink-muted"/></button><button onClick={() => goTo("Delivery Challans")} className="quick-action"><span className="quick-icon bg-blue/10 text-blue"><Truck size={17}/></span><span><b>New delivery challan</b><small>Record a dispatch in seconds</small></span><ArrowUpRight size={16} className="ml-auto text-ink-muted"/></button><button onClick={() => { goTo("Import / Export"); window.setTimeout(() => fileInputRef.current?.click(), 0); }} className="quick-action"><span className="quick-icon bg-green/10 text-green"><Upload size={17}/></span><span><b>Import from Excel</b><small>Validate before saving</small></span><ArrowUpRight size={16} className="ml-auto text-ink-muted"/></button></div></section></div>
        <section className="panel mt-5"><div className="flex flex-col gap-4 border-b border-line px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><div className="eyebrow">Document history</div><h2 className="mt-1 font-display text-xl font-bold text-navy">Recent documents</h2></div><div className="flex items-center gap-2"><Button variant="outline" onClick={downloadDocuments} className="h-9 gap-2 bg-white text-xs"><Download size={14}/> Export</Button><Button variant="outline" onClick={() => goTo("Invoices")} className="h-9 gap-2 bg-white text-xs">View all <ArrowUpRight size={14}/></Button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b border-line text-[10px] font-bold uppercase tracking-[.12em] text-ink-muted"><th className="px-6 py-3">Document</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Amount / items</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead><tbody>{filteredDocs.map(doc => <tr key={doc.number} className="border-b border-line/70 text-sm last:border-0 hover:bg-[#fbfbfa]"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className={`doc-icon ${doc.tone}`}><FileText size={15}/></div><div><div className="font-semibold text-navy">{doc.number}</div><div className="text-[11px] text-ink-muted">{doc.type}</div></div></div></td><td className="px-4 py-4 font-medium text-ink">{doc.customer}</td><td className="px-4 py-4 text-xs text-ink-muted">{doc.date}</td><td className="px-4 py-4 font-semibold text-navy">{doc.amount}</td><td className="px-4 py-4"><span className={`status ${doc.status.toLowerCase().replace("-", "")}`}>{doc.status}</span></td><td className="px-4 py-4 text-right"><button onClick={() => setPreview(true)} className="rounded-lg p-2 text-ink-muted hover:bg-navy/5 hover:text-navy"><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table>{filteredDocs.length === 0 && <div className="p-10 text-center text-sm text-ink-muted">No documents match “{query}”.</div>}</div></section>
        <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-line pt-5 text-[11px] text-ink-muted sm:flex-row sm:items-center"><span>Reshma Engineering Works • Billing Desk</span><span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-green"/> Data secured & backed up</span></div>
      </main></div>
    {showCreate && <div className="fixed inset-0 z-40 flex items-end justify-center bg-navy/40 p-4 backdrop-blur-sm sm:items-center"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><div className="eyebrow">New document</div><h2 className="mt-1 font-display text-2xl font-bold text-navy">What are you creating?</h2></div><button onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-ink-muted hover:bg-black/5"><X size={18}/></button></div><div className="mt-6 grid gap-3"><button onClick={() => { setShowCreate(false); goTo("Invoices"); setPreview(true); }} className="create-choice"><span className="quick-icon bg-orange/10 text-orange"><FileText size={18}/></span><span><b>Tax invoice</b><small>Calculate GST, totals and print</small></span><ArrowUpRight size={17} className="ml-auto text-ink-muted"/></button><button onClick={() => { setShowCreate(false); goTo("Delivery Challans"); }} className="create-choice"><span className="quick-icon bg-blue/10 text-blue"><Truck size={18}/></span><span><b>Delivery challan</b><small>Capture dispatch and receiver details</small></span><ArrowUpRight size={17} className="ml-auto text-ink-muted"/></button></div></div></div>}
    {preview && <InvoicePreview onClose={() => setPreview(false)} />}
  </div>;
}
