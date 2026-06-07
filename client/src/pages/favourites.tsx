import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import Navbar from "@/components/navbar";
import MerchantCard from "@/components/merchant-card";
import { type Merchant, type BadgePreset } from "@shared/schema";
import { useNostr } from "@/context/NostrContext";
import { slugify } from "@/lib/utils";
import btcBgImage from "@assets/image_1771226498805.png";

export default function Favourites() {
  const { user, favourites, openLoginModal } = useNostr();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [badgePresets, setBadgePresets] = useState<BadgePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/merchants", { cache: "no-store" })
      .then(r => r.json())
      .then(data => { setMerchants(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/badge-presets")
      .then(r => r.json())
      .then(setBadgePresets)
      .catch(() => {});
  }, []);

  const favMerchants = merchants.filter(m => favourites.has(m.website));

  const handleToggleExpand = (merchant: Merchant) => {
    const slug = slugify(merchant.name);
    setExpandedSlug(prev => (prev === slug ? null : slug));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      <Navbar onSearch={() => {}} filtersSlot={null} onClearFilters={() => {}} />

      <div className="border-b border-border/50 bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Heart className="h-6 w-6 text-red-500 fill-current" />
              <h1 className="text-2xl md:text-4xl font-display font-bold tracking-tight">
                My Favourites
              </h1>
            </div>
            <p className="text-muted-foreground">
              Merchants you've saved with ♡
            </p>
          </motion.div>
        </div>
      </div>

      <main
        className="flex-1 relative"
        style={{
          backgroundImage: `url(${btcBgImage})`,
          backgroundSize: "600px",
          backgroundRepeat: "repeat",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-background/85 dark:bg-background/80" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">

          {!user ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24 border border-dashed border-border rounded-lg bg-card/20"
            >
              <Heart className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">Sign in to see your favourites</p>
              <p className="text-sm text-muted-foreground/60 mb-6">
                Favourites are stored on Nostr — they follow you across devices.
              </p>
              <button
                onClick={openLoginModal}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                data-testid="button-sign-in-favourites"
              >
                ⚡ Sign in
              </button>
            </motion.div>
          ) : loading ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">Loading…</p>
            </div>
          ) : favMerchants.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24 border border-dashed border-border rounded-lg bg-card/20"
            >
              <Heart className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">No favourites yet</p>
              <p className="text-sm text-muted-foreground/60 mb-6">
                Hit the ♡ on any merchant card to save it here.
              </p>
              <Link
                href="/"
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                data-testid="link-browse-merchants"
              >
                Browse merchants
              </Link>
            </motion.div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                <span className="font-mono text-foreground font-medium">{favMerchants.length}</span>{" "}
                {favMerchants.length === 1 ? "merchant" : "merchants"} saved
              </p>
              <div className="flex flex-col gap-4">
                {favMerchants.map((merchant, index) => {
                  const slug = slugify(merchant.name);
                  return (
                    <motion.div
                      key={merchant.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
                    >
                      <MerchantCard
                        merchant={merchant}
                        expanded={slug === expandedSlug}
                        onToggleExpand={() => handleToggleExpand(merchant)}
                        scrollIntoView={false}
                        onScrolledIntoView={() => {}}
                        badgePresets={badgePresets}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </>
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
