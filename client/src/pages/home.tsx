import { useState, useMemo, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import Navbar from "@/components/navbar";
import Filters from "@/components/filters";
import MerchantCard from "@/components/merchant-card";
import { type Merchant, type BadgePreset } from "@shared/schema";
import { slugify } from "@/lib/utils";
import btcBgImage from "@assets/image_1771226498805.png";
import { motion } from "framer-motion";


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
  const PAGE_SIZE = 50;

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
        (selectedPaymentMethods.includes("onchain") && merchant.onchainSupported);

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
  }, [merchants, searchQuery, selectedCategories, selectedCountries, selectedMadeIn, selectedProviders, selectedPaymentMethods, sortBy]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategories, selectedCountries, selectedMadeIn, selectedProviders, selectedPaymentMethods, sortBy]);

  // When a slug deep-link is active, jump to the page that contains that merchant.
  useEffect(() => {
    if (!expandedSlug) return;
    const idx = filteredMerchants.findIndex(m => slugify(m.name) === expandedSlug);
    if (idx === -1) return;
    setCurrentPage(Math.floor(idx / PAGE_SIZE) + 1);
  }, [expandedSlug, filteredMerchants]);

  const totalPages = Math.max(1, Math.ceil(filteredMerchants.length / PAGE_SIZE));
  const pagedMerchants = filteredMerchants.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
    />
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      <Navbar onSearch={setSearchQuery} filtersSlot={filterComponent} onClearFilters={clearFilters} />
      
      <div className="relative border-b border-border/50 overflow-hidden bg-background">
        <div className="max-w-3xl mx-auto relative z-10 px-4 py-10 md:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-6xl font-display font-bold tracking-tight mb-4 leading-tight">
              Find places to spend <span className="text-primary">₿itcoin online</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A free and open source directory of merchants that accept Bitcoin
            </p>
          </motion.div>
        </div>
      </div>

      <main className="flex-1 relative" style={{ backgroundImage: `url(${btcBgImage})`, backgroundSize: '600px', backgroundRepeat: 'repeat', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-background/85 dark:bg-background/80" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-mono text-foreground font-medium">{pagedMerchants.length}</span> of <span className="font-mono text-foreground font-medium">{filteredMerchants.length}</span> merchants
              {totalPages > 1 && <span className="ml-2 text-xs">(page {currentPage} of {totalPages})</span>}
            </p>
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
                    />
                  </motion.div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-8 mb-2 flex-wrap">
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
