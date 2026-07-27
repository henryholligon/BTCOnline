import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import MerchantCard from "@/components/merchant-card";
import { fetchProfile, DEFAULT_RELAYS, poolQuerySync } from "@/lib/nostr";
import { decode } from "nostr-tools/nip19";
import { npubEncode } from "nostr-tools/nip19";
import type { Event, Filter } from "nostr-tools";
import { type Merchant, type BadgePreset } from "@shared/schema";
import btcBgImage from "@assets/image_1771226498805.png";

export default function DiscoverListPage() {
  const params = useParams<{ npub: string; dTag: string }>();
  const npub = params.npub;
  const dTag = decodeURIComponent(params.dTag);

  const [listEvent, setListEvent] = useState<Event | null>(null);
  const [curator, setCurator] = useState<{ name: string; picture?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: merchants = [] } = useQuery<Merchant[]>({ queryKey: ["/api/merchants"] });
  const { data: badgePresets = [] } = useQuery<BadgePreset[]>({ queryKey: ["/api/badge-presets"] });

  useEffect(() => {
    if (!npub || !dTag) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Decode npub → pubkey hex
        const decoded = decode(npub);
        if (decoded.type !== "npub") throw new Error("Invalid npub");
        const pubkey = decoded.data as string;

        // Fetch the specific kind-30004 event
        const events = await poolQuerySync(
          DEFAULT_RELAYS,
          { kinds: [30004], authors: [pubkey], "#d": [dTag] } as Filter,
          8000,
        );

        if (cancelled) return;

        // Pick the newest revision
        const event = events.sort((a, b) => b.created_at - a.created_at)[0] ?? null;
        if (!event) { setError("List not found."); return; }
        if (
          event.tags.some(t => t[0] === "private" && t[1] === "true") ||
          event.tags.some(t => t[0] === "deleted" && t[1] === "true")
        ) {
          setError("This list is private or has been deleted.");
          return;
        }

        setListEvent(event);

        // Fetch curator profile
        const profile = await fetchProfile(pubkey, DEFAULT_RELAYS);
        if (!cancelled) {
          setCurator({
            name: profile?.display_name || profile?.name || npubEncode(pubkey).slice(0, 12) + "…",
            picture: profile?.picture,
          });
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load this list.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [npub, dTag]);

  const title = listEvent?.tags.find(t => t[0] === "title")?.[1] ?? "Untitled List";
  const description = listEvent?.tags.find(t => t[0] === "description")?.[1] ?? "";
  const listUrls = listEvent?.tags.filter(t => t[0] === "r").map(t => t[1]) ?? [];
  const listMerchants = listUrls
    .map(url => merchants.find(m => m.website === url))
    .filter((m): m is Merchant => !!m);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar onSearch={() => {}} />

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

          {/* Back */}
          <div className="mb-6">
            <Link href="/discover">
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Discover
              </button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading list…</span>
            </div>
          ) : error ? (
            <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/20">
              <p className="text-muted-foreground">{error}</p>
              <Link href="/discover" className="text-xs text-primary hover:underline mt-2 block">
                ← Back to Discover
              </Link>
            </div>
          ) : (
            <>
              {/* List header */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-6"
              >
                <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight mb-1">
                  {title}
                </h1>
                {description && (
                  <p className="text-muted-foreground text-sm mb-3">{description}</p>
                )}
                <div className="flex items-center gap-2">
                  {curator?.picture ? (
                    <img
                      src={curator.picture}
                      alt={curator.name}
                      className="h-5 w-5 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground shrink-0">
                      {curator?.name[0]?.toUpperCase() ?? "⚡"}
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground">{curator?.name}</span>
                  <span className="text-muted-foreground/40 mx-1">·</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {listUrls.length} {listUrls.length === 1 ? "merchant" : "merchants"}
                  </span>
                </div>
              </motion.div>

              {/* Merchant cards */}
              {merchants.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                  <span className="text-sm text-muted-foreground">Loading merchants…</span>
                </div>
              ) : listMerchants.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-lg bg-card/20">
                  <p className="text-muted-foreground">
                    None of the merchants in this list are in the directory yet.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {listMerchants.map((merchant, idx) => (
                    <motion.div
                      key={merchant.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.5) }}
                    >
                      <MerchantCard
                        merchant={merchant}
                        expanded={expandedId === merchant.id}
                        onToggleExpand={() =>
                          setExpandedId(expandedId === merchant.id ? null : merchant.id)
                        }
                        badgePresets={badgePresets}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
