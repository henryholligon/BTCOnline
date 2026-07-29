import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trophy } from "lucide-react";
import Navbar from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { useNostrProfiles } from "@/hooks/use-comments";
import { decode } from "nostr-tools/nip19";

type LeaderboardData = {
  period: string;
  contributors: {
    rank: number;
    npub: string;
    merchantCount: number;
  }[];
};

const periods = [
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "all", label: "ALL" },
] as const;

function npubToHex(npub: string): string | null {
  try {
    const decoded = decode(npub);
    if (decoded.type === "npub") return decoded.data as string;
    return null;
  } catch {
    return null;
  }
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl leading-none">🥇</span>;
  if (rank === 2) return <span className="text-xl leading-none">🥈</span>;
  if (rank === 3) return <span className="text-xl leading-none">🥉</span>;
  return <span className="text-sm font-semibold text-muted-foreground w-7 text-center tabular-nums">{rank}</span>;
}

export default function Leaderboard() {
  const [period, setPeriod] = useState<"30d" | "90d" | "all">("all");

  const { data, isLoading, isError } = useQuery<LeaderboardData>({
    queryKey: ["/api/leaderboard", period],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?period=${period}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load leaderboard");
      return res.json();
    },
  });

  // Collect hex pubkeys for profile lookup
  const hexPubkeys = (data?.contributors ?? [])
    .map(c => npubToHex(c.npub))
    .filter((h): h is string => !!h);

  const profiles = useNostrProfiles(hexPubkeys);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={() => {}} filtersSlot={null} onClearFilters={() => {}} />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-10 flex items-center gap-3">
          <Link href="/" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Back to directory">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">btc online / community</p>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Leaderboard</h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              The Nostr identities that have contributed the most merchant listings to the directory.
            </p>
          </div>
        </div>

        {/* Period selector */}
        <div className="mb-6 flex items-center gap-3">
          <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {periods.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {data && (
            <span className="text-xs text-muted-foreground">
              {data.contributors.length} contributor{data.contributors.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Leaderboard data is temporarily unavailable.
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && !isError && data?.contributors.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center space-y-3">
              <p className="text-4xl">🏆</p>
              <p className="font-semibold">No contributors yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {period !== "all"
                  ? "No merchants with dates were submitted in this period. Try All time."
                  : "Submit a merchant using the Add Merchant button — once it's approved and added to the sheet with your npub, you'll appear here."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard table */}
        {!isLoading && !isError && (data?.contributors.length ?? 0) > 0 && (
          <Card className="border-border/70 shadow-none overflow-hidden">
            <div className="divide-y divide-border/50">
              {data!.contributors.map(contributor => {
                const hex = npubToHex(contributor.npub);
                const profile = hex ? profiles.get(hex) : undefined;
                const displayName = profile?.displayName ?? `${contributor.npub.slice(0, 12)}…`;

                return (
                  <div key={contributor.npub} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                    {/* Rank */}
                    <div className="w-8 flex items-center justify-center shrink-0">
                      <RankBadge rank={contributor.rank} />
                    </div>

                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground uppercase overflow-hidden">
                      {profile?.picture ? (
                        <img
                          src={profile.picture}
                          alt={displayName}
                          className="h-full w-full object-cover"
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                            (e.currentTarget.parentElement as HTMLElement).textContent = displayName.slice(0, 1);
                          }}
                        />
                      ) : (
                        displayName.slice(0, 1)
                      )}
                    </div>

                    {/* Name + npub */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/profile/${contributor.npub}`}
                        className="text-sm font-semibold hover:text-primary transition-colors truncate block"
                      >
                        {displayName}
                      </Link>
                      <p className="text-[11px] text-muted-foreground truncate">{contributor.npub.slice(0, 24)}…</p>
                    </div>

                    {/* Count */}
                    <div className="text-right shrink-0">
                      <span className="text-lg font-semibold tabular-nums">{contributor.merchantCount}</span>
                      <p className="text-[10px] text-muted-foreground">merchant{contributor.merchantCount !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Rankings update after each Google Sheet sync. Submit a merchant to get your npub on the board.
        </p>
      </main>
    </div>
  );
}
