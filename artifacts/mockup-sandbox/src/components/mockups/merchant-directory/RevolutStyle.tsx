import { useState, type ReactNode } from "react";
import { ArrowUpRight, ChevronDown, Globe2, Link2, Search, ShieldCheck, Zap } from "lucide-react";

type Merchant = {
  name: string;
  abbr: string;
  description: string;
  category: string;
  country: string;
  flag: string;
  color: string;
  methods: ("lightning" | "onchain")[];
  expanded?: boolean;
};

const merchants: Merchant[] = [
  { name: "Proton VPN", abbr: "PV", description: "Privacy-first VPN for everyone", category: "VPN & Privacy", country: "Switzerland", flag: "🇨🇭", color: "#5c6cf7", methods: ["lightning", "onchain"] },
  { name: "FARFETCH", abbr: "FF", description: "Luxury fashion from the world's best boutiques", category: "Fashion", country: "United Kingdom", flag: "🇬🇧", color: "#a276ff", methods: ["onchain"] },
  { name: "Great Ghee", abbr: "GG", description: "Small-batch, grass-fed organic ghee", category: "Food & drink", country: "United States", flag: "🇺🇸", color: "#e8993d", methods: ["lightning"] },
  { name: "Trezor", abbr: "TR", description: "Open-source hardware wallet", category: "Hardware", country: "Czech Republic", flag: "🇨🇿", color: "#f7931a", methods: ["lightning", "onchain"], expanded: true },
  { name: "Mullvad VPN", abbr: "MV", description: "Private VPN built for a better internet", category: "VPN & Privacy", country: "Sweden", flag: "🇸🇪", color: "#df526b", methods: ["lightning", "onchain"] },
  { name: "Bitkey", abbr: "BK", description: "A simple, secure bitcoin wallet", category: "Hardware", country: "United States", flag: "🇺🇸", color: "#27b795", methods: ["onchain"] },
  { name: "GrapheneOS", abbr: "GO", description: "The private and secure mobile OS", category: "Open-source", country: "Canada", flag: "🇨🇦", color: "#3ca7c5", methods: ["onchain"] },
  { name: "CryptoSteel", abbr: "CS", description: "Protect your recovery phrase forever", category: "Security", country: "France", flag: "🇫🇷", color: "#7b78e8", methods: ["lightning"] },
  { name: "Ledger", abbr: "LD", description: "The world's most popular hardware wallet", category: "Hardware", country: "France", flag: "🇫🇷", color: "#e36d41", methods: ["onchain"] },
  { name: "SimpleX Chat", abbr: "SX", description: "The most private messaging platform", category: "Privacy", country: "United Kingdom", flag: "🇬🇧", color: "#3a9f83", methods: ["lightning"] },
];

const tabs = ["All", "VPN & Privacy", "Hardware", "Food", "Fashion", "Charity", "More"];

