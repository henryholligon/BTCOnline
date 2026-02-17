import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, COUNTRIES, PAYMENT_PROVIDERS } from "@shared/schema";
import { Bitcoin, ChevronDown, X, Zap } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

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

function FilterDropdown({ label, children, active, closeOnSelect = true, searchable = false, searchPlaceholder = "Search..." }: { label: string; children: React.ReactNode | ((search: string) => React.ReactNode); active?: boolean; closeOnSelect?: boolean; searchable?: boolean; searchPlaceholder?: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 8, left: rect.left });
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }
    updatePosition();
    setTimeout(() => searchInputRef.current?.focus(), 0);
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) return;
      setOpen(false);
    };
    const handleScroll = () => updatePosition();
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open, updatePosition]);

  const handleItemClick = () => {
    if (closeOnSelect) setOpen(false);
  };

  return (
    <div className="shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
          active
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-muted/50 text-foreground border-border hover:border-primary/50 hover:bg-muted"
        }`}
        data-testid={`filter-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && createPortal(
        <div
          ref={panelRef}
          className="bg-popover border border-border rounded-lg shadow-lg p-2 max-h-[300px] overflow-y-auto"
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, display: 'inline-flex', flexDirection: 'column', maxWidth: '90vw', minWidth: searchable ? '200px' : undefined }}
          onClick={handleItemClick}
        >
          {searchable && (
            <div className="pb-1.5 mb-1 border-b border-border/50 sticky top-0 bg-popover" onClick={(e) => e.stopPropagation()}>
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full px-2.5 py-1.5 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                data-testid={`filter-search-${label.toLowerCase().replace(/\s+/g, '-')}`}
              />
            </div>
          )}
          {typeof children === "function" ? (children as (search: string) => React.ReactNode)(search) : children}
        </div>,
        document.body
      )}
    </div>
  );
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
  const hasActiveFilters = selectedCategories.length > 0 || selectedCountry !== "All" || selectedMadeIn !== "All" || selectedProviders.length > 0 || selectedPaymentMethods.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <FilterDropdown label="🔍 Search" active={selectedCategories.length > 0} searchable searchPlaceholder="Search categories...">
          {(search: string) => {
            const filtered = CATEGORIES.filter(cat => cat.toLowerCase().includes(search.toLowerCase()));
            return (
              <>
                {!search && (
                  <button
                    onClick={() => onCategoryChange("All")}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-muted transition-colors ${
                      selectedCategories.length === 0 ? "bg-primary/10 text-primary font-medium" : ""
                    }`}
                  >
                    All Categories
                  </button>
                )}
                {filtered.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onCategoryChange(cat)}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-muted transition-colors ${
                      selectedCategories.includes(cat) ? "bg-primary/10 text-primary font-medium" : ""
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-xs text-muted-foreground px-3 py-1.5">No matches</p>}
              </>
            );
          }}
        </FilterDropdown>

        <FilterDropdown label="💵 Payment" active={selectedPaymentMethods.length > 0} closeOnSelect={false}>
          {[
            { id: "lightning", label: "Lightning", icon: <Zap className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> },
            { id: "onchain", label: "On-Chain", icon: <Bitcoin className="h-3.5 w-3.5 fill-orange-500 text-orange-500" /> }
          ].map((method) => (
            <button
              key={method.id}
              onClick={(e) => { e.stopPropagation(); onPaymentMethodChange(method.id); }}
              className={`w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-muted transition-colors flex items-center gap-2 ${
                selectedPaymentMethods.includes(method.id) ? "bg-primary/10 text-primary font-medium" : ""
              }`}
              data-testid={`filter-payment-${method.id}`}
            >
              {method.icon} {method.label}
            </button>
          ))}
        </FilterDropdown>

        <FilterDropdown label="📦 Ships to" active={selectedCountry !== "All"} searchable searchPlaceholder="Search countries...">
          {(search: string) => {
            const filtered = COUNTRIES.filter(c => c.toLowerCase().includes(search.toLowerCase()));
            return (
              <>
                {!search && (
                  <button
                    onClick={() => onCountryChange("All")}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-muted transition-colors ${
                      selectedCountry === "All" ? "bg-primary/10 text-primary font-medium" : ""
                    }`}
                  >
                    Anywhere
                  </button>
                )}
                {filtered.map((country) => (
                  <button
                    key={country}
                    onClick={() => onCountryChange(country)}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-muted transition-colors ${
                      selectedCountry === country ? "bg-primary/10 text-primary font-medium" : ""
                    }`}
                  >
                    {country}
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-xs text-muted-foreground px-3 py-1.5">No matches</p>}
              </>
            );
          }}
        </FilterDropdown>

        <FilterDropdown label="👷 Made in" active={selectedMadeIn !== "All"} searchable searchPlaceholder="Search countries...">
          {(search: string) => {
            const filtered = COUNTRIES.filter(c => c.toLowerCase().includes(search.toLowerCase()));
            return (
              <>
                {!search && (
                  <button
                    onClick={() => onMadeInChange("All")}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-muted transition-colors ${
                      selectedMadeIn === "All" ? "bg-primary/10 text-primary font-medium" : ""
                    }`}
                  >
                    Anywhere
                  </button>
                )}
                {filtered.map((country) => (
                  <button
                    key={country}
                    onClick={() => onMadeInChange(country)}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-muted transition-colors ${
                      selectedMadeIn === country ? "bg-primary/10 text-primary font-medium" : ""
                    }`}
                  >
                    {country}
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-xs text-muted-foreground px-3 py-1.5">No matches</p>}
              </>
            );
          }}
        </FilterDropdown>

        <FilterDropdown label="🔌 Provider" active={selectedProviders.length > 0} closeOnSelect={false} searchable searchPlaceholder="Search providers...">
          {(search: string) => {
            const filtered = PAYMENT_PROVIDERS.filter(p => p.toLowerCase().includes(search.toLowerCase()));
            return (
              <>
                {filtered.map((provider) => (
                  <button
                    key={provider}
                    onClick={(e) => { e.stopPropagation(); onProviderChange(provider); }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-muted transition-colors ${
                      selectedProviders.includes(provider) ? "bg-primary/10 text-primary font-medium" : ""
                    }`}
                    data-testid={`filter-provider-${provider.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {provider}
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-xs text-muted-foreground px-3 py-1.5">No matches</p>}
              </>
            );
          }}
        </FilterDropdown>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-full"
            data-testid="button-clear-filters"
          >
            Clear <X className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {selectedCategories.map((cat) => (
            <Badge key={cat} variant="secondary" className="text-xs py-0.5 px-2 gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => onCategoryChange(cat)}>
              {cat} <X className="h-2.5 w-2.5" />
            </Badge>
          ))}
          {selectedPaymentMethods.map((m) => (
            <Badge key={m} variant="secondary" className="text-xs py-0.5 px-2 gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => onPaymentMethodChange(m)}>
              {m === "lightning" ? "⚡ Lightning" : "₿ On-Chain"} <X className="h-2.5 w-2.5" />
            </Badge>
          ))}
          {selectedCountry !== "All" && (
            <Badge variant="secondary" className="text-xs py-0.5 px-2 gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => onCountryChange("All")}>
              Ships to: {selectedCountry} <X className="h-2.5 w-2.5" />
            </Badge>
          )}
          {selectedMadeIn !== "All" && (
            <Badge variant="secondary" className="text-xs py-0.5 px-2 gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => onMadeInChange("All")}>
              Made in: {selectedMadeIn} <X className="h-2.5 w-2.5" />
            </Badge>
          )}
          {selectedProviders.map((p) => (
            <Badge key={p} variant="secondary" className="text-xs py-0.5 px-2 gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => onProviderChange(p)}>
              {p} <X className="h-2.5 w-2.5" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
