import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { decode } from "nostr-tools/nip19";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import { fetchProfile, fetchFavourites, fetchRelayList } from "@/lib/nostr";
import { useNostr } from "@/context/NostrContext";
import { Heart, MessageSquare, Copy, Check, ExternalLink, Pencil, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { generateNostrIdentity } from "@/lib/generated-identity";
import { type Merchant } from "@shared/schema";
import { slugify } from "@/lib/utils";
import btcBgImage from "@assets/image_1771226498805.png";

interface NostrProfile {
  name?: string;
  display_name?: string;
  picture?: string;
  about?: string;
  nip05?: string;
  website?: string;
}

interface ActivityItem {
  id: number;
  merchantId: number;
  merchantName: string;
  merchantWebsite: string;
  merchantLogo: string;
  body: string;
  rating: number | null;
  createdAt: string;
}

export default function ProfilePage() {
  const { npub } = useParams<{ npub: string }>();
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState(false);
  const [profile, setProfile] = useState<NostrProfile | null>(null);
  const [publicLikes, setPublicLikes] = useState<Set<string> | null>(null);
  const [likesPrivate, setLikesPrivate] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { user, updateProfile } = useNostr();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPicture, setEditPicture] = useState("");
  const [saving, setSaving] = useState(false);

  // Decode npub → hex pubkey
  useEffect(() => {
    if (!npub) return;
    try {
      const decoded = decode(npub);
      if (decoded.type !== "npub") { setDecodeError(true); return; }
      setPubkey(decoded.data as string);
    } catch {
      setDecodeError(true);
    }
  }, [npub]);

  // Fetch Nostr profile (kind:0) + public likes (kind:7 reactions; legacy kind:10003 read-compat)
  useEffect(() => {
    if (!pubkey) return;
    let cancelled = false;
    setProfileLoading(true);
    (async () => {
      try {
        const relays = await fetchRelayList(pubkey);
        const [p, fav] = await Promise.all([
          fetchProfile(pubkey, relays.read),
          fetchFavourites(pubkey, relays.read),
        ]);
        if (cancelled) return;
        setProfile(p as NostrProfile | null);
        if (fav.isPrivate) {
          setLikesPrivate(true);
          setPublicLikes(null);
        } else {
          setPublicLikes(fav.urls);
        }
      } catch {
        // silently ignore relay errors
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pubkey]);

  // Fetch on-site activity (comments + reviews from DB)
  const { data: activity = [], isLoading: activityLoading } = useQuery<ActivityItem[]>({
    queryKey: ["profile-activity", pubkey],
    queryFn: () => fetch(`/api/profile/${pubkey}/activity`).then(r => r.json()),
    enabled: !!pubkey,
  });

  const { data: merchants = [] } = useQuery<Merchant[]>({ queryKey: ["/api/merchants"] });

  const likedMerchants = publicLikes ? merchants.filter(m => publicLikes.has(m.website)) : [];
  const isOwner = !!user && !!pubkey && user.pubkey === pubkey;
  const generatedIdentity = pubkey ? generateNostrIdentity(pubkey) : null;
  const displayName = profile?.display_name
    || profile?.name
    || (isOwner ? user?.displayName : generatedIdentity?.name)
    || (npub ? npub.slice(0, 20) + "…" : "");
  const picture = profile?.picture || (isOwner ? user?.picture : undefined) || undefined;

  const copyNpub = () => {
    if (!npub) return;
    navigator.clipboard.writeText(npub).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const beginEditing = () => {
    const generated = pubkey ? generateNostrIdentity(pubkey) : null;
    setEditName(profile?.display_name || profile?.name || generated?.name || displayName);
    setEditPicture(profile?.picture || generated?.avatarUrl || "");
    setEditing(true);
  };

  const useGeneratedAvatar = () => {
    if (pubkey) setEditPicture(generateNostrIdentity(pubkey).avatarUrl);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name: editName, picture: editPicture });
      setProfile(prev => ({
        ...(prev || {}),
        name: editName.trim(),
        display_name: editName.trim(),
        picture: editPicture.trim(),
      }));
      setEditing(false);
      toast({ title: "Profile updated", description: "Your Nostr profile was published to your write relays." });
    } catch (e: any) {
      toast({ title: "Could not update profile", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (decodeError) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <Navbar onSearch={() => {}} filtersSlot={null} onClearFilters={() => {}} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">Invalid profile link.</p>
            <Link href="/" className="text-primary hover:underline text-sm">← Back to directory</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      <Navbar onSearch={() => {}} filtersSlot={null} onClearFilters={() => {}} />

      {/* ── Profile header ─────────────────────────────────────────────── */}
      <div className="border-b border-border/50 bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {profileLoading ? (
            <div className="flex gap-5 items-center">
              <div className="h-20 w-20 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-6 w-44 bg-muted rounded animate-pulse" />
                <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                <div className="h-3 w-40 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <div className="flex gap-5 items-start">
                {/* Avatar */}
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center shrink-0 text-2xl font-bold text-muted-foreground overflow-hidden border-2 border-border">
                  {picture ? (
                    <img
                      src={picture}
                      alt={displayName}
                      className="h-full w-full object-cover"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : generatedIdentity ? (
                    <span className="text-3xl">{generatedIdentity.emoji}</span>
                  ) : (
                    (displayName[0] || "?").toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <div className="space-y-3 max-w-md">
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="Display name"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={editPicture}
                          onChange={e => setEditPicture(e.target.value)}
                          placeholder="Profile picture URL"
                        />
                        <Button type="button" variant="outline" size="icon" onClick={useGeneratedAvatar} title="Use generated avatar">
                          <Wand2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveProfile} disabled={saving || !editName.trim()}>
                          {saving ? "Publishing…" : "Publish profile"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-display font-bold tracking-tight">{displayName}</h1>
                      {isOwner && (
                        <Button type="button" variant="ghost" size="icon" onClick={beginEditing} title="Edit profile">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                  {!editing && profile?.about && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3 max-w-xl">{profile.about}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    {profile?.nip05 && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                        <span>✓</span> {profile.nip05}
                      </span>
                    )}
                    <button
                      onClick={copyNpub}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
                      title="Copy npub"
                    >
                      <span>{npub?.slice(0, 24)}…</span>
                      {copied
                        ? <Check className="h-3 w-3 text-green-500" />
                        : <Copy className="h-3 w-3" />}
                    </button>
                    {profile?.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {profile.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
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
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 space-y-10">

          {/* ── Public Likes ─────────────────────────────────────────────── */}
          {!likesPrivate && publicLikes !== null && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2 mb-4">
                <Heart className="h-3.5 w-3.5 text-red-400 fill-current" />
                Public Likes
                {likedMerchants.length > 0 && (
                  <span className="font-mono text-foreground/80 normal-case tracking-normal">{likedMerchants.length}</span>
                )}
              </h2>

              {likedMerchants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No public likes yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {likedMerchants.map(m => (
                    <Link key={m.id} href={`/merchant/${slugify(m.name)}`}>
                      <div className="flex items-center gap-2.5 border border-border rounded-lg p-2.5 bg-card hover:border-primary/40 hover:bg-card/80 transition-colors cursor-pointer group">
                        <div className="h-8 w-8 rounded-md border border-border bg-white flex items-center justify-center shrink-0 overflow-hidden">
                          {m.logo.startsWith("/") || m.logo.startsWith("http")
                            ? <img src={m.logo} alt={m.name} className="h-full w-full object-contain" />
                            : <span className="text-base">{m.logo}</span>}
                        </div>
                        <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{m.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Activity timeline ─────────────────────────────────────────── */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2 mb-4">
              <MessageSquare className="h-3.5 w-3.5" />
              Activity
            </h2>

            {activityLoading ? (
              <div className="space-y-0">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-muted animate-pulse mt-1.5 shrink-0" />
                      {i < 3 && <div className="flex-1 w-px bg-border/30 mt-1" />}
                    </div>
                    <div className="pb-6 flex-1 space-y-1.5">
                      <div className="h-4 w-36 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-64 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No public activity yet.</p>
            ) : (
              <div>
                {activity.map((item, idx) => {
                  const isLast = idx === activity.length - 1;
                  const isReview = item.rating !== null;
                  return (
                    <div key={item.id} className="flex gap-3">
                      {/* Timeline spine */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ring-2 ring-background ${isReview ? "bg-amber-400" : "bg-border"}`} />
                        {!isLast && <div className="flex-1 w-px bg-border/40 mt-1 min-h-[1.5rem]" />}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 min-w-0 ${!isLast ? "pb-6" : "pb-2"}`}>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-0.5">
                          <Link
                            href={`/merchant/${slugify(item.merchantName)}`}
                            className="text-sm font-semibold hover:text-primary transition-colors"
                          >
                            {item.merchantName}
                          </Link>
                          {isReview ? (
                            <span className="flex items-center gap-0 text-[11px]">
                              {[1, 2, 3, 4, 5].map(s => (
                                <span key={s} className={s <= item.rating! ? "text-amber-400" : "text-muted-foreground/25"}>★</span>
                              ))}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wide">comment</span>
                          )}
                          <span className="text-[11px] text-muted-foreground ml-auto whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                        </div>
                        {item.body?.trim() && (
                          <p className="text-sm text-foreground/80 break-words line-clamp-4">{item.body}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

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
