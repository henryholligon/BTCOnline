import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, COUNTRIES, PAYMENT_PROVIDERS } from "@shared/schema";
import { Bitcoin, Filter, X, Zap } from "lucide-react";

interface FiltersProps {
  selectedCategories: string[];
  onCategoryChange: (category: string) => void;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  selectedMadeIn: string;
  onMadeInChange: (country: string) => void;
  selectedProviders: string[];
  onProviderChange: (provider: string) => void;
  selectedPaymentMethods: string[];
  onPaymentMethodChange: (method: string) => void;
  onClear: () => void;
}

const categoryEmojis: Record<string, string> = {
  "Electronics": "💻",
  "Food & Drink": "🍴",
  "Travel": "✈️",
  "Gift Cards": "🎁",
  "VPN & Privacy": "🛡️",
  "Hosting": "🌐",
  "Art": "🎨",
  "Charity": "❤️",
  "Fashion": "👗",
  "Lifestyle": "✨",
  "Gaming": "🎮",
  "Social Media": "📱",
  "Gambling": "🎰",
  "Real Estate": "🏠",
  "Vehicle": "🚗",
  "Footwear": "👟",
  "Cellular": "📡",
  "AI": "🤖",
  "Magazine": "📰",
  "Education": "🎓",
  "Home Goods": "🏠",
  "Airplanes": "✈️",
  "Yachts": "🛥️",
  "Nicotine": "🚬",
  "Hot Tubs": "🛁",
  "Games": "🎲",
  "VPN": "🛡️",
  "Health": "🏥",
  "Food Delivery": "🛵",
  "Taxi": "🚕",
  "Insurance": "🛡️",
  "Payments": "💳",
  "Furniture": "🪑",
  "Jewellery": "💎",
};

const countryEmojis: Record<string, string> = {
  "Worldwide": "🌍",
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  "EEA": "🇪🇺",
  "Canada": "🇨🇦",
  "Singapore": "🇸🇬",
  "Mexico": "🇲🇽",
  "Columbia": "🇨🇴",
  "Monaco": "🇲🇨",
};

export default function Filters({
  selectedCategories,
  onCategoryChange,
  selectedCountry,
  onCountryChange,
  selectedMadeIn,
  onMadeInChange,
  selectedProviders,
  onProviderChange,
  selectedPaymentMethods,
  onPaymentMethodChange,
  onClear,
}: FiltersProps) {

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium tracking-wide uppercase text-muted-foreground flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filters
        </h3>
        {(selectedCategories.length > 0 || selectedCountry !== "All" || selectedMadeIn !== "All" || selectedProviders.length > 0 || selectedPaymentMethods.length > 0) && (
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
          <Label className="text-sm font-display">Payment Method</Label>
          <div className="flex flex-col space-y-2">
            {[
              { id: "lightning", label: "Lightning", icon: <Zap className="h-3 w-3 fill-yellow-400 text-yellow-400" /> },
              { id: "onchain", label: "On-Chain", icon: <Bitcoin className="h-3 w-3 fill-orange-500 text-orange-500" /> }
            ].map((method) => (
              <div key={method.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`method-${method.id}`} 
                  checked={selectedPaymentMethods.includes(method.id)}
                  onCheckedChange={() => onPaymentMethodChange(method.id)}
                />
                <Label htmlFor={`method-${method.id}`} className="text-sm font-normal cursor-pointer flex items-center gap-1.5">
                  {method.icon} {method.label}
                </Label>
              </div>
            ))}
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
                <SelectItem key={country} value={country}>{countryEmojis[country] || ""} {country}</SelectItem>
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
                <SelectItem key={country} value={country}>{countryEmojis[country] || ""} {country}</SelectItem>
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
                    {categoryEmojis[category] || "📦"} {category}
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
