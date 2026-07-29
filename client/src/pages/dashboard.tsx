import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, BarChart3, Globe2, Layers3, Zap } from "lucide-react";
import Navbar from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";

type DashboardData = {
  totals: {
    total_merchants: number;
    recently_verified: number;
    lightning_merchants: number;
    onchain_merchants: number;
    cashu_merchants: number;
    liquid_merchants: number;
    categories: number;
  };
  shippingCountries: number;
  snapshots: { snapshot_date: string; merchant_count: number; verified_count: number }[];
};

const ranges = [
  { value: "7d", label: "7D", days: 7 },
  { value: "30d", label: "30D", days: 30 },
  { value: "90d", label: "90D", days: 90 },
  { value: "1y", label: "1Y", days: 365 },
  { value: "all", label: "ALL", days: Infinity },
] as const;

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function MetricCard({ label, value, detail, icon: Icon, accent = "text-primary" }: {
  label: string; value: string; detail: string; icon: typeof BarChart3; accent?: string;
}) {
  return (
    <Card className="border-border/70 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-3 font-display text-4xl font-semibold tracking-tight">{value}</p>
          </div>
          <Icon className={`h-5 w-5 ${accent}`} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [range, setRange] = useState<(typeof ranges)[number]["value"]>("30d");
  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load dashboard");
      return response.json();
    },
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    const selected = ranges.find(item => item.value === range)!;
    const snapshots = selected.days === Infinity
      ? data.snapshots
      : data.snapshots.slice(-Math.max(2, selected.days));
    return snapshots.map(point => ({
      date: formatDate(point.snapshot_date),
      merchants: point.merchant_count,
      verified: point.verified_count,
    }));
  }, [data, range]);

  const totals = data?.totals;
  const paymentMethods = totals ? [
    { label: "Lightning", value: totals.lightning_merchants, color: "bg-yellow-400", icon: "⚡" },
    { label: "On-chain", value: totals.onchain_merchants, color: "bg-orange-400", icon: "₿" },
    { label: "Cashu", value: totals.cashu_merchants, color: "bg-amber-600", icon: "🥜" },
    { label: "Liquid", value: totals.liquid_merchants, color: "bg-cyan-500", icon: "💧" },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={() => {}} filtersSlot={null} onClearFilters={() => {}} />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-10 flex items-center gap-3">
          <Link href="/" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Back to directory">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">btc online / data</p>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Acceptance growth</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              A live view of the merchants in the directory and how the acceptance network grows over time.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(item => <div key={item} className="h-40 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : isError || !data || !totals ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Dashboard data is temporarily unavailable.</CardContent></Card>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Total merchants" value={totals.total_merchants.toLocaleString()} detail="Currently listed in the directory" icon={BarChart3} />
              <MetricCard label="Recently verified" value={totals.recently_verified.toLocaleString()} detail="Surveyed within the last year" icon={Zap} accent="text-amber-500" />
              <MetricCard label="Categories" value={totals.categories.toLocaleString()} detail="Distinct merchant categories" icon={Layers3} accent="text-blue-500" />
              <MetricCard label="Shipping markets" value={data.shippingCountries.toLocaleString()} detail="Distinct listed destinations" icon={Globe2} accent="text-emerald-500" />
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.45fr]">
              <Card className="border-border/70 shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-lg font-semibold">Payment coverage</h2>
                      <p className="mt-1 text-xs text-muted-foreground">Merchants supporting each method</p>
                    </div>
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mt-6 space-y-5">
                    {paymentMethods.map(method => {
                      const percentage = totals.total_merchants ? Math.round((method.value / totals.total_merchants) * 100) : 0;
                      return (
                        <div key={method.label}>
                          <div className="mb-2 flex justify-between text-sm">
                            <span>{method.icon} {method.label}</span>
                            <span className="font-medium">{method.value.toLocaleString()} <span className="text-muted-foreground">({percentage}%)</span></span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div className={`h-full rounded-full ${method.color}`} style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-none">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-lg font-semibold">Merchant growth</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {data.snapshots.length < 2 ? "Snapshots start today — check back as the series builds." : "Daily directory total"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                      {ranges.map(item => (
                        <button key={item.value} onClick={() => setRange(item.value)} className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${range === item.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 h-64 w-full">
                    {chartData.length < 2 ? (
                      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
                        The first two points are needed to draw growth.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="merchantGrowth" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(45 100% 51%)" stopOpacity={0.45} />
                              <stop offset="95%" stopColor="hsl(45 100% 51%)" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
                          <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={28} className="text-[10px]" />
                          <YAxis tickLine={false} axisLine={false} className="text-[10px]" />
                          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                          <Area type="monotone" dataKey="merchants" name="Total merchants" stroke="hsl(45 100% 42%)" fill="url(#merchantGrowth)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Growth history is collected from today onward. Counts reflect the current directory and update with merchant syncs.
            </p>
          </>
        )}
      </main>
    </div>
  );
}