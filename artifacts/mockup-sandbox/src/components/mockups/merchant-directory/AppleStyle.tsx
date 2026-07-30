import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bitcoin,
  Check,
  ChevronDown,
  Globe2,
  Plus,
  Search,
  X,
  Zap,
} from "lucide-react";

type Merchant = {
  name: string;
  mark: string;
  tone: string;
  description: string;
  categories: string[];
  country: string;
  methods: string[];
  website: string;
  lightning?: boolean;
};

const merchants: Merchant[] = [
  {
    name: "Proton VPN",
    mark: "PV",
    tone: "#e8eef8",
    description: "Private ecosystem alternative to Google",
    categories: ["Email", "VPN", "Storage"],
    country: "Switzerland",
    methods: ["Bitcoin", "Lightning"],
    website: "proton.me",
    lightning: true,
  },
  {
    name: "FARFETCH",
    mark: "FF",
    tone: "#efe9e2",
    description: "The global platform for luxury fashion",
    categories: ["Fashion"],
    country: "United Kingdom",
    methods: ["Bitcoin"],
    website: "farfetch.com",
  },
  {
    name: "Great Ghee",
    mark: "GG",
    tone: "#f4ead0",
    description: "Small-batch, grass-fed ghee for everyday cooking",
    categories: ["Food & drink"],
    country: "United States",
    methods: ["Bitcoin", "Lightning"],
    website: "greatghee.com",
    lightning: true,
  },
  {
    name: "Trezor",
    mark: "TR",
    tone: "#dfeeea",
    description: "The original hardware wallet for your digital future",
    categories: ["Hardware", "Security"],
    country: "Czech Republic",
    methods: ["Bitcoin"],
    website: "trezor.io",
  },
  {
    name: "Mullvad VPN",
    mark: "MV",
    tone: "#e9e5f0",
    description: "Privacy is a universal right",
    categories: ["VPN", "Privacy"],
    country: "Sweden",
    methods: ["Bitcoin", "Lightning"],
    website: "mullvad.net",
    lightning: true,
  },
  {
    name: "Bitkey",
    mark: "BK",
    tone: "#f0e6dc",
    description: "Simple, secure self-custody for your bitcoin",
    categories: ["Hardware", "Security"],
    country: "United States",
    methods: ["Bitcoin"],
    website: "bitkey.world",
  },
  {
    name: "GrapheneOS",
    mark: "GO",
    tone: "#e2e9ed",
    description: "The private and secure mobile operating system",
    categories: ["Privacy", "Open-source"],
    country: "Canada",
    methods: ["Bitcoin"],
    website: "grapheneos.org",
  },
  {
    name: "CryptoSteel",
    mark: "CS",
    tone: "#e9e9e7",
    description: "Protect your recovery phrase from the elements",
    categories: ["Hardware", "Security"],
    country: "France",
    methods: ["Bitcoin"],
    website: "cryptosteel.com",
  },
  {
    name: "Ledger",
    mark: "LD",
    tone: "#e4e4e7",
    description: "Own your digital value with a hardware wallet",
    categories: ["Hardware", "Security"],
    country: "France",
    methods: ["Bitcoin", "Lightning"],
    website: "ledger.com",
    lightning: true,
  },
  {
    name: "SimpleX Chat",
    mark: "SX",
    tone: "#e2edf2",
    description: "The most private and secure chat platform",
    categories: ["Privacy", "Open-source"],
    country: "United Kingdom",
    methods: ["Bitcoin"],
    website: "simplex.chat",
  },
];

const filters = ["All", "VPN", "Food & drink", "Hardware", "Privacy", "Security", "Open-source"];

