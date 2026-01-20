import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Merchant } from "@/lib/mock-data";
import { ExternalLink, Star, Zap, Bitcoin, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface MerchantCardProps {
  merchant: Merchant;
}

export default function MerchantCard({ merchant }: MerchantCardProps) {
  const { toast } = useToast();
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const averageRating = merchant.reviews.length > 0 
    ? merchant.reviews.reduce((acc, curr) => acc + curr.rating, 0) / merchant.reviews.length 
    : 0;

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

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setIsReviewOpen(false);
    toast({
      title: "Review Submitted",
      description: "Your review has been signed and published to the relay.",
    });
  };

  const getIconBgColor = () => {
    const name = merchant.name.toLowerCase();
    
    // Black backgrounds
    if (['start9', 'beef initiative', 'oshi good', 'hyke & byke', 'kerwell', 'root & branch', 'atoms', 'heatbit', 'hill helicopters', 'gameroom', 'internet archive', 'sole', 'mad gringo hot sauce', 'la industria handmade', 'ivpn', 'spy equipment uk'].includes(name)) {
      return 'bg-black border-black';
    }
    
    // Brand Specific
    if (name === 'kawa') return 'bg-[#c9121f] border-[#c9121f]';
    if (name === 'the suffolk tutor') return 'bg-[#ff9e16] border-[#ff9e16]';
    if (name === 'consumer choice center') return 'bg-[#1e3a8a] border-[#1e3a8a]';
    if (name === 'torguard') return 'bg-[#0a1128] border-[#0a1128]';
    if (name === 'sticky') return 'bg-[#f0c3d9] border-[#f0c3d9]';
    if (name === 'mei leaf') return 'bg-[#9e0b31] border-[#9e0b31]';
    if (name === 'nogood studio') return 'bg-[#ff3b00] border-[#ff3b00]';
    if (name === 'human trafficking institute') return 'bg-[#002d72] border-[#002d72]';
    if (name === 'uzi shop') return 'bg-[#5b84ba] border-[#5b84ba]';
    if (name === 'alternative airlines') return 'bg-[#5c4fff] border-[#5c4fff]';
    if (name === 'brazilian botanicals') return 'bg-[#831843] border-[#831843]';
    if (name === 'cyberpiggy') return 'bg-[#d12a5e] border-[#d12a5e]';
    if (name === 'nordvpn') return 'bg-[#3b60ff] border-[#3b60ff]';
    if (name === 'gift off') return 'bg-[#f4a124] border-[#f4a124]';
    if (name === 'waking herbs') return 'bg-[#5c1334] border-[#5c1334]';
    
    return 'bg-white border-[#e5e7eb]';
  };

  return (
    <Card className="flex flex-col md:flex-row w-full bg-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 group overflow-hidden relative mb-4">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="flex flex-col md:flex-row flex-1 p-4 gap-6 items-start md:items-center">
        {/* Merchant Identity Section - Fixed width for alignment */}
        <div className="flex items-center gap-4 w-full md:w-[280px] shrink-0">
          <div className={`h-16 w-16 shrink-0 rounded-xl flex items-center justify-center text-3xl border overflow-hidden z-10 ${getIconBgColor()}`}>
            {merchant.logo.startsWith("/") || merchant.logo.startsWith("http") ? (
              <img 
                src={merchant.logo} 
                alt={merchant.name} 
                className={`w-full h-full object-contain ${
                  merchant.name.toLowerCase() === 'start9' ? 'p-1' : 
                  merchant.name.toLowerCase() === 'bitrefill' ? 'scale-110' : 
                  merchant.name.toLowerCase() === 'human rights foundation' ? 'scale-110' : 
                  merchant.name.toLowerCase() === 'cheapair' ? 'scale-[2.8]' : 
                  merchant.name.toLowerCase() === 'travala' ? 'scale-110' : 
                  merchant.name.toLowerCase() === 'silent.link' ? 'scale-125' : 
                  merchant.name.toLowerCase() === 'great ghee' ? 'scale-[1.4]' : 
                  merchant.name.toLowerCase() === 'castle hill gin' ? 'scale-110' : 
                  merchant.name.toLowerCase() === 'bonjour wines' ? 'scale-110' : 
                  merchant.name.toLowerCase() === 'yum yum tree fudge' ? 'scale-110' : 
                  merchant.name.toLowerCase() === 'hummingbird amsterdam' ? 'scale-125' : 
                  merchant.name.toLowerCase() === 'oshi good' ? 'scale-110 p-1' : 
                  merchant.name.toLowerCase() === 'pumphreys coffee' ? 'scale-100 p-1' : 
                  merchant.name.toLowerCase() === "farmer bill's provisions" ? 'scale-75' : 
                  merchant.name.toLowerCase() === 'hempful' ? 'scale-100 p-1' : 
                  merchant.name.toLowerCase() === 'mister padel' ? 'scale-100 p-1' : 
                  merchant.name.toLowerCase() === 'lincoln kiln dried logs' ? 'scale-[1.6] p-0' : 
                  merchant.name.toLowerCase() === 'candyjets' ? 'scale-[1.8] p-0' : 
                  merchant.name.toLowerCase() === 'payperq' ? 'scale-[1.5] p-0' : 
                  merchant.name.toLowerCase() === 'crypto tax help' ? 'scale-100 p-1' : 
                  merchant.name.toLowerCase() === 'mtsocks' ? 'scale-110 p-1' : 
                  merchant.name.toLowerCase() === 'torguard' ? 'scale-125 p-1' : 
                  merchant.name.toLowerCase() === 'beef initiative' ? 'scale-100 p-1' : 
                  merchant.name.toLowerCase() === 'bees & trees' ? 'scale-[1.15] p-1' : 
                  merchant.name.toLowerCase() === 'bloom audio' ? 'scale-100 p-1' : 
                  merchant.name.toLowerCase() === 'la industria handmade' ? 'scale-110 p-1' : 
                  merchant.name.toLowerCase() === 'campo apícola' ? 'scale-[1.7] p-0' : 
                  merchant.name.toLowerCase() === 'elephant chateau' ? 'scale-[1.6] p-0' : 
                  merchant.name.toLowerCase() === 'árbol de maple' ? 'scale-110 p-1' : 
                  merchant.name.toLowerCase() === 'consumer choice center' ? 'scale-[1.25] p-1' : 
                  merchant.name.toLowerCase() === 'pikasim' ? 'scale-100 p-1' : 
                  merchant.name.toLowerCase() === 'mad gringo hot sauce' ? 'scale-110 p-1' : 
                  merchant.name.toLowerCase() === 'privaterouter' ? 'scale-110 p-1' : 
                  merchant.name.toLowerCase() === 'ivpn' ? 'scale-[1.4] p-1' : 
                  merchant.name.toLowerCase() === 'hyke & byke' ? 'scale-110 p-1' : 
                  merchant.name.toLowerCase() === 'kerwell' ? 'scale-110 p-1' : 
                  merchant.name.toLowerCase() === 'smith pastures' ? 'scale-[1.8] p-0' : 
                  merchant.name.toLowerCase() === 'skoon.' ? 'scale-100' : 
                  merchant.name.toLowerCase() === 'mei leaf' ? 'scale-[1.15]' : 
                  merchant.name.toLowerCase() === 'missprint' ? 'scale-[1.8] p-0' : 
                  merchant.name.toLowerCase() === 'izindlovu' ? 'scale-125 p-1' : 
                  merchant.name.toLowerCase() === 'sole' ? 'scale-125 p-2' : 
                  merchant.name.toLowerCase() === 'fuelingyou' ? 'scale-110 p-1' : 
                  merchant.name.toLowerCase() === 'heatbit' ? 'scale-[1.15]' : 
                  merchant.name.toLowerCase() === 'degoogled' ? 'scale-110 p-1' : 
                  merchant.name.toLowerCase() === 'human trafficking institute' ? 'scale-[1.6] p-0' : 
                  merchant.name.toLowerCase() === 'le cyclo sportif' ? 'scale-[1.3] px-1' : 
                  merchant.name.toLowerCase() === 'hill helicopters' ? 'scale-[1.9] p-0' : 
                  merchant.name.toLowerCase() === 'gameroom' ? 'scale-[1.4] p-2' : 
                  merchant.name.toLowerCase() === 'hotelgift' ? 'scale-[1.1] p-1' : 
                  merchant.name.toLowerCase() === 'surfshark' ? 'scale-[1.3] p-1' : 
                  merchant.name.toLowerCase() === 'vintage guitar world' ? 'scale-[1.3] p-2' : 
                  merchant.name.toLowerCase() === 'wayland games' ? 'scale-[1.15] p-1' : 
                  merchant.name.toLowerCase() === 'zenmarket' ? 'scale-[1.5] p-1' : 
                  merchant.name.toLowerCase() === 'waking herbs' ? 'scale-[1.3]' : 
                  merchant.name.toLowerCase() === 'freedom of the press' ? 'scale-[1.1] p-2' : ''
                }`} 
              />
            ) : (
              merchant.logo
            )}
          </div>
          <div className="space-y-1 overflow-hidden">
            <CardTitle className="text-xl leading-tight truncate" title={merchant.name}>{merchant.name}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="font-mono">{averageRating > 0 ? averageRating.toFixed(1) : "New"}</span>
              <span className="text-muted-foreground/50">•</span>
              <span>{merchant.reviews.length} reviews</span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3 z-10 min-w-0">
          <CardDescription className="line-clamp-2 text-base">
            {merchant.description}
          </CardDescription>

          <div className="flex flex-wrap gap-2">
            {merchant.categories.slice(0, 3).map((cat) => {
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
                "Fashion": "👗",
                "Lifestyle": "✨",
                "Health & Beauty": "💄",
                "Wellness": "🧘",
                "Auto": "🚗",
                "Sports": "⚽",
                "Music": "🎵",
                "Tech": "⚙️",
                "Entertainment": "🎬",
                "Alcohol": "🍷",
                "Sweets": "🍬",
                "Health": "🏥"
              };
              
              const pureCat = cat.replace(/\p{Emoji}/gu, '').trim();
              const emoji = categoryEmojis[pureCat] || categoryEmojis[cat];
              const categoryWithEmoji = emoji ? `${emoji} ${pureCat}` : cat;
              
              return (
                <Badge key={cat} variant="secondary" className="hover:bg-secondary/80 whitespace-nowrap text-[10px] py-0 px-2 h-5">
                  {categoryWithEmoji}
                </Badge>
              );
            })}
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

        <div className="w-full md:w-[200px] shrink-0 flex flex-col gap-2 z-10 border-t md:border-t-0 md:border-l border-border/20 pt-3 md:pt-0 md:pl-4">
          {(merchant.countryMadeIn || merchant.shippingCountries.length > 0) && (
            <div className="flex flex-col gap-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
              {merchant.countryMadeIn && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] opacity-70">Made In</span>
                  <span className="text-foreground/90 truncate flex items-center gap-1">
                    {getCountryEmoji(merchant.countryMadeIn)} {merchant.countryMadeIn}
                  </span>
                </div>
              )}
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
            </div>
          )}
        </div>

        <div className="flex md:flex-col gap-2 w-full md:w-[100px] shrink-0 z-10 pt-2 md:pt-0">
          <Button asChild variant="default" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
            <a href={merchant.website} target="_blank" rel="noopener noreferrer">
              Visit <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
          
          <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="px-2" title="Write a review">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Write a review for {merchant.name}</DialogTitle>
                <DialogDescription>
                  Share your experience. Your review will be cryptographically signed.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitReview} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button 
                        key={star} 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        className="p-0 h-8 w-8 hover:bg-transparent"
                      >
                        <Star className="h-6 w-6 text-muted hover:text-primary fill-muted hover:fill-primary transition-colors" />
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea placeholder="Share your experience..." id="comment" />
                </div>
                <DialogFooter>
                  <Button type="submit">Publish Review</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
}
