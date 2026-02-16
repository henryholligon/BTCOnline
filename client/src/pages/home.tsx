import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/navbar";
import Filters from "@/components/filters";
import MerchantCard from "@/components/merchant-card";
import { type Merchant } from "@shared/schema";
import bgImage from "@assets/generated_images/abstract_digital_network_background_with_orange_nodes_in_cypherpunk_style.png";
import heroBanner from "@assets/image_1771267917861.png";
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      <Navbar onSearch={setSearchQuery} filtersSlot={filterComponent} />
      
      <div className="relative border-b border-border/50 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <img src={heroBanner} alt="Find Places to Spend Bitcoin Online - A free and open source directory of merchants that accept Bitcoin" className="w-full h-auto object-cover" />
        </motion.div>
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
