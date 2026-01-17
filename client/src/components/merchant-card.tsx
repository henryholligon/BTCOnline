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
    const name = merchant.name.toLowerCase();
    if (name === 'tor project') return 'bg-[#f9f9f9] shadow-none';
    if (name === 'human rights foundation') return 'bg-white shadow-none';
    if (name === 'cheapair') return 'bg-white shadow-none';
    if (name === 'travala') return 'bg-white shadow-none';
    if (name === 'g2a') return 'bg-[#181c1f] shadow-none';
    if (name === 'obscura vpn') return 'bg-white shadow-none';
    if (name === 'silent.link') return 'bg-white shadow-none';
    return 'bg-secondary shadow-inner';
  };

  return (
    <Card className="flex flex-col h-full bg-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 group overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 z-10">
        <div className="flex gap-4">
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center text-3xl border border-border/50 overflow-hidden ${getIconBgColor()}`}>
            {merchant.logo.startsWith("/") || merchant.logo.startsWith("http") ? (
              <img 
                src={merchant.logo} 
                alt={merchant.name} 
                className={`w-full h-full object-contain ${
                  merchant.name.toLowerCase() === 'start9' ? 'bg-black p-1' : 
                  merchant.name.toLowerCase() === 'bitrefill' ? 'scale-110' : 
                  merchant.name.toLowerCase() === 'cheapair' ? 'scale-[2.8]' : 
                  merchant.name.toLowerCase() === 'travala' ? 'scale-90' : 
                  merchant.name.toLowerCase() === 'g2a' ? 'scale-100' : 
                  merchant.name.toLowerCase() === 'obscura vpn' ? 'scale-110' : 
                  merchant.name.toLowerCase() === 'silent.link' ? 'scale-110' : ''
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
