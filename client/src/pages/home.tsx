import { useState, useMemo, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import Navbar from "@/components/navbar";
import Filters from "@/components/filters";
import MerchantCard from "@/components/merchant-card";
import { type Merchant, type BadgePreset } from "@shared/schema";
import { slugify } from "@/lib/utils";
import btcBgImage from "@assets/image_1771226498805.png";
import { motion } from "framer-motion";
import { isAgeVerified, setAgeVerifiedStorage } from "@/lib/restricted-categories";
import { useRestrictedCategories } from "@/hooks/use-restricted-categories";
import { HERO_LOGOS } from "@/lib/hero-logos";

// ── Hero marquee ─────────────────────────────────────────────────────────────
// 120 logos split into 4 rows of 30 — zero overlap between rows.
// 30 logos × 48 px = 1440 px > 1280 px desktop viewport, so no logo ever appears
// twice in the visible area. Each row is doubled for a seamless translateX(-50%) loop.
const NUM_ROWS = 4;
const PER_ROW = 30; // 120 / 4

const LOGO_ROWS: string[][] = Array.from({ length: NUM_ROWS }, (_, i) => {
  const chunk = HERO_LOGOS.slice(i * PER_ROW, (i + 1) * PER_ROW);
  return [...chunk, ...chunk]; // doubled for seamless loop
});

function HeroMarquee() {
  return (
    <div className="relative border-b border-border/50 overflow-hidden bg-[#0a0f1e]">
      {/* Scrolling logo rows — clustered in center behind text */}
      <div className="absolute inset-0 flex flex-col justify-evenly md:justify-center md:gap-4 items-stretch pointer-events-none select-none">
        {LOGO_ROWS.map((items, rowIdx) => {
          const goLeft = rowIdx % 2 === 0;
          return (
            <div key={rowIdx} className="overflow-hidden">
              <div
                className={`flex gap-2 w-max ${goLeft ? "animate-marquee-left" : "animate-marquee-right"}`}
                style={{ animationDuration: `${55 + rowIdx * 8}s` }}
              >
                {items.map((logo, i) => (
                  <div
                    key={`${rowIdx}-${i}`}
                    className="w-10 h-10 md:w-14 md:h-14 rounded-lg overflow-hidden bg-white/5 shrink-0 flex items-center justify-center"
                  >
                    <img
                      src={logo}
                      alt=""
                      className="w-full h-full object-contain p-0.5"
                      fetchPriority="high"
                      decoding="async"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dark overlay so text stays readable */}
      <div className="absolute inset-0 bg-[#0a0f1e]/75" />

      {/* Hero text */}
      <div className="max-w-3xl mx-auto relative z-10 px-4 py-10 md:py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-6xl font-display font-bold tracking-tight mb-4 leading-tight text-white">
            Find places to spend <span className="text-primary">₿itcoin online</span>
          </h1>
          <p className="text-lg md:text-xl text-white max-w-2xl mx-auto leading-relaxed">
            An open source directory of online merchants that accept Bitcoin
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function Home() {
  const [, params] = useRoute("/merchant/:slug");
  const [, setLocation] = useLocation();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [badgePresets, setBadgePresets] = useState<BadgePreset[]>([]);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(params?.slug || null);
  const [needsScroll, setNeedsScroll] = useState<string | null>(params?.slug || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedMadeIn, setSelectedMadeIn] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => Number(localStorage.getItem("page-size")) || 50);
  const [bannerDismissed, setBannerDismissed] = useState(() => localStorage.getItem("policy-banner-dismissed") === "1");
  const [ageVerified, setAgeVerified] = useState(() => isAgeVerified());
  const restrictedCategories = useRestrictedCategories();

  const handleAgeVerify = useCallback(() => {
    setAgeVerifiedStorage(true);
    setAgeVerified(true);
  }, []);

  useEffect(() => {
    if (params?.slug) {
      setExpandedSlug(params.slug);
      setNeedsScroll(params.slug);
    }
  }, [params?.slug]);

  useEffect(() => {
    fetch("/api/merchants", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setMerchants(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/badge-presets")
      .then(r => r.json())
      .then(setBadgePresets)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading && merchants.length > 0 && expandedSlug) {
      const validSlugs = merchants.map(m => slugify(m.name));
      if (!validSlugs.includes(expandedSlug)) {
        setExpandedSlug(null);
        setNeedsScroll(null);
        setLocation("/", { replace: true });
      }
    }
  }, [loading, merchants, expandedSlug, setLocation]);

  const handleToggleExpand = useCallback((merchant: Merchant) => {
    const slug = slugify(merchant.name);
    if (expandedSlug === slug) {
      setExpandedSlug(null);
      setNeedsScroll(null);
      setLocation("/", { replace: true });
    } else {
      setExpandedSlug(slug);
      setNeedsScroll(null);
      setLocation(`/merchant/${slug}`, { replace: true });
    }
  }, [expandedSlug, setLocation]);

  const stripEmoji = (str: string) => str.replace(/[^\p{L}\p{N}\s&]/gu, '').trim();

  const filteredMerchants = useMemo(() => {
    const filtered = merchants.filter((merchant) => {
      const matchesSearch = 
        merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        merchant.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = 
        selectedCategories.length === 0 || 
        selectedCategories.some(cat => {
          const catText = stripEmoji(cat).toLowerCase();
          return merchant.categories.some(mc => 
            mc === cat || stripEmoji(mc).toLowerCase() === catText
          );
        });

      const matchesCountry = 
        selectedCountries.length === 0 || 
        merchant.shippingCountries.some(c => c.includes("Worldwide")) || 
        selectedCountries.some(sc => 
          merchant.shippingCountries.some(c => 
            c === sc || stripEmoji(c).toLowerCase() === stripEmoji(sc).toLowerCase()
          )
        );

      const matchesMadeIn = 
        selectedMadeIn.length === 0 || 
        (merchant.countryMadeIn && selectedMadeIn.some(mi => 
          stripEmoji(mi).toLowerCase().includes(merchant.countryMadeIn!.toLowerCase())
        ));

      const matchesProvider = 
        selectedProviders.length === 0 || 
        (merchant.paymentProvider != null && selectedProviders.includes(merchant.paymentProvider));

      const matchesPaymentMethod = 
        selectedPaymentMethods.length === 0 || 
        (selectedPaymentMethods.includes("lightning") && merchant.lightningSupported) ||
        (selectedPaymentMethods.includes("onchain") && merchant.onchainSupported) ||
        (selectedPaymentMethods.includes("cashu") && merchant.cashuSupported) ||
        (selectedPaymentMethods.includes("liquid") && merchant.liquidSupported);

      // Hide restricted-category merchants from the feed unless the visitor confirmed 18+
      if (!ageVerified && merchant.categories.some(c => restrictedCategories.has(c))) return false;

      return matchesSearch && matchesCategory && matchesCountry && matchesMadeIn && matchesProvider && matchesPaymentMethod;
    });

    const promotedNames = ["Obscura VPN", "Maple AI", "PayPerQ", "SLNT"];
    const newNames = ["SLNT"];
    const discountedNames = ["Maple AI", "PayPerQ"];
    const hottestNames = ["Obscura VPN"];

    if (sortBy === "newest") {
      return filtered.sort((a, b) => {
        const aNew = newNames.includes(a.name);
        const bNew = newNames.includes(b.name);
        if (aNew && !bNew) return -1;
        if (!aNew && bNew) return 1;
        return 0;
      });
    }

    if (sortBy === "discounted") {
      const discountValue = (d: string | null | undefined) => {
        if (!d) return -1;
        const match = d.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      return filtered.sort((a, b) => {
        const aHas = !!a.bitcoinDiscount;
        const bHas = !!b.bitcoinDiscount;
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        if (aHas && bHas) return discountValue(b.bitcoinDiscount) - discountValue(a.bitcoinDiscount);
        return 0;
      });
    }

    if (sortBy === "hottest") {
      return filtered.sort((a, b) => {
        const aHot = hottestNames.includes(a.name);
        const bHot = hottestNames.includes(b.name);
        if (aHot && !bHot) return -1;
        if (!aHot && bHot) return 1;
        return 0;
      });
    }

    return filtered.sort((a, b) => {
      const aIdx = promotedNames.indexOf(a.name);
      const bIdx = promotedNames.indexOf(b.name);
      const aPromoted = aIdx !== -1;
      const bPromoted = bIdx !== -1;
      if (aPromoted && !bPromoted) return -1;
      if (!aPromoted && bPromoted) return 1;
      if (aPromoted && bPromoted) return aIdx - bIdx;
      return 0;
    });
  }, [merchants, searchQuery, selectedCategories, selectedCountries, selectedMadeIn, selectedProviders, selectedPaymentMethods, sortBy, ageVerified, restrictedCategories]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategories, selectedCountries, selectedMadeIn, selectedProviders, selectedPaymentMethods, sortBy, pageSize]);

  // When a slug deep-link is active, jump to the page that contains that merchant.
  useEffect(() => {
    if (!expandedSlug) return;
    const idx = filteredMerchants.findIndex(m => slugify(m.name) === expandedSlug);
    if (idx === -1) return;
    setCurrentPage(Math.floor(idx / pageSize) + 1);
  }, [expandedSlug, filteredMerchants, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredMerchants.length / pageSize));
  const pagedMerchants = filteredMerchants.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCategoryChange = (category: string) => {
    if (category === "All" || !category) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(prev => 
        prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
      );
    }
  };

  const handleCountryChange = (country: string) => {
    if (country === "All" || !country) {
      setSelectedCountries([]);
    } else {
      setSelectedCountries(prev =>
        prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
      );
    }
  };

  const handleMadeInChange = (country: string) => {
    if (country === "All" || !country) {
      setSelectedMadeIn([]);
    } else {
      setSelectedMadeIn(prev =>
        prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
      );
    }
  };

  const handleProviderChange = (provider: string) => {
    setSelectedProviders(prev => 
      prev.includes(provider) ? prev.filter(p => p !== provider) : [...prev, provider]
    );
  };

  const handlePaymentMethodChange = (method: string) => {
    setSelectedPaymentMethods(prev => 
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedCountries([]);
    setSelectedMadeIn([]);
    setSelectedProviders([]);
    setSelectedPaymentMethods([]);
    setSearchQuery("");
    setSortBy("default");
  };

  const filterComponent = (
    <Filters
      merchants={merchants}
      selectedCategories={selectedCategories}
      onCategoryChange={handleCategoryChange}
      selectedCountries={selectedCountries}
      onCountryChange={handleCountryChange}
      selectedMadeIn={selectedMadeIn}
      onMadeInChange={handleMadeInChange}
      selectedProviders={selectedProviders}
      onProviderChange={handleProviderChange}
      selectedPaymentMethods={selectedPaymentMethods}
      onPaymentMethodChange={handlePaymentMethodChange}
      onClear={clearFilters}
      onCategorySearch={setSearchQuery}
      categorySearchQuery={searchQuery}
      sortBy={sortBy}
      onSortChange={setSortBy}
      ageVerified={ageVerified}
      onAgeVerify={handleAgeVerify}
    />
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      <div className="sticky top-0 z-50">
        <Navbar onSearch={setSearchQuery} filtersSlot={filterComponent} onClearFilters={clearFilters} />
        {!bannerDismissed && (
          <div className="bg-orange-50 dark:bg-orange-950/40 border-b border-orange-200 dark:border-orange-800/50 px-4 py-2.5">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <p className="text-xs md:text-sm text-orange-800 dark:text-orange-300 leading-snug">
                <span className="font-semibold">Policy:</span> We will never list merchants that use gated Bitcoin payment solutions such as BitPay or Coinbase Pay.
              </p>
              <button
                onClick={() => { setBannerDismissed(true); localStorage.setItem("policy-banner-dismissed", "1"); }}
                className="shrink-0 text-orange-500 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-200 transition-colors text-lg leading-none"
                aria-label="Dismiss"
              >×</button>
            </div>
          </div>
        )}
      </div>

      <HeroMarquee merchants={merchants} />

      <main className="flex-1 relative" style={{ backgroundImage: `url(${btcBgImage})`, backgroundSize: '600px', backgroundRepeat: 'repeat', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-background/85 dark:bg-background/80" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-mono text-foreground font-medium">{pagedMerchants.length}</span> of <span className="font-mono text-foreground font-medium">{filteredMerchants.length}</span> merchants
              {totalPages > 1 && <span className="ml-2 text-xs">(page {currentPage} of {totalPages})</span>}
            </p>
            <select
              value={pageSize}
              onChange={e => { const v = Number(e.target.value); setPageSize(v); localStorage.setItem("page-size", String(v)); }}
              className="text-xs border border-border rounded-md px-2 py-1 bg-background text-foreground cursor-pointer"
              data-testid="select-page-size"
            >
              {[25, 50, 100].map(n => <option key={n} value={n}>{n} per page</option>)}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">Loading merchants...</p>
            </div>
          ) : filteredMerchants.length > 0 ? (
            <>
              <div className="flex flex-col gap-4">
                {pagedMerchants.map((merchant, index) => (
                  <motion.div
                    key={merchant.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                  >
                    <MerchantCard
                      merchant={merchant}
                      expanded={slugify(merchant.name) === expandedSlug}
                      onToggleExpand={() => handleToggleExpand(merchant)}
                      scrollIntoView={slugify(merchant.name) === needsScroll}
                      onScrolledIntoView={() => setNeedsScroll(null)}
                      badgePresets={badgePresets}
                      selectedCategories={selectedCategories}
                    />
                  </motion.div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-end mt-6 mb-2">
                  <select
                    value={pageSize}
                    onChange={e => { const v = Number(e.target.value); setPageSize(v); localStorage.setItem("page-size", String(v)); }}
                    className="text-xs border border-border rounded-md px-2 py-1 bg-background text-foreground cursor-pointer"
                    data-testid="select-page-size-bottom"
                  >
                    {[25, 50, 100].map(n => <option key={n} value={n}>{n} per page</option>)}
                  </select>
                </div>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-2 mb-2 flex-wrap">
                  {(() => {
                    const goTo = (p: number) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };
                    const btnBase = "min-w-[36px] h-9 px-2 rounded-md border text-sm font-medium transition-colors";
                    const activeCls = `${btnBase} border-primary bg-primary text-primary-foreground`;
                    const normalCls = `${btnBase} border-border hover:bg-muted`;
                    const disabledCls = `${btnBase} border-border opacity-40 cursor-not-allowed`;

                    const pages: (number | "…")[] = [];
                    const delta = 1;
                    const left = currentPage - delta;
                    const right = currentPage + delta;
                    let last = 0;
                    for (let i = 1; i <= totalPages; i++) {
                      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
                        if (last && i - last > 1) pages.push("…");
                        pages.push(i);
                        last = i;
                      }
                    }

                    return (
                      <>
                        <button onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1} className={currentPage === 1 ? disabledCls : normalCls} data-testid="pagination-prev">← Previous</button>
                        {pages.map((p, i) =>
                          p === "…"
                            ? <span key={`ellipsis-${i}`} className="min-w-[36px] h-9 flex items-center justify-center text-sm text-muted-foreground">…</span>
                            : <button key={p} onClick={() => goTo(p as number)} className={p === currentPage ? activeCls : normalCls} data-testid={`pagination-page-${p}`}>{p}</button>
                        )}
                        <button onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages} className={currentPage === totalPages ? disabledCls : normalCls} data-testid="pagination-next">Next →</button>
                      </>
                    );
                  })()}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/20">
              <p className="text-muted-foreground text-lg">No merchants found.</p>
              <button onClick={clearFilters} className="mt-4 text-primary hover:underline">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border/40 py-8 bg-background mt-auto">
        <div className="container px-4 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="mb-4 md:mb-0">
            <span className="font-display font-bold text-foreground">btconline</span> &copy; 2024. Open Source.
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary transition-colors">GitHub</a>
            <a href="#" className="hover:text-primary transition-colors">Add Merchant</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
