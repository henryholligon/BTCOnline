import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, COUNTRIES, PAYMENT_PROVIDERS } from "@/lib/mock-data";
import { Filter, Star, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface FiltersProps {
  selectedCategories: string[];
  onCategoryChange: (category: string) => void;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
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
  selectedProviders,
  onProviderChange,
  minRating,
  onRatingChange,
  onClear,
}: FiltersProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium tracking-wide uppercase text-muted-foreground flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filters
        </h3>
        {(selectedCategories.length > 0 || selectedCountry !== "All" || minRating > 0 || selectedProviders.length > 0) && (
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

      <div className="space-y-3">
        <Label className="text-base font-display">Minimum Rating</Label>
        <div className="pt-2 pb-1">
          <Slider
            value={[minRating]}
            min={0}
            max={5}
            step={1}
            onValueChange={(val) => onRatingChange(val[0])}
            className="cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>Any</span>
          <span>5 Stars</span>
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-primary">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span>{minRating === 0 ? "Any Rating" : `${minRating}+ Stars`}</span>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-display">Shipping Country</Label>
        <Select value={selectedCountry} onValueChange={onCountryChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">Anywhere</SelectItem>
            {COUNTRIES.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-display">Payment Provider</Label>
        <ScrollArea className="h-[150px] pr-4">
          <div className="space-y-3">
            {PAYMENT_PROVIDERS.map((provider) => (
              <div key={provider} className="flex items-center space-x-2">
                <Checkbox 
                  id={`provider-${provider}`} 
                  checked={selectedProviders.includes(provider)}
                  onCheckedChange={() => onProviderChange(provider)}
                  className="border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <Label 
                  htmlFor={`provider-${provider}`}
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer hover:text-primary transition-colors"
                >
                  {provider}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-display">Categories</Label>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {CATEGORIES.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox 
                  id={`category-${category}`} 
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => onCategoryChange(category)}
                  className="border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <Label 
                  htmlFor={`category-${category}`}
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer hover:text-primary transition-colors"
                >
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
