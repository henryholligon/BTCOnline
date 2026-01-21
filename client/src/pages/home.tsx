import { useState, useMemo } from "react";
import Navbar from "@/components/navbar";
import Filters from "@/components/filters";
import MerchantCard from "@/components/merchant-card";
import { MOCK_MERCHANTS, Merchant, COUNTRIES, CATEGORIES, PAYMENT_PROVIDERS } from "@/lib/mock-data";
import bgImage from "@assets/generated_images/abstract_digital_network_background_with_orange_nodes_in_cypherpunk_style.png";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedMadeIn, setSelectedMadeIn] = useState("All");
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  const filteredMerchants = useMemo(() => {
    return MOCK_MERCHANTS.filter((merchant) => {
      const matchesSearch = 
        merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        merchant.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = 
        selectedCategories.length === 0 || 
        selectedCategories.some(cat => merchant.categories.includes(cat));

      const matchesCountry = 
        selectedCountry === "All" || 
        merchant.shippingCountries.some(c => c.includes("Worldwide")) || 
        merchant.shippingCountries.includes(selectedCountry);

      const matchesMadeIn = 
        selectedMadeIn === "All" || 
        (merchant.countryMadeIn && selectedMadeIn.includes(merchant.countryMadeIn));

      const matchesProvider = 
        selectedProviders.length === 0 || 
        (merchant.paymentProvider && selectedProviders.includes(merchant.paymentProvider));

      const matchesPaymentMethod = 
        selectedPaymentMethods.length === 0 || 
        (selectedPaymentMethods.includes("lightning") && merchant.lightningSupported) ||
        (selectedPaymentMethods.includes("onchain") && merchant.onchainSupported);

      const avgRating = merchant.reviews.length > 0 
        ? merchant.reviews.reduce((acc, curr) => acc + curr.rating, 0) / merchant.reviews.length 
        : 0;
      
      const matchesRating = avgRating >= minRating;

      return matchesSearch && matchesCategory && matchesCountry && matchesMadeIn && matchesProvider && matchesPaymentMethod && matchesRating;
    });
  }, [searchQuery, selectedCategories, selectedCountry, selectedMadeIn, selectedProviders, selectedPaymentMethods, minRating]);

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
    setMinRating(0);
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
      minRating={minRating}
      onRatingChange={setMinRating}
      selectedPaymentMethods={selectedPaymentMethods}
      onPaymentMethodChange={handlePaymentMethodChange}
      onClear={clearFilters}
    />
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      <Navbar onSearch={setSearchQuery} filtersSlot={filterComponent} />
      
      <div className="relative border-b border-border/50 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 dark:opacity-20 opacity-10">
            <img src={bgImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        
        <div className="container relative z-10 px-4 py-8 md:py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-6xl font-display font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70 dark:from-white dark:to-white/70 leading-tight">
              Find places to spend <span className="text-primary">Bitcoin online</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A free and open source directory of businesses that accept Bitcoin
            </p>
          </motion.div>
        </div>
      </div>

      <main className="container px-4 py-6 flex-1">
        <div className="flex flex-col gap-6">
          <div className="md:hidden -mx-4 px-4 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-2 min-w-max pb-2">
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-auto h-9 bg-muted/50 border-none rounded-full text-[11px] font-medium px-4 gap-2">
                  <SelectValue placeholder="Shipping to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Anywhere</SelectItem>
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={selectedCategories[0] || "All"} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-auto h-9 bg-muted/50 border-none rounded-full text-[11px] font-medium px-4 gap-2">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={selectedProviders[0] || "All"} onValueChange={handleProviderChange}>
                <SelectTrigger className="w-auto h-9 bg-muted/50 border-none rounded-full text-[11px] font-medium px-4 gap-2">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Providers</SelectItem>
                  {PAYMENT_PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <aside className="hidden md:block w-64 shrink-0 sticky top-24 h-[calc(100vh-8rem)]">
              {filterComponent}
            </aside>

            <div className="flex-1">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-mono text-foreground font-medium">{filteredMerchants.length}</span> merchants
                </p>
              </div>

              {filteredMerchants.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {filteredMerchants.map((merchant, index) => (
                    <motion.div
                      key={merchant.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
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
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 py-8 bg-background mt-auto">
        <div className="container px-4 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="mb-4 md:mb-0">
            <span className="font-display font-bold text-foreground">btconline</span> &copy; 2024. Open Source.
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary transition-colors">GitHub</a>
            <a href="#" className="hover:text-primary transition-colors">Nostr</a>
            <a href="#" className="hover:text-primary transition-colors">Add Merchant</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
