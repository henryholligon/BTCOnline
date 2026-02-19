import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Merchant, getCategoryWithEmoji } from "@shared/schema";
import { ExternalLink, Zap, Bitcoin, Clock } from "lucide-react";
import { useState } from "react";

interface MerchantCardProps {
  merchant: Merchant;
}

export default function MerchantCard({ merchant }: MerchantCardProps) {
  const [expanded, setExpanded] = useState(false);

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
      ? "🌍 Worldwide shipping"
      : merchant.shippingCountries.map(c => {
          const pureCountry = c.replace(/[^\w\s]/gi, '').trim();
          const hasEmoji = /\p{Emoji}/u.test(c);
          return hasEmoji ? c : `${getCountryEmoji(pureCountry)} ${c}`;
        }).slice(0, 2).join(", ") + (merchant.shippingCountries.length > 2 ? "..." : "") + " shipping"
    : null;

  return (
    <div
      className="w-full bg-white dark:bg-card border border-border dark:border-border/80 hover:border-primary/30 rounded-lg transition-all duration-200 cursor-pointer group"
      onClick={() => setExpanded(!expanded)}
      data-testid={`card-merchant-${merchant.id}`}
    >
      <div className="flex items-center gap-3 md:gap-4 p-4 md:p-4">
        <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-lg flex items-center justify-center overflow-hidden border-2 border-border bg-white dark:bg-muted">
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

        <div className="flex-1 min-w-0 space-y-1">
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
            {merchant.name === "PayPerQ" && (
              <span className="shrink-0 text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wide">5% off with BTC</span>
            )}
            {merchant.name === "SLNT" && (
              <span className="shrink-0 text-[11px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide animate-rainbow" style={{ background: "linear-gradient(90deg, #ff0000, #ff8800, #00ff00, #0088ff, #8800ff, #ff0088, #ff0000)", backgroundSize: "200% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>NEW</span>
            )}
            {merchant.name === "Obscura VPN" && (
              <video autoPlay loop muted playsInline className="shrink-0 h-4 w-4 object-cover rounded-sm" style={{ marginTop: "-2px" }} src="/assets/firedone.mp4" />
            )}
          </div>
          <p className="text-xs md:text-sm text-muted-foreground truncate">{merchant.description}</p>
          <div className="flex items-center gap-2">
            {shippingText && (
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                {shippingText}
              </Badge>
            )}
            <div className="flex md:hidden items-center gap-1.5">
              {merchant.categories.slice(0, 1).map((cat) => (
                <Badge key={cat} variant="secondary" className="text-[10px] py-0 px-1.5">
                  {getCategoryWithEmoji(cat)}
                </Badge>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-1.5">
              {merchant.categories.slice(0, 2).map((cat) => (
                <Badge key={cat} variant="secondary" className="text-[10px] py-0 px-1.5">
                  {getCategoryWithEmoji(cat)}
                </Badge>
              ))}
            </div>
          </div>
        </div>

      </div>

      {expanded && (
        <div className="border-t border-border/30 px-3 md:px-4 py-4 space-y-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-muted-foreground">{merchant.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {merchant.categories.length > 0 && (
              <div className="space-y-1">
                <span className="text-muted-foreground/70 uppercase tracking-wider text-[10px] font-semibold">Category</span>
                <div className="flex flex-col gap-1 text-foreground">
                  {merchant.categories.map(cat => (
                    <span key={cat}>{getCategoryWithEmoji(cat)}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-muted-foreground/70 uppercase tracking-wider text-[10px] font-semibold">Payment</span>
              <div className="flex flex-col gap-1 text-foreground">
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

            {merchant.shippingCountries.length > 0 && (
              <div className="space-y-1">
                <span className="text-muted-foreground/70 uppercase tracking-wider text-[10px] font-semibold">Ships to</span>
                <div className="flex flex-col gap-1 text-foreground">
                  {merchant.shippingCountries.some(c => c.toLowerCase().includes("worldwide"))
                    ? <span>🌍 Worldwide</span>
                    : merchant.shippingCountries.map(c => {
                        const pureCountry = c.replace(/[^\w\s]/gi, '').trim();
                        const hasEmoji = /\p{Emoji}/u.test(c);
                        return <span key={c}>{hasEmoji ? c : `${getCountryEmoji(pureCountry)} ${c}`}</span>;
                      })}
                </div>
              </div>
            )}

            {merchant.countryMadeIn && (
              <div className="space-y-1">
                <span className="text-muted-foreground/70 uppercase tracking-wider text-[10px] font-semibold">Made in</span>
                <p className="text-foreground">{getCountryEmoji(merchant.countryMadeIn)} {merchant.countryMadeIn}</p>
              </div>
            )}

            {merchant.paymentProvider && (
              <div className="space-y-1">
                <span className="text-muted-foreground/70 uppercase tracking-wider text-[10px] font-semibold">Provider</span>
                <p className="text-foreground">{merchant.paymentProvider}</p>
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