export function RevolutStyle() {
  const [activeTab, setActiveTab] = useState("All");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState("Trezor");

  const filtered = merchants.filter((merchant) => {
    const matchesTab = activeTab === "All" || (activeTab === "Food" ? merchant.category === "Food & drink" : activeTab === "More" ? ["Charity", "Open-source", "Privacy", "Security"].includes(merchant.category) : merchant.category === activeTab);
    const haystack = `${merchant.name} ${merchant.description} ${merchant.category} ${merchant.country}`.toLowerCase();
    return matchesTab && haystack.includes(query.toLowerCase());
  });

  return (
    <div style={{ background: "#0d0d14", minHeight: "100vh", color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }} className="selection:bg-[#5c6cf7]/40">
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap'); *{box-sizing:border-box} button,input{font:inherit}` }} />
      <header className="sticky top-0 z-20 border-b border-white/[.06] bg-[#0d0d14]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1160px] items-center gap-5 px-5 lg:px-8">
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#f7931a] text-[17px] font-bold text-[#16161e]">₿</div>
            <span className="text-[20px] font-bold tracking-[-.7px]">btconline</span>
          </div>
          <div className="relative mx-auto hidden w-full max-w-[490px] md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#70728b]" size={17} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search merchants, categories, countries..." className="h-11 w-full rounded-full border border-white/[.08] bg-[#171720] pl-11 pr-5 text-[13px] text-white outline-none transition focus:border-[#5c6cf7] placeholder:text-[#626479]" />
          </div>
          <button className="ml-auto flex shrink-0 items-center gap-2 rounded-full bg-[#5c6cf7] px-4 py-2.5 text-[13px] font-semibold transition hover:bg-[#7180ff]"><span className="hidden sm:inline">Connect</span><ArrowUpRight size={16} /></button>
        </div>
      </header>

      <main className="mx-auto max-w-[1160px] px-5 pb-20 lg:px-8">
        <section className="flex flex-col justify-between gap-8 pb-8 pt-12 md:flex-row md:items-end md:pt-14">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.18em] text-[#5c6cf7]"><span className="h-1.5 w-1.5 rounded-full bg-[#5c6cf7]" /> The open bitcoin economy</div>
            <h1 className="text-[42px] font-bold leading-[1.02] tracking-[-2.4px] sm:text-[56px]">Find where<br /><span className="text-[#8b8fa8]">bitcoin moves.</span></h1>
            <p className="mt-4 text-[14px] text-[#8b8fa8]"><strong className="font-semibold text-white">246 merchants</strong> accepting Bitcoin worldwide</p>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 md:w-[430px]">
            <Stat icon={<Zap size={17} />} label="Lightning" value="118" color="#5c6cf7" />
            <Stat icon={<Link2 size={17} />} label="On-chain" value="224" color="#f7931a" />
            <Stat icon={<Globe2 size={17} />} label="Countries" value="48" color="#43c6a5" />
          </div>
        </section>

        <div className="mb-8 flex items-center gap-2 overflow-x-auto border-b border-white/[.06] pb-4 [scrollbar-width:none]">
          {tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap rounded-full px-4 py-2 text-[12px] font-semibold transition ${activeTab === tab ? "bg-[#5c6cf7] text-white" : "text-[#85889e] hover:bg-white/[.05] hover:text-white"}`}>{tab}</button>)}
          <button className="ml-auto hidden shrink-0 items-center gap-1 text-[12px] text-[#85889e] md:flex">Sort by <ChevronDown size={14} /></button>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-white">All merchants <span className="ml-1 font-normal text-[#66697e]">{filtered.length}</span></h2>
          <span className="text-[11px] uppercase tracking-[.14em] text-[#55586d]">Updated today</span>
        </div>
        <div className="space-y-2.5">
          {filtered.map((merchant) => <MerchantCard key={merchant.name} merchant={merchant} isExpanded={expanded === merchant.name} onToggle={() => setExpanded(expanded === merchant.name ? "" : merchant.name)} />)}
          {filtered.length === 0 && <div className="rounded-2xl border border-white/[.06] bg-[#171720] py-20 text-center text-sm text-[#85889e]">No merchants found. Try another search.</div>}
        </div>
      </main>
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
  return <div className="rounded-2xl border border-white/[.06] bg-white/[.035] p-3.5"><div style={{ color }} className="mb-3">{icon}</div><div className="text-[24px] font-bold leading-none tracking-[-1px]">{value}</div><div className="mt-1.5 text-[11px] text-[#777a90]">{label}</div></div>;
}

function MerchantCard({ merchant, isExpanded, onToggle }: { merchant: Merchant; isExpanded: boolean; onToggle: () => void }) {
  return <div className={`overflow-hidden rounded-2xl border transition ${isExpanded ? "border-[#5c6cf7]/45 bg-[#191925]" : "border-white/[.06] bg-[#171720] hover:border-white/[.14]"}`}>
    <button onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left sm:gap-4 sm:p-5">
      <div style={{ background: `${merchant.color}22`, color: merchant.color }} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[13px] font-bold">{merchant.abbr}</div>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[14px] font-semibold">{merchant.name}</span><span className="rounded-full bg-white/[.06] px-2 py-0.5 text-[10px] text-[#777a90]">{merchant.category}</span></div><p className="mt-1 truncate text-[12px] text-[#777a90]">{merchant.description}</p><div className="mt-2 text-[11px] text-[#626579]">{merchant.flag} {merchant.country}</div></div>
      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">{merchant.methods.map((method) => <span key={method} className={`rounded-md px-2 py-1 text-[10px] font-semibold ${method === "lightning" ? "bg-[#5c6cf7]/15 text-[#8d99ff]" : "bg-[#f7931a]/12 text-[#f7a74c]"}`}>{method === "lightning" ? "⚡ LN" : "₿ On-chain"}</span>)}</div>
      <ChevronDown size={16} className={`ml-1 shrink-0 text-[#626579] transition-transform ${isExpanded ? "rotate-180 text-[#8d99ff]" : ""}`} />
    </button>
    {isExpanded && <div className="border-t border-white/[.06] px-4 pb-5 pt-4 sm:px-5"><div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4">{[["CATEGORY", "Hardware · Security"], ["PAYMENT", "₿ Bitcoin + ⚡ Lightning"], ["AVAILABILITY", "Worldwide"], ["PROVIDER", "BTCPay Server"]].map(([label, value]) => <div key={label}><div className="mb-1.5 text-[9px] font-semibold tracking-[.16em] text-[#5e6175]">{label}</div><div className="text-[12px] text-[#d9d9e3]">{value}</div></div>)}</div><button className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#5c6cf7] text-[12px] font-semibold transition hover:bg-[#7180ff]">Visit trezor.io <ArrowUpRight size={15} /></button><div className="mt-3 text-center text-[10px] text-[#55586d]">Last surveyed 14 February 2024</div></div>}
  </div>;
}