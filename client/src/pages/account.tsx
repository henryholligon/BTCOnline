import { Link } from "wouter";
import { ArrowLeft, Heart, Globe, Lock } from "lucide-react";
import { useNostr } from "@/context/NostrContext";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import btcBgImage from "@assets/image_1771226498805.png";
import { isAgeVerified, setAgeVerifiedStorage } from "@/lib/restricted-categories";

export default function AccountPage() {
  const { user, likesPublic, toggleLikesPublic, canUsePrivate, openLoginModal } = useNostr();
  const { toast } = useToast();
  const [toggling, setToggling] = useState(false);
  const [ageVerified, setAgeVerifiedState] = useState(() => isAgeVerified());

  const handleToggleAgeVerified = () => {
    const next = !ageVerified;
    setAgeVerifiedStorage(next);
    setAgeVerifiedState(next);
  };

  const handleToggleLikes = async () => {
    if (!user) { openLoginModal(); return; }
    // Only block the transition public → private. Switching back to public
    // just re-publishes unencrypted content and never needs NIP-44.
    if (likesPublic && !canUsePrivate) {
      toast({
        title: "Private likes not available",
        description: "Private likes require a Nostr extension with NIP-44 support (e.g. Alby).",
        variant: "destructive",
      });
      return;
    }
    setToggling(true);
    try {
      await toggleLikesPublic();
      toast({
        title: likesPublic ? "Likes set to private" : "Likes set to public",
        description: likesPublic
          ? "Your likes are now encrypted — only you can see them."
          : "Your likes are now public — others can see them and they count toward merchant totals.",
      });
    } catch (e: any) {
      toast({ title: "Failed to update setting", description: e.message, variant: "destructive" });
    } finally {
      setToggling(false);
    }
  };

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
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
          <div className="mb-6 flex items-center gap-3">
            <Link href="/">
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </Link>
            <h1 className="text-xl font-bold">Account Settings</h1>
          </div>

          {/* Content preferences — available to all visitors, no account needed */}
          <div className="bg-card border border-border rounded-lg p-5 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5 shrink-0">🔞</span>
                <div>
                  <p className="font-medium text-sm">18+ categories</p>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
                    Show merchants in Nicotine, Cannabis, Alcohol, and Adult categories in the directory. You must be 18 or older to enable this.
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleAgeVerified}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  ageVerified
                    ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                    : "border-border bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {ageVerified ? <><Globe className="h-3.5 w-3.5" /> Enabled</> : <><Lock className="h-3.5 w-3.5" /> Disabled</>}
              </button>
            </div>
          </div>

          {!user ? (
            <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/40">
              <p className="text-muted-foreground mb-4">Sign in to manage your account settings.</p>
              <Button onClick={openLoginModal}>Sign in with Nostr</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Likes visibility */}
              <div className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Likes visibility</p>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
                        {likesPublic
                          ? "Your likes are public — they contribute to like counts on merchant cards and can be seen by others."
                          : "Your likes are private — encrypted on the Nostr network so only you can see them."}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleLikes}
                    disabled={toggling}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      likesPublic
                        ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                        : "border-border bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {likesPublic ? (
                      <><Globe className="h-3.5 w-3.5" /> Public</>
                    ) : (
                      <><Lock className="h-3.5 w-3.5" /> Private</>
                    )}
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => likesPublic || handleToggleLikes()}
                    disabled={toggling || likesPublic}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                      likesPublic
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    <Globe className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-xs font-medium">Public</p>
                      <p className="text-[11px] text-muted-foreground">Visible to others, adds to counts</p>
                    </div>
                  </button>
                  <button
                    onClick={() => !likesPublic || handleToggleLikes()}
                    disabled={toggling || !likesPublic}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                      !likesPublic
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    <Lock className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-xs font-medium">Private</p>
                      <p className="text-[11px] text-muted-foreground">Encrypted, only you can see</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick links */}
              <div className="bg-card border border-border rounded-lg p-5 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your content</p>
                <div className="flex flex-col gap-1">
                  <Link href="/favourites" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors">
                    <Heart className="h-4 w-4 text-red-400" /> My Likes
                  </Link>
                  <Link href="/lists" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors">
                    📋 My Lists
                  </Link>
                  <Link href="/discover" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors">
                    🔍 Discover Lists
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
