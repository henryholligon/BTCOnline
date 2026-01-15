import { useState, useMemo } from "react";
import Navbar from "@/components/navbar";
import Filters from "@/components/filters";
import MerchantCard from "@/components/merchant-card";
import { MOCK_MERCHANTS, Merchant } from "@/lib/mock-data";
import bgImage from "@assets/generated_images/abstract_digital_network_background_with_orange_nodes_in_cypherpunk_style.png";
import { motion } from "framer-motion";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [minRating, setMinRating] = useState(0);

  const filteredMerchants = useMemo(() => {
    return MOCK_MERCHANTS.filter((merchant) => {
      // Search Filter
      const matchesSearch = 
        merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        merchant.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Category Filter
      const matchesCategory = 
        selectedCategories.length === 0 || 
        selectedCategories.some(cat => merchant.categories.includes(cat));

      // Country Filter
      const matchesCountry = 
        selectedCountry === "All" || 
        merchant.shippingCountries.includes("Worldwide") || 
        merchant.shippingCountries.includes(selectedCountry);

      // Rating Filter
      const avgRating = merchant.reviews.length > 0 
        ? merchant.reviews.reduce((acc, curr) => acc + curr.rating, 0) / merchant.reviews.length 
        : 0;
      
      const matchesRating = avgRating >= minRating;

      return matchesSearch && matchesCategory && matchesCountry && matchesRating;
    });
  }, [searchQuery, selectedCategories, selectedCountry, minRating]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedCountry("All");
    setMinRating(0);
    setSearchQuery("");
  };

  const filterComponent = (
    <Filters
      selectedCategories={selectedCategories}
      onCategoryChange={handleCategoryChange}
      selectedCountry={selectedCountry}
      onCountryChange={setSelectedCountry}
      minRating={minRating}
      onRatingChange={setMinRating}
      onClear={clearFilters}
    />
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      <Navbar onSearch={setSearchQuery} filtersSlot={filterComponent} />
      
      {/* Hero Section */}
      <div className="relative border-b border-border/50 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
            <img src={bgImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        
        <div className="container relative z-10 px-4 py-16 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
              Find places to spend <span className="text-primary">Bitcoin online</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              A community-curated directory of online merchants who accept Bitcoin.
            </p>
          </motion.div>
        </div>
      </div>

      <main className="container px-4 py-8 flex-1">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden md:block w-64 shrink-0 sticky top-24 h-[calc(100vh-8rem)]">
            {filterComponent}
          </aside>

          {/* Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground">
                Showing <span className="font-mono text-foreground font-medium">{filteredMerchants.length}</span> merchants
              </p>
            </div>

            {filteredMerchants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMerchants.map((merchant, index) => (
                  <motion.div
                    key={merchant.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <MerchantCard merchant={merchant} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/20">
                <p className="text-muted-foreground text-lg">No merchants found matching your criteria.</p>
                <button onClick={clearFilters} className="mt-4 text-primary hover:underline">
                  Clear all filters
                </button>
              </div>
            )}
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
