import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Merchant } from "@shared/schema";
import { ExternalLink, Zap, Bitcoin, Clock, ChevronDown } from "lucide-react";
import { useState } from "react";

interface MerchantCardProps {
  merchant: Merchant;
}

export default function MerchantCard({ merchant }: MerchantCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getCategoryEmoji = (category: string) => {
    const hasEmoji = /\p{Emoji}/u.test(category);
    if (hasEmoji) return category;
    const categoryEmojis: Record<string, string> = {
      "Electronics": "💻", "Clothing": "👕", "Food & Drink": "🍴", "Travel": "✈️",
      "Gift Cards": "🎁", "VPN & Privacy": "🛡️", "Hosting": "🌐", "Books": "📚",
      "Art": "🎨", "Charity": "❤️", "Services": "🔧", "Health": "🏥", "Alcohol": "🍷",
      "Sweets": "🍬", "Health & Beauty": "💄", "Wellness": "🧘", "Auto": "🚗",
      "Lifestyle": "✨", "Entertainment": "🎭", "Tech": "⚙️", "Fashion": "👗",
    };
    return `${categoryEmojis[category] || "📦"} ${category}`;
  };

  const getCountryEmoji = (countryName: string) => {
    const pureName = countryName.replace(/[^\w\s]/gi, '').trim();
    const countries: Record<string, string> = {
      "USA": "🇺🇸", "United States": "🇺🇸", "Canada": "🇨🇦", "Sweden": "🇸🇪",
      "UK": "🇬🇧", "United Kingdom": "🇬🇧", "Germany": "🇩🇪", "Japan": "🇯🇵",
      "Portugal": "🇵🇹", "Netherlands": "🇳🇱", "Worldwide": "🌍", "Europe": "🇪🇺",
      "Australia": "🇦🇺", "El Salvador": "🇸🇻", "South Africa": "🇿🇦", "Italy": "🇮🇹",
      "France": "🇫🇷", "Spain": "🇪🇸", "Brazil": "🇧🇷", "Mexico": "🇲🇽",
      "Colombia": "🇨🇴", "Columbia": "🇨🇴", "Argentina": "🇦🇷", "India": "🇮🇳",
      "China": "🇨🇳", "South Korea": "🇰🇷", "Singapore": "🇸🇬", "Thailand": "🇹🇭",
      "Vietnam": "🇻🇳", "Indonesia": "🇮🇩", "Philippines": "🇵🇭", "Malaysia": "🇲🇾",
      "New Zealand": "🇳🇿", "Ireland": "🇮🇪", "Switzerland": "🇨🇭", "Austria": "🇦🇹",
      "Belgium": "🇧🇪", "Denmark": "🇩🇰", "Finland": "🇫🇮", "Norway": "🇳🇴",
      "Poland": "🇵🇱", "Czech Republic": "🇨🇿", "Romania": "🇷🇴", "Greece": "🇬🇷",
      "Turkey": "🇹🇷", "Israel": "🇮🇱", "United Arab Emirates": "🇦🇪", "UAE": "🇦🇪",
      "Saudi Arabia": "🇸🇦", "Nigeria": "🇳🇬", "Kenya": "🇰🇪", "Egypt": "🇪🇬",
      "Morocco": "🇲🇦", "Chile": "🇨🇱", "Peru": "🇵🇪", "Costa Rica": "🇨🇷",
      "Panama": "🇵🇦", "Lithuania": "🇱🇹", "Latvia": "🇱🇻", "Estonia": "🇪🇪",
      "Monaco": "🇲🇨", "Curacao": "🇨🇼", "Curacoa": "🇨🇼", "Iceland": "🇮🇸",
      "Luxembourg": "🇱🇺", "Malta": "🇲🇹", "Croatia": "🇭🇷", "Hungary": "🇭🇺",
      "Slovakia": "🇸🇰", "Slovenia": "🇸🇮", "Bulgaria": "🇧🇬", "Serbia": "🇷🇸",
      "Ukraine": "🇺🇦", "Taiwan": "🇹🇼", "Hong Kong": "🇭🇰", "Pakistan": "🇵🇰",
      "Bangladesh": "🇧🇩", "Sri Lanka": "🇱🇰", "Uruguay": "🇺🇾", "Paraguay": "🇵🇾",
      "Ecuador": "🇪🇨", "Bolivia": "🇧🇴", "Venezuela": "🇻🇪", "Dominican Republic": "🇩🇴",
      "Jamaica": "🇯🇲", "Trinidad and Tobago": "🇹🇹", "Guatemala": "🇬🇹", "Honduras": "🇭🇳",
      "Nicaragua": "🇳🇮", "Cuba": "🇨🇺", "Puerto Rico": "🇵🇷", "Ghana": "🇬🇭",
      "Ethiopia": "🇪🇹", "Tanzania": "🇹🇿", "Uganda": "🇺🇬", "Mozambique": "🇲🇿",
      "Zambia": "🇿🇲", "Zimbabwe": "🇿🇼", "Botswana": "🇧🇼", "Namibia": "🇳🇦",
      "Rwanda": "🇷🇼", "Senegal": "🇸🇳", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    };
    return countries[pureName] || countries[countryName] || "🏳️";
  };

  const shippingText = merchant.shippingCountries.length > 0
    ? merchant.shippingCountries.some(c => c.toLowerCase().includes("worldwide"))
      ? "🌍 Worldwide"
      : merchant.shippingCountries.map(c => {
          const pureCountry = c.replace(/[^\w\s]/gi, '').trim();
          const hasEmoji = /\p{Emoji}/u.test(c);
          return hasEmoji ? c : `${getCountryEmoji(pureCountry)} ${c}`;
        }).slice(0, 2).join(", ") + (merchant.shippingCountries.length > 2 ? "..." : "")
    : null;

  return (
    <div
      className="w-full bg-card/50 border border-border/50 hover:border-primary/30 rounded-lg transition-all duration-200 cursor-pointer group"
      onClick={() => setExpanded(!expanded)}
      data-testid={`card-merchant-${merchant.id}`}
    >
      <div className="flex items-center gap-4 p-3 md:p-4">
        <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-lg flex items-center justify-center overflow-hidden border border-border/50 bg-white">
          {(merchant.logo.startsWith("/") || merchant.logo.startsWith("http")) ? (
            <img
              src={merchant.logo}
              alt={merchant.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-xl">{merchant.logo}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm md:text-base truncate">{merchant.name}</h3>
            {merchant.lightningSupported && (
              <Zap className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400 animate-lightning-zap drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
            )}
            {merchant.onchainSupported && (
              <Bitcoin className="h-3.5 w-3.5 shrink-0 fill-orange-500 text-orange-500" />
            )}
            {merchant.name === "Maple AI" && (
              <span className="shrink-0 text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wide">10% off with BTC</span>
            )}
            {merchant.name === "SLNT" && (
              <span className="shrink-0 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wide animate-rainbow" style={{ background: "linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff, #ff0088, #ff0000)", backgroundSize: "200% 100%" }}>NEW</span>
            )}
          </div>
          <p className="text-xs md:text-sm text-muted-foreground truncate">{merchant.description}</p>
        </div>

        {shippingText && (
          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <span>{shippingText}</span>
          </div>
        )}

        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
      </div>

      {expanded && (
        <div className="border-t border-border/30 px-3 md:px-4 py-4 space-y-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-muted-foreground">{merchant.description}</p>

          <div className="flex flex-wrap gap-2">
            {merchant.categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs py-0.5 px-2">
                {getCategoryEmoji(cat)}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground/70 uppercase tracking-wider text-[10px] font-semibold">Payment</span>
              <div className="flex items-center gap-2 text-foreground">
                {merchant.lightningSupported && (
                  <span className="flex items-center gap-1 text-yellow-500">
                    <Zap className="h-3 w-3 fill-current animate-lightning-zap" /> Lightning
                  </span>
                )}
                {merchant.onchainSupported && (
                  <span className="flex items-center gap-1 text-orange-500">
                    <Bitcoin className="h-3 w-3 fill-current" /> On-Chain
                  </span>
                )}
              </div>
            </div>

            {merchant.paymentProvider && (
              <div className="space-y-1">
                <span className="text-muted-foreground/70 uppercase tracking-wider text-[10px] font-semibold">Provider</span>
                <p className="text-foreground">{merchant.paymentProvider}</p>
              </div>
            )}

            {merchant.shippingCountries.length > 0 && (
              <div className="space-y-1">
                <span className="text-muted-foreground/70 uppercase tracking-wider text-[10px] font-semibold">Ships to</span>
                <p className="text-foreground">
                  {merchant.shippingCountries.some(c => c.toLowerCase().includes("worldwide"))
                    ? "🌍 Worldwide"
                    : merchant.shippingCountries.map(c => {
                        const pureCountry = c.replace(/[^\w\s]/gi, '').trim();
                        const hasEmoji = /\p{Emoji}/u.test(c);
                        return hasEmoji ? c : `${getCountryEmoji(pureCountry)} ${c}`;
                      }).join(", ")}
                </p>
              </div>
            )}

            {merchant.countryMadeIn && (
              <div className="space-y-1">
                <span className="text-muted-foreground/70 uppercase tracking-wider text-[10px] font-semibold">Made in</span>
                <p className="text-foreground">{getCountryEmoji(merchant.countryMadeIn)} {merchant.countryMadeIn}</p>
              </div>
            )}

            {merchant.lastSurveyed && (
              <div className="space-y-1">
                <span className="text-muted-foreground/70 uppercase tracking-wider text-[10px] font-semibold">Last Surveyed</span>
                <p className="text-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(merchant.lastSurveyed).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            )}
          </div>

          <div className="pt-1">
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <a href={merchant.website} target="_blank" rel="noopener noreferrer" data-testid={`link-visit-${merchant.id}`}>
                Visit Website <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