export function AppleStyle() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [expanded, setExpanded] = useState("Proton VPN");
  const [showAdd, setShowAdd] = useState(false);

  const visible = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return merchants.filter((merchant) => {
      const matchesFilter = activeFilter === "All" || merchant.categories.includes(activeFilter);
      const matchesQuery =
        !normalized ||
        `${merchant.name} ${merchant.description} ${merchant.categories.join(" ")}`
          .toLowerCase()
          .includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-sans text-[#1d1d1f]">
      <header
        className="sticky top-0 z-20 border-b border-black/[0.08] bg-white/80"
        style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <div className="mx-auto flex h-[72px] max-w-[1120px] items-center gap-5 px-5 sm:px-8">
          <div className="shrink-0 text-[19px] font-semibold tracking-[-0.04em]">btconline</div>
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 size-[17px] -translate-y-1/2 text-[#86868b]" />
            <input
              aria-label="Search merchants"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search merchants"
              className="h-11 w-full rounded-full bg-[#f5f5f7] pl-11 pr-10 text-[15px] outline-none transition-colors placeholder:text-[#86868b] focus:bg-[#e9e9eb]"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#86868b] hover:bg-black/10" aria-label="Clear search">
                <X className="size-4" />
              </button>
            )}
          </div>
          <button onClick={() => setShowAdd(true)} className="hidden shrink-0 items-center gap-2 rounded-full bg-[#e8e8ed] px-4 py-2.5 text-[14px] font-medium transition-colors hover:bg-[#dedee3] sm:flex">
            <Plus className="size-4" /> Add Merchant
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[880px] px-5 pb-24 sm:px-8">
        <section className="pb-10 pt-[62px] text-center sm:pt-[74px]">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#86868b]">The bitcoin directory</p>
          <h1 className="text-[38px] font-normal leading-[1.08] tracking-[-0.055em] sm:text-[52px]">
            246 merchants accept Bitcoin.
          </h1>
          <p className="mx-auto mt-5 max-w-[440px] text-[16px] leading-6 text-[#6e6e73]">
            A considered collection of places to spend, save, and use bitcoin.
          </p>
        </section>

        <nav className="-mx-5 mb-8 flex gap-2 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8" aria-label="Merchant categories">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`shrink-0 rounded-full px-[17px] py-2 text-[14px] transition-all ${
                activeFilter === filter
                  ? "bg-[#1d1d1f] font-medium text-white"
                  : "bg-white text-[#6e6e73] hover:bg-[#e9e9eb]"
              }`}
            >
              {filter}
            </button>
          ))}
        </nav>

        <div className="mb-4 flex items-center justify-between px-1">
          <p className="text-[13px] text-[#86868b]">
            {query || activeFilter !== "All" ? `${visible.length} results` : "Curated for you"}
          </p>
          <button className="flex items-center gap-1 text-[13px] text-[#6e6e73] hover:text-[#1d1d1f]">
            Recently added <ChevronDown className="size-3.5" />
          </button>
        </div>

        <section className="space-y-3">
          {visible.map((merchant) => {
            const isExpanded = expanded === merchant.name;
            return (
              <article
                key={merchant.name}
                className={`overflow-hidden rounded-[20px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(0,0,0,0.09)] ${isExpanded ? "shadow-[0_5px_20px_rgba(0,0,0,0.08)]" : ""}`}
              >
                <button onClick={() => setExpanded(isExpanded ? "" : merchant.name)} className="flex w-full items-start gap-4 p-5 text-left sm:items-center sm:p-6">
                  <div style={{ backgroundColor: merchant.tone }} className="flex size-12 shrink-0 items-center justify-center rounded-[14px] text-[13px] font-semibold tracking-[-0.04em] text-[#55565b]">
                    {merchant.mark}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[17px] font-semibold tracking-[-0.02em]">{merchant.name}</h2>
                    <p className="mt-0.5 truncate text-[15px] text-[#6e6e73]">{merchant.description}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {merchant.categories.map((category) => (
                        <span key={category} className="rounded-md bg-[#f5f5f7] px-2 py-1 text-[11px] text-[#6e6e73]">{category}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 pt-1 text-[#b0b0b5] sm:pt-0">
                    {merchant.lightning && <Zap className="size-[17px] fill-[#f7931a] text-[#f7931a]" />}
                    <Bitcoin className="size-[18px] text-[#f7931a]" />
                    <ChevronDown className={`ml-1 hidden size-4 transition-transform sm:block ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-[#f0f0f2] px-5 pb-6 pt-5 sm:ml-[80px] sm:px-6">
                    <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
                      <div className="space-y-4">
                        <a href={`https://${merchant.website}`} className="inline-flex items-center gap-1 text-[15px] font-medium text-[#06c] hover:underline">
                          {merchant.website} <ArrowUpRight className="size-3.5" />
                        </a>
                        <div className="flex flex-wrap gap-x-8 gap-y-3 text-[13px]">
                          <div><p className="mb-1 text-[#86868b]">Payment methods</p><p className="font-medium">{merchant.methods.join("  ·  ")}</p></div>
                          <div><p className="mb-1 text-[#86868b]">Country</p><p className="flex items-center gap-1.5 font-medium"><Globe2 className="size-3.5 text-[#86868b]" />{merchant.country}</p></div>
                        </div>
                      </div>
                      <a href={`https://${merchant.website}`} className="inline-flex h-fit items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#424245]">
                        Visit <ArrowUpRight className="size-4" />
                      </a>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
          {visible.length === 0 && <div className="rounded-[20px] bg-white px-6 py-16 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]"><p className="text-[17px] font-medium">No merchants found</p><p className="mt-2 text-[14px] text-[#6e6e73]">Try another search or category.</p></div>}
        </section>
        <footer className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-black/[0.08] pt-6 text-[12px] text-[#86868b] sm:flex-row">
          <span>btconline · A living directory for bitcoin</span><span>Open, curated, independent</span>
        </footer>
      </main>

      {showAdd && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 p-5" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-[420px] rounded-[22px] bg-white p-7 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between"><div><h2 className="text-[22px] font-semibold tracking-[-0.03em]">Add a merchant</h2><p className="mt-1 text-[14px] text-[#6e6e73]">Know a business that accepts bitcoin?</p></div><button onClick={() => setShowAdd(false)} className="rounded-full bg-[#f5f5f7] p-2" aria-label="Close"><X className="size-4" /></button></div>
            <label className="block text-[13px] font-medium">Merchant website<input className="mt-2 h-11 w-full rounded-xl bg-[#f5f5f7] px-3 outline-none focus:ring-2 focus:ring-[#f7931a]/40" placeholder="example.com" /></label>
            <button onClick={() => setShowAdd(false)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#1d1d1f] py-3 text-[14px] font-medium text-white"><Check className="size-4" /> Submit for review</button>
          </div>
        </div>
      )}
    </div>
  );
}