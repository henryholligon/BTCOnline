import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Compass, Loader2, Bookmark, BookmarkCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import { useNostr } from "@/context/NostrContext";
import { fetchPublicLists, fetchProfile, DEFAULT_RELAYS } from "@/lib/nostr";
import { npubEncode } from "nostr-tools/nip19";
import type { Event } from "nostr-tools";
import type { Merchant } from "@shared/schema";
import btcBgImage from "@assets/image_1771226498805.png";

interface ListCard {
  event: Event;
  authorNpub: string;
  authorName: string;
  authorPicture?: string;
  title: string;
  description: string;
  merchantCount: number;
  dTag: string;
  previewUrls: string[];
}

const PROFILE_CACHE = new Map<string, { name: string; picture?: string }>();

async function getProfile(pubkey: string): Promise<{ name: string; picture?: string }> {
  if (PROFILE_CACHE.has(pubkey)) return PROFILE_CACHE.get(pubkey)!;
  const profile = await fetchProfile(pubkey, DEFAULT_RELAYS);
  const result = {
    name: profile?.display_name || profile?.name || npubEncode(pubkey).slice(0, 12) + "…",
    picture: profile?.picture,
  };
  PROFILE_CACHE.set(pubkey, result);
  return result;
}

function LogoGrid({ urls, merchants }: { urls: string[]; merchants: Merchant[] }) {
  const slots = Array.from({ length: 4 }, (_, i) => {
    const url = urls[i];
    if (!url) return null;
    return merchants.find(m => m.website === url) ?? null;
  });

  return (
    <div className="shrink-0 grid grid-cols-2 gap-1 w-[72px] h-[72px]">
      {slots.map((merchant, i) => (
        <div key={i} className="rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          {merchant?.logo ? (
            <img src={merchant.logo} alt={merchant.name} className="w-full h-full object-contain p-0.5" />
          ) : merchant ? (
            <span className="text-[10px] font-bold text-muted-foreground leading-none text-center px-0.5 truncate">
              {merchant.name.slice(0, 3)}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground/40">₿</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function DiscoverPage() {
  const [, navigate] = useLocation();
  const { user, savedLists, savePublicList, unsavePublicList } = useNostr();
  const [cards, setCards] = useState<ListCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: merchants = [] } = useQuery<Merchant[]>({ queryKey: ["/api/merchants"] });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPublicLists(DEFAULT_RELAYS)
      .then(async events => {
        if (cancelled) return;
        const results: ListCard[] = [];
        await Promise.all(events.map(async ev => {
          const title = ev.tags.find(t => t[0] === "title")?.[1] || "";
          const description = ev.tags.find(t => t[0] === "description")?.[1] || "";
          const dTag = ev.tags.find(t => t[0] === "d")?.[1] ?? ev.id;
          const allUrls = ev.tags.filter(t => t[0] === "r").map(t => t[1]);
          if (allUrls.length === 0) return;
          try {
            const profile = await getProfile(ev.pubkey);
            results.push({
              event: ev,
              authorNpub: npubEncode(ev.pubkey),
              authorName: profile.name,
              authorPicture: profile.picture,
              title, description,
              merchantCount: allUrls.length,
              dTag,
              previewUrls: allUrls.slice(0, 4),
            });
          } catch {
            results.push({
              event: ev,
              authorNpub: npubEncode(ev.pubkey),
              authorName: npubEncode(ev.pubkey).slice(0, 12) + "…",
              title, description,
              merchantCount: allUrls.length,
              dTag,
              previewUrls: allUrls.slice(0, 4),
            });
          }
        }));
        if (!cancelled) {
          results.sort((a, b) => b.merchantCount - a.merchantCount || b.event.created_at - a.event.created_at);
          setCards(results);
        }
      })
      .catch(() => { if (!cancelled) setError("Failed to load public lists. Please try again."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const isSaved = (authorPubkey: string, dTag: string) =>
    savedLists.some(l => l.authorPubkey === authorPubkey && l.dTag === dTag);

  const handleToggleSave = (e: React.MouseEvent, card: ListCard) => {
    e.stopPropagation();
    if (isSaved(card.event.pubkey, card.dTag)) {
      unsavePublicList(card.event.pubkey, card.dTag);
    } else {
      savePublicList({
        authorPubkey: card.event.pubkey,
        dTag: card.dTag,
        title: card.title,
        description: card.description,
        merchantCount: card.merchantCount,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar onSearch={() => {}} />

      <div className="border-b border-border/50 bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Compass className="h-6 w-6 text-primary" />
              <h1 className="text-2xl md:text-4xl font-display font-bold tracking-tight">Discover Lists</h1>
            </div>
            <p className="text-muted-foreground">
              Curated merchant collections from the community. Save packs you like to your{" "}
              <Link href="/lists" className="text-primary hover:underline">lists page</Link>.
            </p>
          </motion.div>
        </div>
      </div>

      <main
        className="flex-1 relative"
        style={{ backgroundImage: `url(${btcBgImage})`, backgroundSize: "600px", backgroundRepeat: "repeat", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-background/85 dark:bg-background/80" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">

          <div className="mb-4 flex items-center gap-3">
            <Link href="/">
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            </Link>
            {user && (
              <Link href="/lists" className="ml-auto text-xs text-primary hover:underline">My Lists →</Link>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Fetching public lists from relays…</span>
            </div>
          ) : error ? (
            <div className="text-center py-16 border border-dashed border-border rounded-lg bg-card/20">
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-lg bg-card/20">
              <Compass className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">No public lists found on connected relays yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Be the first — create a public list on your <Link href="/lists" className="text-primary hover:underline">lists page</Link>.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-2">
                <span className="font-mono text-foreground font-medium">{cards.length}</span> public{" "}
                {cards.length === 1 ? "list" : "lists"} found
              </p>
              {cards.map((card, idx) => {
                const saved = isSaved(card.event.pubkey, card.dTag);
                return (
                  <motion.div
                    key={`${card.event.pubkey}:${card.dTag}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.4) }}
                    className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/discover/${card.authorNpub}/${encodeURIComponent(card.dTag)}`)}
                  >
                    <div className="flex items-center gap-4">
                      <LogoGrid urls={card.previewUrls} merchants={merchants} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-base leading-tight truncate">{card.title}</p>
                            {card.description && (
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                                {card.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleToggleSave(e, card)}
                            title={saved ? "Remove from saved" : "Save this list"}
                            className={`shrink-0 h-8 w-8 flex items-center justify-center rounded-lg border transition-colors ${
                              saved
                                ? "border-primary/40 bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                            }`}
                          >
                            {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 mt-2">
                          {card.authorPicture ? (
                            <img src={card.authorPicture} alt={card.authorName} className="h-4 w-4 rounded-full object-cover border border-border" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center text-[8px] font-bold text-primary-foreground shrink-0">
                              {card.authorName[0]?.toUpperCase() || "⚡"}
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground truncate">{card.authorName}</span>
                          <span className="text-xs text-muted-foreground/40 ml-auto shrink-0">
                            {card.merchantCount} {card.merchantCount === 1 ? "merchant" : "merchants"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
