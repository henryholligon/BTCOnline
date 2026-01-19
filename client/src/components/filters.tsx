import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, COUNTRIES, PAYMENT_PROVIDERS } from "@/lib/mock-data";
import { Filter, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FiltersProps {
  selectedCategories: string[];
  onCategoryChange: (category: string) => void;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  selectedShippedFrom: string;
  onShippedFromChange: (country: string) => void;
  selectedMadeIn: string;
  onMadeInChange: (country: string) => void;
  selectedProviders: string[];
  onProviderChange: (provider: string) => void;
  minRating: number;
  onRatingChange: (rating: number) => void;
  onClear: () => void;
}

export default function Filters({
  selectedCategories,
  onCategoryChange,
  selectedCountry,
  onCountryChange,
  selectedShippedFrom,
  onShippedFromChange,
  selectedMadeIn,
  onMadeInChange,
  selectedProviders,
  onProviderChange,
  minRating,
  onRatingChange,
  onClear,
}: FiltersProps) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium tracking-wide uppercase text-muted-foreground flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filters
        </h3>
        {(selectedCategories.length > 0 || selectedCountry !== "All" || selectedShippedFrom !== "All" || selectedMadeIn !== "All" || minRating > 0 || selectedProviders.length > 0) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClear}
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all <X className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <Label className="text-sm font-display">Minimum Rating</Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onRatingChange(minRating === star ? 0 : star)}
                className="group focus:outline-none transition-transform active:scale-90"
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors fill-current",
                    star <= minRating 
                      ? (minRating === 5 ? "text-yellow-400" : "text-primary")
                      : "text-muted-foreground/30 group-hover:text-primary/50"
                  )}
                />
              </button>
            ))}
            <span className="ml-2 text-xs font-medium text-muted-foreground">
              {minRating === 5 ? "5 Stars" : (minRating > 0 ? `${minRating}+ Stars` : "Any")}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-display">Shipping to</Label>
          <Select value={selectedCountry} onValueChange={onCountryChange}>
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="Select destination" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Anywhere</SelectItem>
              {COUNTRIES.map((country) => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-display">Shipping from</Label>
          <Select value={selectedShippedFrom} onValueChange={onShippedFromChange}>
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="Select origin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Anywhere</SelectItem>
              {COUNTRIES.map((country) => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-display">Country made in</Label>
          <Select value={selectedMadeIn} onValueChange={onMadeInChange}>
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="Select origin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Anywhere</SelectItem>
              {COUNTRIES.map((country) => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-display">Payment Provider</Label>
          <ScrollArea className="h-[120px] pr-4">
            <div className="space-y-3">
              {PAYMENT_PROVIDERS.map((provider) => (
                <div key={provider} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`provider-${provider}`} 
                    checked={selectedProviders.includes(provider)}
                    onCheckedChange={() => onProviderChange(provider)}
                  />
                  <Label htmlFor={`provider-${provider}`} className="text-sm font-normal cursor-pointer">
                    {provider}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-display">Categories</Label>
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-3">
              {CATEGORIES.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`category-${category}`} 
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => onCategoryChange(category)}
                  />
                  <Label htmlFor={`category-${category}`} className="text-sm font-normal cursor-pointer">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
