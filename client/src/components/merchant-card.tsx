import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
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
    };
    const hasEmoji = /\p{Emoji}/u.test(category);
    if (hasEmoji) return category;
    const emoji = categoryEmojis[category] || "📦";
    return `${emoji} ${category}`;
  };

  const getCountryEmoji = (countryName: string) => {
    const pureName = countryName.replace(/[^\w\s]/gi, '').trim();
    const countries: Record<string, string> = {
      "USA": "🇺🇸",
      "Canada": "🇨🇦",
      "Sweden": "🇸🇪",
      "UK": "🇬🇧",
      "Germany": "🇩🇪",
      "Japan": "🇯🇵",
      "Portugal": "🇵🇹",
      "Netherlands": "🇳🇱",
      "Worldwide": "🌍",
      "Europe": "🇪🇺",
      "Australia": "🇦🇺",
      "El Salvador": "🇸🇻",
      "South Africa": "🇿🇦",
      "Italy": "🇮🇹"
    };
    return countries[pureName] || countries[countryName] || "📍";
  };

  const getIconBgColor = () => {
    return 'bg-white shadow-none';
  };

  return (
    <Card className="flex flex-col md:flex-row w-full bg-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 group overflow-hidden relative mb-4">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="flex flex-col md:flex-row flex-1 p-4 gap-6 items-start md:items-center">
        {/* Merchant Identity Section - Fixed width for alignment */}
        <div className="flex items-center gap-4 w-full md:w-[280px] shrink-0">
          <div className={`h-16 w-16 shrink-0 rounded-xl flex items-center justify-center text-3xl border border-border/50 overflow-hidden z-10 ${getIconBgColor()}`}>
            {merchant.logo && (merchant.logo.startsWith("/") || merchant.logo.startsWith("http")) ? (
              <img 
                src={merchant.logo} 
                alt={merchant.name}
                className="w-full h-full object-contain"
              />
            ) : (
              merchant.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="space-y-1 overflow-hidden">
            <CardTitle className="text-xl leading-tight truncate" title={merchant.name}>{merchant.name}</CardTitle>
            {merchant.featured && (
              <Badge variant="outline" className="mt-1 border-primary/30 text-primary bg-primary/10 animate-pulse-slow">
                Featured
              </Badge>
            )}
          </div>
        </div>

        {/* Description & Categories Section - flex-1 for remaining space */}
        <div className="flex-1 space-y-3 z-10 min-w-0">
          <CardDescription className="line-clamp-2 text-base">
            {merchant.description}
          </CardDescription>

          <div className="flex flex-wrap gap-2">
            {merchant.categories.slice(0, 3).map((cat) => (
              <Badge key={cat} variant="secondary" className="hover:bg-secondary/80 whitespace-nowrap text-[10px] py-0 px-2 h-5">
                {getCategoryEmoji(cat)}
              </Badge>
            ))}
            {merchant.categories.length > 3 && (
              <span className="text-[10px] text-muted-foreground self-center">+{merchant.categories.length - 3} more</span>
            )}
          </div>

          <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
            {merchant.lightningSupported && (
              <div className="flex items-center gap-1 text-yellow-400 relative group/lightning">
                <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full scale-0 group-hover/lightning:scale-150 transition-transform duration-500 pointer-events-none" />
                <Zap className="h-3 w-3 fill-current animate-lightning-zap drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] relative z-10" />
                <span className="relative z-10 font-bold tracking-wider">Lightning</span>
              </div>
            )}
            {merchant.onchainSupported && (
              <div className="flex items-center gap-1 text-orange-500">
                <Bitcoin className="h-3 w-3 fill-current" />
                <span>On-Chain</span>
              </div>
            )}
          </div>
        </div>

        {/* Shipping & Meta Section - Fixed width for alignment */}
        <div className="w-full md:w-[200px] shrink-0 flex flex-col gap-2 z-10 border-t md:border-t-0 md:border-l border-border/20 pt-3 md:pt-0 md:pl-4">
          {(merchant.countryMadeIn || merchant.shippingCountries.length > 0) && (
            <div className="flex flex-col gap-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
              {merchant.shippingCountries.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] opacity-70">Shipping to</span>
                  <span className="text-foreground/90 truncate flex items-center gap-1">
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
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] opacity-70">Made In</span>
                  <span className="text-foreground/90 truncate flex items-center gap-1">
                    {getCountryEmoji(merchant.countryMadeIn)} {merchant.countryMadeIn}
                  </span>
                </div>
              )}
            </div>
          )}
          {merchant.lastSurveyed && (
            <div className="flex flex-col gap-0.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
              <span className="text-[9px] opacity-70">Last Surveyed</span>
              <span className="text-foreground/90 flex items-center gap-1" data-testid={`text-last-surveyed-${merchant.id}`}>
                <Clock className="h-3 w-3" />
                {new Date(merchant.lastSurveyed).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons Section - Fixed width for alignment */}
        <div className="flex md:flex-col gap-2 w-full md:w-[100px] shrink-0 z-10 pt-2 md:pt-0">
          <Button asChild variant="default" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
            <a href={merchant.website} target="_blank" rel="noopener noreferrer">
              Visit <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}
