import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink, Star, Zap, Bitcoin, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Merchant, Review } from "@shared/schema";

type MerchantWithReviews = Merchant & { reviews: Review[] };

interface MerchantCardProps {
  merchant: MerchantWithReviews;
}

export default function MerchantCard({ merchant }: MerchantCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

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

  const reviewMutation = useMutation({
    mutationFn: async (newReview: { rating: number, comment: string, authorNpub: string, date: string }) => {
      await apiRequest("POST", `/api/merchants/${merchant.id}/reviews`, newReview);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchants"] });
      toast({
        title: "Review Submitted",
        description: "Your review has been signed and published to the relay.",
      });
      setIsReviewOpen(false);
      setRating(0);
      setComment("");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit review. Please try again.",
      });
    },
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a rating.",
      });
      return;
    }
    reviewMutation.mutate({
      rating,
      comment,
      authorNpub: "npub1...user", // Mock npub for now
      date: new Date().toISOString().split('T')[0],
    });
  };

  const getIconBgColor = () => {
    return 'bg-white shadow-none';
  };

  const getLogoScaling = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName === 'start9') return 'bg-black p-1';
    if (lowerName === 'bitrefill') return 'scale-110';
    if (lowerName === 'human rights foundation') return 'scale-110';
    if (lowerName === 'cheapair') return 'scale-[2.8]';
    if (lowerName === 'travala') return 'scale-110';
    if (lowerName === 'g2a') return 'scale-100';
    if (lowerName === 'obscura') return 'scale-100';
    if (lowerName === 'silent.link') return 'scale-125';
    if (lowerName === 'great ghee') return 'scale-[1.4]';
    if (lowerName === 'great north air ambulance') return 'scale-90';
    if (lowerName === 'castle hill gin') return 'scale-110';
    if (lowerName === 'bonjour wines') return 'scale-110';
    if (lowerName === 'peony lane wine') return 'scale-90';
    if (lowerName === 'yum yum tree fudge') return 'scale-110';
    if (lowerName === 'tea and tonic') return 'scale-90';
    if (lowerName === 'arotags') return 'scale-90';
    if (lowerName === 'spitting feathers') return 'scale-[0.85]';
    if (lowerName === 'mushmore supplements') return 'scale-90 object-contain';
    if (lowerName === 'hummingbird amsterdam') return 'scale-125 object-contain';
    if (lowerName === 'planet express') return 'scale-90 object-contain';
    if (lowerName === 'farfetch') return 'scale-90 object-contain';
    if (lowerName === 'bramleigh farm') return 'scale-90 object-contain';
    if (lowerName === 'oshi good') return 'scale-110 object-contain p-1';
    if (lowerName === 'palingshop') return 'scale-100 object-contain';
    if (lowerName === 'ticketpro') return 'scale-100 object-cover';
    if (lowerName === 'dynadot') return 'scale-100 object-cover';
    if (lowerName === 'soapminer') return 'scale-100 object-cover';
    if (lowerName === 'mobimatter') return 'scale-100 object-cover';
    if (lowerName === 'the good beans') return 'scale-100 object-cover';
    if (lowerName === 'pumphreys coffee') return 'scale-100 object-contain p-1';
    if (lowerName === 'mynymbox') return 'scale-90';
    if (lowerName === 'epic deals') return 'scale-100 object-cover';
    if (lowerName === "farmer bill's provisions") return 'scale-75 object-contain';
    if (lowerName === 'acme acres') return 'scale-95';
    if (lowerName === 'chroma') return 'scale-100 object-contain p-0';
    if (lowerName === 'kawa') return 'scale-100 object-cover';
    if (lowerName === 'kijicha') return 'scale-90 object-contain';
    if (lowerName === 'asf tutoring') return 'scale-100 object-cover';
    if (lowerName === 'the suffolk tutor') return 'scale-90 object-contain';
    if (lowerName === "jimble's jumble") return 'scale-100 object-cover';
    if (lowerName === 'hempful') return 'scale-100 object-contain p-1';
    if (lowerName === 'highland fayre') return 'scale-100 object-contain';
    if (lowerName === 'golden tallow') return 'scale-100 object-contain';
    if (lowerName === 'mister padel') return 'scale-100 object-contain p-1';
    if (lowerName === 'lincoln kiln dried logs') return 'scale-100 object-cover';
    if (lowerName === 'essatoshi') return 'scale-100 object-cover';
    if (lowerName === 'cheerings') return 'scale-100 object-contain';
    if (lowerName === 'jonathan hill luthier') return 'scale-100 object-contain p-1';
    if (lowerName === 'select automotive') return 'scale-100 object-contain p-1';
    if (lowerName === 'candyjets') return 'scale-100 object-cover';
    if (lowerName === 'maple ai') return 'scale-100 object-cover';
    if (lowerName === 'payperq') return 'scale-110 object-contain p-1';
    if (lowerName === 'crypto tax help') return 'scale-100 object-contain p-1';
    if (lowerName === 'mtsocks') return 'scale-110 object-contain p-1';
    if (lowerName === 'torguard') return 'scale-125 object-contain p-1';
    if (lowerName === 'beef initiative') return 'scale-100 object-contain p-1';
    if (lowerName === 'spy equipment uk') return 'scale-100 object-contain p-0';
    if (lowerName === 'bees & trees') return 'scale-[1.15] object-contain p-1';
    if (lowerName === 'kaffebox') return 'scale-100 object-cover';
    if (lowerName === 'bloom audio') return 'scale-100 object-contain p-1';
    if (lowerName === 'la industria handmade') return 'scale-110 object-contain p-1';
    if (lowerName === 'campo apícola') return 'scale-110 object-contain p-1';
    if (lowerName === 'elephant chateau') return 'scale-110 object-contain p-1';
    if (lowerName === 'árbol de maple') return 'scale-110 object-contain p-1';
    if (lowerName === 'consumer choice center') return 'scale-[1.25] object-contain p-1';
    if (lowerName === 'pikasim') return 'scale-100 object-contain p-1';
    if (lowerName === 'mad gringo hot sauce') return 'scale-110 object-contain p-1';
    if (lowerName === 'privaterouter') return 'scale-110 object-contain p-1';
    if (lowerName === 'ivpn') return 'scale-[1.4] object-contain p-1';
    if (lowerName === 'hyke & byke') return 'scale-110 object-contain p-1';
    if (lowerName === 'kerwell') return 'scale-110 object-contain p-1';
    if (lowerName === 'sticky') return 'scale-100 object-contain p-0';
    if (lowerName === 'samen maier') return 'scale-100 object-contain p-0';
    if (lowerName === 'smith pastures') return 'scale-[1.2] object-contain p-0';
    if (lowerName === 'skoon.') return 'scale-100 object-contain p-0';
    if (lowerName === 'mei leaf') return 'scale-[1.15] object-contain p-0';
    if (lowerName === 'missprint') return 'scale-110 object-contain p-1';
    if (lowerName === 'izindlovu') return 'scale-125 object-contain p-1';
    if (lowerName === 'sole') return 'scale-125 object-contain p-2';
    if (lowerName === 'fuelingyou') return 'scale-110 object-contain p-1';
    if (lowerName === 'heatbit') return 'scale-[1.15] object-contain p-0';
    if (lowerName === 'degoogled') return 'scale-110 object-contain p-1';
    if (lowerName === 'mmoga') return 'scale-90 object-contain p-1';
    if (lowerName === 'human trafficking institute') return 'scale-100 object-contain p-0';
    if (lowerName === 'uzi shop') return 'scale-90 object-contain p-0';
    if (lowerName === 'le cyclo sportif') return 'scale-[1.3] object-contain px-1';
    if (lowerName === 'hill helicopters') return 'scale-[1.1] object-contain p-0';
    if (lowerName === 'alternative airlines') return 'scale-[1.0] object-contain p-0';
    if (lowerName === 'brazilian botanicals') return 'scale-[1.0] object-contain p-0';
    if (lowerName === 'cyberpiggy') return 'scale-[1.0] object-contain p-0';
    if (lowerName === 'nordvpn') return 'scale-[1.0] object-contain p-0';
    if (lowerName === 'gameroom') return 'scale-[1.4] object-contain p-2';
    if (lowerName === 'hotelgift') return 'scale-[1.1] object-contain p-1';
    if (lowerName === 'reachtags') return 'scale-[1.0] object-contain p-0';
    if (lowerName === 'surfshark') return 'scale-[1.3] object-contain p-1';
    if (lowerName === 'vintage guitar world') return 'scale-[1.3] object-contain p-2';
    if (lowerName === 'wayland games') return 'scale-[1.15] object-contain p-1';
    if (lowerName === 'zenmarket') return 'scale-[1.5] object-contain p-1';
    if (lowerName === 'zumub') return 'scale-[1.0] object-contain p-0';
    if (lowerName === 'gift off') return 'scale-[1.0] object-contain p-0';
    if (lowerName === 'waking herbs') return 'scale-[1.3] object-contain p-0';
    if (lowerName === 'freedom of the press foundation') return 'scale-[1.1] object-contain p-2';
    if (lowerName === 'internet archive') return 'scale-[1.0] object-contain p-0';
    return '';
  };

  const getIconBg = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName === 'kawa') return 'bg-[#c9121f] border-[#c9121f]';
    if (lowerName === 'the suffolk tutor') return 'bg-[#ff9e16] border-[#ff9e16]';
    if (lowerName === 'beef initiative') return 'bg-black border-black';
    if (lowerName === 'oshi good') return 'bg-black border-black';
    if (lowerName === 'la industria handmade') return 'bg-[#1a1a1a] border-[#1a1a1a]';
    if (lowerName === 'consumer choice center') return 'bg-[#1e3a8a] border-[#1e3a8a]';
    if (lowerName === 'mad gringo hot sauce') return 'bg-black border-black';
    if (lowerName === 'torguard') return 'bg-[#0a1128] border-[#0a1128]';
    if (lowerName === 'privaterouter') return 'bg-white shadow-none';
    if (lowerName === 'ivpn') return 'bg-[#1a1a1a] border-[#1a1a1a]';
    if (lowerName === 'hyke & byke') return 'bg-black border-black';
    if (lowerName === 'kerwell') return 'bg-black border-black';
    if (lowerName === 'sticky') return 'bg-[#f0c3d9] border-[#f0c3d9]';
    if (lowerName === 'samen maier') return 'bg-white border-[#e5e7eb]';
    if (lowerName === 'smith pastures') return 'bg-white border-[#e5e7eb] shadow-none';
    if (lowerName === 'skoon.') return 'bg-white border-[#e5e7eb]';
    if (lowerName === 'mei leaf') return 'bg-[#9e0b31] border-[#9e0b31]';
    if (lowerName === 'missprint') return 'bg-white border-[#e5e7eb]';
    if (lowerName === 'izindlovu') return 'bg-white border-[#e5e7eb]';
    if (lowerName === 'sole') return 'bg-black border-black';
    if (lowerName === 'fuelingyou') return 'bg-white border-[#e5e7eb]';
    if (lowerName === 'root & branch') return 'bg-black border-black';
    if (lowerName === 'spy equipment uk') return 'bg-[#0a1a0a] border-[#0a1a0a]';
    if (lowerName === 'atoms') return 'bg-black border-black';
    if (lowerName === 'heatbit') return 'bg-black border-black';
    if (lowerName === 'nogood studio') return 'bg-[#ff3b00] border-[#ff3b00]';
    if (lowerName === 'degoogled') return 'bg-white border-[#e5e7eb]';
    if (lowerName === 'crave') return 'bg-white border-[#e5e7eb]';
    if (lowerName === 'mmoga') return 'bg-white border-[#e5e7eb]';
    if (lowerName === 'human trafficking institute') return 'bg-[#002d72] border-[#002d72]';
    if (lowerName === 'uzi shop') return 'bg-[#5b84ba] border-[#5b84ba]';
    if (lowerName === 'hill helicopters') return 'bg-black border-black';
    if (lowerName === 'alternative airlines') return 'bg-[#5c4fff] border-[#5c4fff]';
    if (lowerName === 'brazilian botanicals') return 'bg-[#831843] border-[#831843]';
    if (lowerName === 'cyberpiggy') return 'bg-[#d12a5e] border-[#d12a5e]';
    if (lowerName === 'nordvpn') return 'bg-[#3b60ff] border-[#3b60ff]';
    if (lowerName === 'gameroom') return 'bg-black border-black';
    if (lowerName === 'hotelgift') return 'bg-white border-[#e5e7eb]';
    if (lowerName === 'reachtags') return 'bg-black border-black';
    if (lowerName === 'surfshark') return 'bg-white border-[#e5e7eb]';
    if (lowerName === 'vintage guitar world') return 'bg-white border-[#e5e7eb]';
    if (lowerName === 'wayland games') return 'bg-white border-[#e5e7eb]';
    if (lowerName === 'zenmarket') return 'bg-white border-[#e5e7eb]';
    if (lowerName === 'zumub') return 'bg-black border-black';
    if (lowerName === 'gift off') return 'bg-[#f4a124] border-[#f4a124]';
    if (lowerName === 'waking herbs') return 'bg-[#5c1334] border-[#5c1334]';
    if (lowerName === 'freedom of the press foundation') return 'bg-white border-[#e5e7eb]';
    if (lowerName === 'internet archive') return 'bg-black border-black';
    return getIconBgColor();
  };

  return (
    <Card className="flex flex-col md:flex-row w-full bg-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 group overflow-hidden relative mb-4">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="flex flex-col md:flex-row flex-1 p-4 gap-6 items-start md:items-center">
        {/* Merchant Identity Section - Fixed width for alignment */}
        <div className="flex items-center gap-4 w-full md:w-[280px] shrink-0">
          <div className={`h-16 w-16 shrink-0 rounded-xl flex items-center justify-center text-3xl border border-border/50 overflow-hidden z-10 ${getIconBg(merchant.name)}`}>
            <img 
              src={merchant.logo} 
              alt={merchant.name} 
              className={`w-full h-full object-contain ${getLogoScaling(merchant.name)}`} 
            />
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

        {/* Description & Categories Section - flex-1 for remaining space */}
        <div className="flex-1 space-y-3 z-10 min-w-0">
          <CardDescription className="line-clamp-2 text-base">
            {merchant.description}
          </CardDescription>

          <div className="flex flex-wrap gap-2">
            {merchant.categories.slice(0, 3).map((cat) => (
              <Badge key={cat} variant="secondary" className="hover:bg-secondary/80 whitespace-nowrap text-[10px] py-0 px-2 h-5">
                {cat}
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

        {/* Action Buttons Section - Fixed width for alignment */}
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
                        onClick={() => setRating(star)}
                      >
                        <Star className={cn(
                          "h-6 w-6 transition-colors",
                          rating >= star ? "text-primary fill-primary" : "text-muted fill-muted"
                        )} />
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea 
                    id="comment" 
                    placeholder="Tell us about your purchase..." 
                    required 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={reviewMutation.isPending}>
                    {reviewMutation.isPending ? "Publishing..." : "Sign & Publish"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
