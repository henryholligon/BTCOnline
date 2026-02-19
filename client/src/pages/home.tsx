import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/navbar";
import Filters from "@/components/filters";
import MerchantCard from "@/components/merchant-card";
import { type Merchant } from "@shared/schema";
import btcBgImage from "@assets/image_1771226498805.png";
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
  const [sortBy, setSortBy] = useState("default");

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
      return filtered.sort((a, b) => {
        const aDisc = discountedNames.includes(a.name);
        const bDisc = discountedNames.includes(b.name);
        if (aDisc && !bDisc) return -1;
        if (!aDisc && bDisc) return 1;
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
  }, [merchants, searchQuery, selectedCategories, selectedCountry, selectedMadeIn, selectedProviders, selectedPaymentMethods, sortBy]);

  const handleCategoryChange = (category: string) => {
    if (category === "All" || !category) {
      setSelectedCategories([]);
    } else if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([category]);
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
    setSelectedCountry("All");
    setSelectedMadeIn("All");
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
      selectedCountry={selectedCountry}
      onCountryChange={setSelectedCountry}
      selectedMadeIn={selectedMadeIn}
      onMadeInChange={setSelectedMadeIn}
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
              Find places to spend <span className="text-primary">Bitcoin online</span>
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
              Showing <span className="font-mono text-foreground font-medium">{filteredMerchants.length}</span> merchants
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">Loading merchants...</p>
            </div>
          ) : filteredMerchants.length > 0 ? (
            <div className="flex flex-col gap-4">
              {filteredMerchants.map((merchant, index) => (
                <motion.div
                  key={merchant.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                >
                  <MerchantCard merchant={merchant} />
                </motion.div>
              ))}
            </div>
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
