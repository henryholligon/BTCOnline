import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, COUNTRIES, PAYMENT_PROVIDERS } from "@shared/schema";
import { Bitcoin, X, Zap } from "lucide-react";

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
  const hasFilters = selectedCategories.length > 0 || selectedCountry !== "All" || selectedMadeIn !== "All" || selectedProviders.length > 0 || selectedPaymentMethods.length > 0;

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-foreground">Filters</h3>
        {hasFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClear}
            className="h-auto p-0 text-[12px] text-muted-foreground hover:text-foreground font-medium"
          >
            Clear <X className="ml-0.5 h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="space-y-5">
        <div className="space-y-2.5">
          <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Payment</Label>
          <div className="flex flex-col space-y-2">
            {[
              { id: "lightning", label: "Lightning", icon: <Zap className="h-3 w-3 fill-amber-500 text-amber-500" /> },
              { id: "onchain", label: "On-Chain", icon: <Bitcoin className="h-3 w-3 text-orange-500" /> }
            ].map((method) => (
              <div key={method.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`method-${method.id}`} 
                  checked={selectedPaymentMethods.includes(method.id)}
                  onCheckedChange={() => onPaymentMethodChange(method.id)}
                  className="rounded"
                  data-testid={`checkbox-${method.id}`}
                />
                <Label htmlFor={`method-${method.id}`} className="text-[13px] font-normal cursor-pointer flex items-center gap-1.5">
                  {method.icon} {method.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Ships to</Label>
          <Select value={selectedCountry} onValueChange={onCountryChange}>
            <SelectTrigger className="w-full h-8 rounded-lg text-[13px]" data-testid="select-shipping">
              <SelectValue placeholder="Anywhere" />
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
          <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Made in</Label>
          <Select value={selectedMadeIn} onValueChange={onMadeInChange}>
            <SelectTrigger className="w-full h-8 rounded-lg text-[13px]" data-testid="select-made-in">
              <SelectValue placeholder="Anywhere" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Anywhere</SelectItem>
              {COUNTRIES.map((country) => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2.5">
          <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Provider</Label>
          <ScrollArea className="h-[110px] pr-3">
            <div className="space-y-2">
              {PAYMENT_PROVIDERS.map((provider) => (
                <div key={provider} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`provider-${provider}`} 
                    checked={selectedProviders.includes(provider)}
                    onCheckedChange={() => onProviderChange(provider)}
                    className="rounded"
                    data-testid={`checkbox-provider-${provider}`}
                  />
                  <Label htmlFor={`provider-${provider}`} className="text-[13px] font-normal cursor-pointer">
                    {provider}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-2.5">
          <Label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Category</Label>
          <ScrollArea className="h-[200px] pr-3">
            <div className="space-y-2">
              {CATEGORIES.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`category-${category}`} 
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => onCategoryChange(category)}
                    className="rounded"
                    data-testid={`checkbox-category-${category}`}
                  />
                  <Label htmlFor={`category-${category}`} className="text-[13px] font-normal cursor-pointer">
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
