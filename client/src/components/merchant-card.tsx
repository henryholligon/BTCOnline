import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Merchant } from "@shared/schema";
import { ExternalLink, Zap, Bitcoin, Clock } from "lucide-react";

interface MerchantCardProps {
  merchant: Merchant;
}

export default function MerchantCard({ merchant }: MerchantCardProps) {

  const getCategoryEmoji = (category: string) => {
    const categoryEmojis: Record<string, string> = {
      "Electronics": "💻",
      "Clothing": "👕",
      "Food & Drink": "🍴",
      "Travel": "✈️",
      "Gift Cards": "🎁",
      "VPN & Privacy": "🛡️",
      "Hosting": "🌐",
      "Books": "📚",
      "Art": "🎨",
      "Charity": "❤️",
      "Services": "🔧",
      "Health": "🏥",
      "Alcohol": "🍷",
      "Sweets": "🍬",
      "Health & Beauty": "💄",
      "Wellness": "🧘",
      "Auto": "🚗",
      "Lifestyle": "✨",
      "Entertainment": "🎭",
      "Tech": "⚙️",
      "Fashion": "👗",
      "Music": "🎵",
      "Sports": "⚽",
      "Sports & Outdoors": "🏕️",
    };
    const hasEmoji = /\p{Emoji}/u.test(category);
    if (hasEmoji) return category;
    const emoji = categoryEmojis[category] || "📦";
    return `${emoji} ${category}`;
  };

  const getCountryEmoji = (countryName: string) => {
    const pureName = countryName.replace(/[^\w\s]/gi, '').trim();
    const countries: Record<string, string> = {
      "USA": "🇺🇸", "Canada": "🇨🇦", "Sweden": "🇸🇪", "UK": "🇬🇧",
      "Germany": "🇩🇪", "Japan": "🇯🇵", "Portugal": "🇵🇹", "Netherlands": "🇳🇱",
      "Worldwide": "🌍", "Europe": "🇪🇺", "Australia": "🇦🇺", "El Salvador": "🇸🇻",
      "South Africa": "🇿🇦", "Italy": "🇮🇹"
    };
    return countries[pureName] || countries[countryName] || "📍";
  };

  return (
    <div
      className="group relative rounded-2xl bg-card border border-border/60 hover:border-border hover:shadow-lg hover:shadow-black/[0.03] dark:hover:shadow-black/20 transition-all duration-300 overflow-hidden"
      data-testid={`card-merchant-${merchant.id}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative flex flex-col md:flex-row p-5 gap-5">
        <div className="flex items-start gap-4 md:w-[260px] shrink-0">
          <div className="h-14 w-14 shrink-0 rounded-xl bg-white dark:bg-white/10 border border-border/40 flex items-center justify-center overflow-hidden shadow-sm">
            {merchant.logo.startsWith("/") || merchant.logo.startsWith("http") ? (
              <img 
                src={merchant.logo} 
                alt={merchant.name}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <span className="text-2xl">{merchant.logo}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold leading-tight truncate" title={merchant.name}>
              {merchant.name}
            </h3>
            <div className="flex items-center gap-3 mt-1.5">
              {merchant.lightningSupported && (
                <div className="flex items-center gap-1 text-amber-500">
                  <Zap className="h-3 w-3 fill-current animate-lightning-zap" />
                  <span className="text-[11px] font-medium">Lightning</span>
                </div>
              )}
              {merchant.onchainSupported && (
                <div className="flex items-center gap-1 text-orange-500/80">
                  <Bitcoin className="h-3 w-3" />
                  <span className="text-[11px] font-medium">On-chain</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
            {merchant.description}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {merchant.categories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary/80 text-[11px] text-secondary-foreground/80 font-medium"
              >
                {getCategoryEmoji(cat)}
              </span>
            ))}
            {merchant.categories.length > 3 && (
              <span className="text-[11px] text-muted-foreground self-center ml-1">
                +{merchant.categories.length - 3}
              </span>
            )}
          </div>
        </div>

        <div className="md:w-[160px] shrink-0 flex flex-col gap-1.5 text-[11px] text-muted-foreground md:border-l md:border-border/40 md:pl-5">
          {merchant.shippingCountries.length > 0 && (
            <div>
              <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground/60 block mb-0.5">Ships to</span>
              <span className="text-foreground/80 font-medium">
                {merchant.shippingCountries.some(c => c.toLowerCase().includes("worldwide"))
                  ? "🌍 Worldwide"
                  : merchant.shippingCountries.map(c => {
                      const pureCountry = c.replace(/[^\w\s]/gi, '').trim();
                      const hasEmoji = /\p{Emoji}/u.test(c);
                      return hasEmoji ? c : `${getCountryEmoji(pureCountry)} ${c}`;
                    }).slice(0, 2).join(", ") + (merchant.shippingCountries.length > 2 ? "..." : "")}
              </span>
            </div>
          )}
          {merchant.countryMadeIn && (
            <div>
              <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground/60 block mb-0.5">Made in</span>
              <span className="text-foreground/80 font-medium">
                {getCountryEmoji(merchant.countryMadeIn)} {merchant.countryMadeIn}
              </span>
            </div>
          )}
          {merchant.lastSurveyed && (
            <div>
              <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground/60 block mb-0.5">Surveyed</span>
              <span className="text-foreground/80 font-medium flex items-center gap-1" data-testid={`text-last-surveyed-${merchant.id}`}>
                <Clock className="h-2.5 w-2.5" />
                {new Date(merchant.lastSurveyed).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          )}
          {merchant.paymentProvider && (
            <div>
              <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground/60 block mb-0.5">Provider</span>
              <span className="text-foreground/80 font-medium">{merchant.paymentProvider}</span>
            </div>
          )}
        </div>

        <div className="flex md:flex-col items-center gap-2 shrink-0 md:w-[90px]">
          <Button
            asChild
            size="sm"
            className="w-full rounded-xl bg-foreground text-background hover:bg-foreground/90 dark:bg-white dark:text-black dark:hover:bg-white/90 font-medium text-[13px] h-9 shadow-sm"
          >
            <a href={merchant.website} target="_blank" rel="noopener noreferrer" data-testid={`link-visit-${merchant.id}`}>
              Visit
              <ExternalLink className="ml-1.5 h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
