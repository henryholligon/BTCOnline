import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Merchant } from "@/lib/mock-data";
import { ExternalLink, Star, Zap, Bitcoin, Globe, MessageSquare } from "lucide-react";
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

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setIsReviewOpen(false);
    toast({
      title: "Review Submitted",
      description: "Your review has been signed and published to the relay.",
    });
  };

  const getIconBgColor = () => {
    return 'bg-white shadow-none';
  };

  return (
    <Card className="flex flex-col h-full bg-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 group overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 z-10">
        <div className="flex gap-4">
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center text-3xl border border-border/50 overflow-hidden ${
            merchant.name.toLowerCase() === 'kawa' ? 'bg-[#c9121f] border-[#c9121f]' : 
            merchant.name.toLowerCase() === 'the suffolk tutor' ? 'bg-[#ff9e16] border-[#ff9e16]' :
            merchant.name.toLowerCase() === 'beef initiative' ? 'bg-black border-black' :
            merchant.name.toLowerCase() === 'oshi good' ? 'bg-black border-black' :
            merchant.name.toLowerCase() === 'la industria handmade' ? 'bg-[#1a1a1a] border-[#1a1a1a]' :
            merchant.name.toLowerCase() === 'consumer choice center' ? 'bg-[#1e3a8a] border-[#1e3a8a]' :
            merchant.name.toLowerCase() === 'mad gringo hot sauce' ? 'bg-black border-black' :
            merchant.name.toLowerCase() === 'torguard' ? 'bg-[#0a1128] border-[#0a1128]' :
            merchant.name.toLowerCase() === 'privaterouter' ? 'bg-white shadow-none' :
            merchant.name.toLowerCase() === 'ivpn' ? 'bg-[#1a1a1a] border-[#1a1a1a]' :
            merchant.name.toLowerCase() === 'hyke & byke' ? 'bg-black border-black' :
            merchant.name.toLowerCase() === 'kerwell' ? 'bg-black border-black' :
            merchant.name.toLowerCase() === 'sticky' ? 'bg-[#f0c3d9] border-[#f0c3d9]' :
            merchant.name.toLowerCase() === 'samen maier' ? 'bg-white border-[#e5e7eb]' :
            merchant.name.toLowerCase() === 'smith pastures' ? 'bg-white border-[#e5e7eb] shadow-none' :
            merchant.name.toLowerCase() === 'skoon.' ? 'bg-white border-[#e5e7eb]' :
            merchant.name.toLowerCase() === 'mei leaf' ? 'bg-[#9e0b31] border-[#9e0b31]' :
            merchant.name.toLowerCase() === 'missprint' ? 'bg-white border-[#e5e7eb]' :
            merchant.name.toLowerCase() === 'izindlovu' ? 'bg-white border-[#e5e7eb]' :
            merchant.name.toLowerCase() === 'sole' ? 'bg-black border-black' :
            merchant.name.toLowerCase() === 'fuelingyou' ? 'bg-white border-[#e5e7eb]' :
            merchant.name.toLowerCase() === 'root & branch' ? 'bg-black border-black' :
            merchant.name.toLowerCase() === 'spy equipment uk' ? 'bg-[#0a1a0a] border-[#0a1a0a]' :
            merchant.name.toLowerCase() === 'atoms' ? 'bg-black border-black' :
            merchant.name.toLowerCase() === 'heatbit' ? 'bg-black border-black' :
            merchant.name.toLowerCase() === 'nogood studio' ? 'bg-[#ff3b00] border-[#ff3b00]' :
            merchant.name.toLowerCase() === 'degoogled' ? 'bg-white border-[#e5e7eb]' :
            merchant.name.toLowerCase() === 'crave' ? 'bg-white border-[#e5e7eb]' :
            merchant.name.toLowerCase() === 'mmoga' ? 'bg-white border-[#e5e7eb]' :
            merchant.name.toLowerCase() === 'human trafficking institute' ? 'bg-[#002d72] border-[#002d72]' :
            merchant.name.toLowerCase() === 'uzi shop' ? 'bg-[#5b84ba] border-[#5b84ba]' :
            merchant.name.toLowerCase() === 'le cyclo sportif' ? 'bg-white border-[#e5e7eb]' :
            getIconBgColor()
          }`}>
            {merchant.logo.startsWith("/") || merchant.logo.startsWith("http") ? (
              <img 
                src={merchant.logo} 
                alt={merchant.name} 
                className={`w-full h-full object-contain ${
                  merchant.name.toLowerCase() === 'start9' ? 'bg-black p-1' : 
                  merchant.name.toLowerCase() === 'bitrefill' ? 'scale-110' : 
                  merchant.name.toLowerCase() === 'human rights foundation' ? 'scale-110' : 
                  merchant.name.toLowerCase() === 'cheapair' ? 'scale-[2.8]' : 
                  merchant.name.toLowerCase() === 'travala' ? 'scale-110' : 
                  merchant.name.toLowerCase() === 'g2a' ? 'scale-100' : 
                  merchant.name.toLowerCase() === 'obscura' ? 'scale-100' : 
                  merchant.name.toLowerCase() === 'silent.link' ? 'scale-125' : 
                  merchant.name.toLowerCase() === 'great ghee' ? 'scale-[1.4]' : 
                  merchant.name.toLowerCase() === 'great north air ambulance' ? 'scale-90' : 
                  merchant.name.toLowerCase() === 'castle hill gin' ? 'scale-110' : 
                  merchant.name.toLowerCase() === 'bonjour wines' ? 'scale-110' : 
                  merchant.name.toLowerCase() === 'peony lane wine' ? 'scale-90' : 
                  merchant.name.toLowerCase() === 'yum yum tree fudge' ? 'scale-110' : 
                  merchant.name.toLowerCase() === 'tea and tonic' ? 'scale-90' : 
                  merchant.name.toLowerCase() === 'arotags' ? 'scale-90' : 
                  merchant.name.toLowerCase() === 'spitting feathers' ? 'scale-[0.85]' : 
                  merchant.name.toLowerCase() === 'mushmore supplements' ? 'scale-90 object-contain' : 
                  merchant.name.toLowerCase() === 'hummingbird amsterdam' ? 'scale-125 object-contain' : 
                  merchant.name.toLowerCase() === 'planet express' ? 'scale-90 object-contain' : 
                  merchant.name.toLowerCase() === 'farfetch' ? 'scale-90 object-contain' : 
                  merchant.name.toLowerCase() === 'bramleigh farm' ? 'scale-90 object-contain' : 
                  merchant.name.toLowerCase() === 'oshi good' ? 'scale-110 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'palingshop' ? 'scale-100 object-contain' : 
                  merchant.name.toLowerCase() === 'ticketpro' ? 'scale-100 object-cover' : 
                  merchant.name.toLowerCase() === 'dynadot' ? 'scale-100 object-cover' : 
                  merchant.name.toLowerCase() === 'soapminer' ? 'scale-100 object-cover' : 
                  merchant.name.toLowerCase() === 'mobimatter' ? 'scale-100 object-cover' : 
                  merchant.name.toLowerCase() === 'the good beans' ? 'scale-100 object-cover' : 
                  merchant.name.toLowerCase() === 'pumphreys coffee' ? 'scale-100 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'mynymbox' ? 'scale-90' : 
                  merchant.name.toLowerCase() === 'epic deals' ? 'scale-100 object-cover' : 
                  merchant.name.toLowerCase() === "farmer bill's provisions" ? 'scale-75 object-contain' : 
                  merchant.name.toLowerCase() === 'acme acres' ? 'scale-95' : 
                  merchant.name.toLowerCase() === 'chroma' ? 'scale-100 object-contain p-0' : 
                  merchant.name.toLowerCase() === 'kawa' ? 'scale-100 object-cover' : 
                  merchant.name.toLowerCase() === 'kijicha' ? 'scale-90 object-contain' : 
                  merchant.name.toLowerCase() === 'asf tutoring' ? 'scale-100 object-cover' : 
                  merchant.name.toLowerCase() === 'the suffolk tutor' ? 'scale-90 object-contain' : 
                  merchant.name.toLowerCase() === "jimble's jumble" ? 'scale-100 object-cover' : 
                  merchant.name.toLowerCase() === 'hempful' ? 'scale-100 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'highland fayre' ? 'scale-100 object-contain' : 
                  merchant.name.toLowerCase() === 'golden tallow' ? 'scale-100 object-contain' : 
                  merchant.name.toLowerCase() === 'mister padel' ? 'scale-100 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'lincoln kiln dried logs' ? 'scale-100 object-cover' : 
                  merchant.name.toLowerCase() === 'essatoshi' ? 'scale-100 object-cover' : 
                  merchant.name.toLowerCase() === 'cheerings' ? 'scale-100 object-contain' : 
                  merchant.name.toLowerCase() === 'jonathan hill luthier' ? 'scale-100 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'select automotive' ? 'scale-100 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'candyjets' ? 'scale-100 object-cover' : 
                  merchant.name.toLowerCase() === 'maple ai' ? 'scale-100 object-cover' : 
                  merchant.name.toLowerCase() === 'payperq' ? 'scale-110 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'crypto tax help' ? 'scale-100 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'mtsocks' ? 'scale-110 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'torguard' ? 'scale-125 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'beef initiative' ? 'scale-100 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'spy equipment uk' ? 'scale-100 object-contain p-0' : 
                  merchant.name.toLowerCase() === 'bees & trees' ? 'scale-[1.15] object-contain p-1' : 
                  merchant.name.toLowerCase() === 'kaffebox' ? 'scale-100 object-cover' : 
                  merchant.name.toLowerCase() === 'bloom audio' ? 'scale-100 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'la industria handmade' ? 'scale-110 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'campo apícola' ? 'scale-110 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'elephant chateau' ? 'scale-110 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'árbol de maple' ? 'scale-110 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'consumer choice center' ? 'scale-[1.25] object-contain p-1' : 
                  merchant.name.toLowerCase() === 'pikasim' ? 'scale-100 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'mad gringo hot sauce' ? 'scale-110 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'privaterouter' ? 'scale-110 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'ivpn' ? 'scale-[1.4] object-contain p-1' : 
                  merchant.name.toLowerCase() === 'hyke & byke' ? 'scale-110 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'kerwell' ? 'scale-110 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'sticky' ? 'scale-100 object-contain p-0' : 
                  merchant.name.toLowerCase() === 'samen maier' ? 'scale-100 object-contain p-0' : 
                  merchant.name.toLowerCase() === 'smith pastures' ? 'scale-[1.2] object-contain p-0' : 
                  merchant.name.toLowerCase() === 'skoon.' ? 'scale-100 object-contain p-0' : 
                  merchant.name.toLowerCase() === 'mei leaf' ? 'scale-[1.15] object-contain p-0' : 
                  merchant.name.toLowerCase() === 'missprint' ? 'scale-110 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'izindlovu' ? 'scale-125 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'sole' ? 'scale-125 object-contain p-2' : 
                  merchant.name.toLowerCase() === 'fuelingyou' ? 'scale-110 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'heatbit' ? 'scale-[1.15] object-contain p-0' : 
                  merchant.name.toLowerCase() === 'degoogled' ? 'scale-110 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'mmoga' ? 'scale-90 object-contain p-1' : 
                  merchant.name.toLowerCase() === 'human trafficking institute' ? 'scale-100 object-contain p-0' : 
                  merchant.name.toLowerCase() === 'uzi shop' ? 'scale-90 object-contain p-0' : 
                  merchant.name.toLowerCase() === 'le cyclo sportif' ? 'scale-[1.8] object-contain px-1' : ''
                }`} 
              />
            ) : (
              merchant.logo
            )}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl leading-none">{merchant.name}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="font-mono">{averageRating > 0 ? averageRating.toFixed(1) : "New"}</span>
              <span className="text-muted-foreground/50">•</span>
              <span>{merchant.reviews.length} reviews</span>
            </div>
          </div>
        </div>
        {merchant.featured && (
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 animate-pulse-slow">
            Featured
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-4 z-10 pt-2">
        <CardDescription className="line-clamp-2 text-base">
          {merchant.description}
        </CardDescription>

        <div className="flex flex-wrap gap-2">
          {merchant.categories.map((cat) => (
            <Badge key={cat} variant="secondary" className="hover:bg-secondary/80">
              {cat}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
          {merchant.lightningSupported && (
            <div className="flex items-center gap-1 text-yellow-400">
              <Zap className="h-3 w-3 fill-current" />
              <span>Lightning</span>
            </div>
          )}
          {merchant.onchainSupported && (
            <div className="flex items-center gap-1 text-orange-500">
              <Bitcoin className="h-3 w-3 fill-current" />
              <span>On-Chain</span>
            </div>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <Globe className="h-3 w-3" />
            <span>{merchant.shippingCountries.length > 3 ? "Global" : merchant.shippingCountries.join(", ")}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 z-10 pt-2 border-t border-border/30 mt-auto">
        <Button asChild variant="default" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
          <a href={merchant.website} target="_blank" rel="noopener noreferrer">
            Visit Site <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
        
        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" title="Write a review">
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
                <Textarea id="comment" placeholder="Tell us about your purchase..." required />
              </div>
              <DialogFooter>
                <Button type="submit">Sign & Publish</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
