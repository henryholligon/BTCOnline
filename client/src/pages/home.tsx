import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/navbar";
import Filters from "@/components/filters";
import MerchantCard from "@/components/merchant-card";
import { type Merchant } from "@shared/schema";
import { motion } from "framer-motion";

export default function Home() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedMadeIn, setSelectedMadeIn] = useState("All");
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/merchants")
      .then((res) => res.json())
      .then((data) => {
        setMerchants(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stripEmoji = (str: string) => str.replace(/[^\p{L}\p{N}\s&]/gu, '').trim();

  const filteredMerchants = useMemo(() => {
    return merchants.filter((merchant) => {
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
        selectedCountry === "All" || 
        merchant.shippingCountries.some(c => c.includes("Worldwide")) || 
        merchant.shippingCountries.some(c => 
          c === selectedCountry || stripEmoji(c).toLowerCase() === stripEmoji(selectedCountry).toLowerCase()
        );

      const matchesMadeIn = 
        selectedMadeIn === "All" || 
        (merchant.countryMadeIn && stripEmoji(selectedMadeIn).toLowerCase().includes(merchant.countryMadeIn.toLowerCase()));

      const matchesProvider = 
        selectedProviders.length === 0 || 
        (merchant.paymentProvider && selectedProviders.includes(merchant.paymentProvider));

      const matchesPaymentMethod = 
        selectedPaymentMethods.length === 0 || 
        (selectedPaymentMethods.includes("lightning") && merchant.lightningSupported) ||
        (selectedPaymentMethods.includes("onchain") && merchant.onchainSupported);

      return matchesSearch && matchesCategory && matchesCountry && matchesMadeIn && matchesProvider && matchesPaymentMethod;
    });
  }, [merchants, searchQuery, selectedCategories, selectedCountry, selectedMadeIn, selectedProviders, selectedPaymentMethods]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(category === "All" || !category ? [] : [category]);
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
    setSelectedCountry("All");
    setSelectedMadeIn("All");
    setSelectedProviders([]);
    setSelectedPaymentMethods([]);
    setSearchQuery("");
  };

  const filterComponent = (
    <Filters
      selectedCategories={selectedCategories}
      onCategoryChange={handleCategoryChange}
      selectedCountry={selectedCountry}
      onCountryChange={setSelectedCountry}
      selectedMadeIn={selectedMadeIn}
      onMadeInChange={setSelectedMadeIn}
      selectedProviders={selectedProviders}
      onProviderChange={handleProviderChange}
      selectedPaymentMethods={selectedPaymentMethods}
      onPaymentMethodChange={handlePaymentMethodChange}
      onClear={clearFilters}
    />
  );

  const hasActiveFilters = selectedCategories.length > 0 || selectedCountry !== "All" || selectedMadeIn !== "All" || selectedProviders.length > 0 || selectedPaymentMethods.length > 0 || searchQuery.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar onSearch={setSearchQuery} filtersSlot={filterComponent} />
      
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent dark:from-primary/[0.06] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/[0.08] dark:bg-primary/[0.04] rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container relative z-10 px-4 py-12 md:py-20 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <h1 className="text-4xl md:text-[56px] font-semibold tracking-tight leading-[1.1] mb-5">
              Find places to spend{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
                Bitcoin online
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto font-normal">
              A free and open source directory of businesses that accept Bitcoin
            </p>
          </motion.div>
        </div>
      </div>

      <main className="container px-4 pb-12 flex-1">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="hidden md:block w-60 shrink-0 sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
            {filterComponent}
          </aside>

          <div className="flex-1 min-w-0">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{filteredMerchants.length}</span>
                {" "}merchant{filteredMerchants.length !== 1 ? "s" : ""}
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="ml-3 text-primary hover:text-primary/80 font-medium transition-colors">
                    Clear filters
                  </button>
                )}
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Loading merchants...</p>
              </div>
            ) : filteredMerchants.length > 0 ? (
              <div className="flex flex-col gap-3">
                {filteredMerchants.map((merchant, index) => (
                  <motion.div
                    key={merchant.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.35, 
                      delay: Math.min(index * 0.03, 0.6),
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                  >
                    <MerchantCard merchant={merchant} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-lg font-medium text-foreground/80 mb-2">No merchants found</p>
                <p className="text-sm text-muted-foreground mb-5">Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border/50 py-8 bg-card/50">
        <div className="container px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div>
            <span className="font-semibold text-foreground">btconline</span>
            <span className="mx-2 text-border">·</span>
            Open Source
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="#" className="hover:text-foreground transition-colors">Add Merchant</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
