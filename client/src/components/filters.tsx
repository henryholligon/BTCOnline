import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Merchant } from "@shared/schema";
import { useCategoryEmojis } from "@/hooks/use-category-emojis";
import { useCountryEmojis } from "@/hooks/use-country-emojis";
import { ChevronDown, X, Zap, Lock } from "lucide-react";
import BitcoinLogo from "@/components/bitcoin-logo";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useRestrictedCategories } from "@/hooks/use-restricted-categories";


interface FiltersProps {
  merchants: Merchant[];
  selectedCategories: string[];
  onCategoryChange: (category: string) => void;
  selectedCountries: string[];
  onCountryChange: (country: string) => void;
  selectedMadeIn: string[];
  onMadeInChange: (country: string) => void;
  selectedProviders: string[];
  onProviderChange: (provider: string) => void;
  selectedPaymentMethods: string[];
  onPaymentMethodChange: (method: string) => void;
  onClear: () => void;
  onCategorySearch?: (search: string) => void;
  categorySearchQuery?: string;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  ageVerified?: boolean;
  onAgeVerify?: () => void;
}

function FilterDropdown({
  label,
  children,
  active,
  closeOnSelect = true,
  searchable = false,
  searchPlaceholder = "Type...",
  onSearchChange,
  onClearAll,
  committedSearch: externalCommittedSearch,
}: {
  label: string;
  children: React.ReactNode | ((search: string) => React.ReactNode);
  active?: boolean;
  closeOnSelect?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (search: string) => void;
  onClearAll?: () => void;
  committedSearch?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const committedSearch = externalCommittedSearch || "";
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setSearch(committedSearch);
      return;
    }
    setSearch(committedSearch);
    updatePosition();
    if (searchable) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
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
  }, [open, updatePosition, searchable]);

  const handleItemClick = () => {
    if (closeOnSelect) setOpen(false);
  };

  const parts = label.split(" ");
  const emoji = parts.length > 1 && parts[0].length <= 2 ? parts[0] : "";
  const textLabel = emoji ? parts.slice(1).join(" ") : label;

  return (
    <div className="shrink-0">
      <div
        ref={triggerRef}
        className={`flex items-center gap-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap cursor-pointer ${
          open
            ? "bg-primary/10 border-primary ring-2 ring-primary/20"
            : active
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/50 text-foreground border-border hover:border-primary/50 hover:bg-muted"
        }`}
        onClick={() => {
          if (!open) setOpen(true);
        }}
        data-testid={`filter-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {searchable && open ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5">
            {emoji && <span>{emoji}</span>}
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="bg-transparent border-none outline-none text-sm font-medium w-[80px] placeholder:text-muted-foreground/60"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter") {
                  e.preventDefault();
                  const trimmed = search.trim();
                  if (trimmed) {
                    onSearchChange?.(trimmed);
                  } else {
                    onSearchChange?.("");
                    onClearAll?.();
                  }
                  setOpen(false);
                }
              }}
              data-testid={`filter-search-${label.toLowerCase().replace(/\s+/g, '-')}`}
            />
            <ChevronDown className="h-3 w-3 rotate-180" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border-none outline-none cursor-pointer"
          >
            {committedSearch ? (
              <>{emoji && <span>{emoji}</span>} {committedSearch}</>
            ) : (
              label
            )}
            <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      {open && createPortal(
        <div
          ref={panelRef}
          className="bg-popover border border-border rounded-lg shadow-lg p-2 max-h-[300px] overflow-y-auto"
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, display: 'inline-flex', flexDirection: 'column', maxWidth: '90vw', minWidth: '180px' }}
          onClick={handleItemClick}
        >
          {typeof children === "function" ? (children as (search: string) => React.ReactNode)(search) : children}
        </div>,
        document.body
      )}
    </div>
  );
}

export default function Filters({
  merchants,
  selectedCategories,
  onCategoryChange,
  selectedCountries,
  onCountryChange,
  selectedMadeIn,
  onMadeInChange,
  selectedProviders,
  onProviderChange,
  selectedPaymentMethods,
  onPaymentMethodChange,
  onClear,
  onCategorySearch,
  categorySearchQuery,
  sortBy = "default",
  onSortChange,
  ageVerified = false,
  onAgeVerify,
}: FiltersProps) {
  const { getCategoryWithEmoji } = useCategoryEmojis();
  const { getCountryWithFlag } = useCountryEmojis();
  const restrictedCategories = useRestrictedCategories();
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);

  const dynamicCategories = useMemo(() => {
    const catSet = new Set<string>();
    // Include all categories from the merchant list so they appear in the panel.
    merchants.forEach(m => m.categories.forEach(c => catSet.add(c)));
    // Always list every restricted category (even if no merchants visible yet)
    // so the locked 18+ section is always shown at the bottom.
    restrictedCategories.forEach(c => catSet.add(c));
    return Array.from(catSet)
      .filter(c => !restrictedCategories.has(c))   // remove restricted — shown separately below
      .sort((a, b) => {
        const aText = a.replace(/[^\p{L}\p{N}\s&,]/gu, '').trim();
        const bText = b.replace(/[^\p{L}\p{N}\s&,]/gu, '').trim();
        return aText.localeCompare(bText);
      });
  }, [merchants, restrictedCategories]);

  const dynamicCountries = useMemo(() => {
    const countrySet = new Set<string>();
    merchants.forEach(m => m.shippingCountries.forEach(c => countrySet.add(c)));
    return Array.from(countrySet).sort();
  }, [merchants]);

  const dynamicMadeIn = useMemo(() => {
    const madeInSet = new Set<string>();
    merchants.forEach(m => { if (m.countryMadeIn) madeInSet.add(m.countryMadeIn); });
    return Array.from(madeInSet).sort();
  }, [merchants]);

  const dynamicProviders = useMemo(() => {
    const provSet = new Set<string>();
    merchants.forEach(m => { if (m.paymentProvider) provSet.add(m.paymentProvider); });
    return Array.from(provSet).sort();
  }, [merchants]);

  const sortOptions = [
    { id: "default", label: "Default" },
    { id: "newest", label: "🆕 Newest" },
    { id: "discounted", label: "💰 Discounted" },
    { id: "hottest", label: "🔥 Hottest" },
  ];

  const currentSortLabel = sortOptions.find(o => o.id === sortBy)?.label || "Default";

  const hasActiveFilters = selectedCategories.length > 0 || selectedCountries.length > 0 || selectedMadeIn.length > 0 || selectedProviders.length > 0 || selectedPaymentMethods.length > 0 || sortBy !== "default";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-start gap-2 overflow-x-auto pb-1 scrollbar-none">
        <FilterDropdown label="🔍 Search" active={selectedCategories.length > 0 || !!categorySearchQuery} closeOnSelect={false} searchable searchPlaceholder="Type..." onSearchChange={onCategorySearch} onClearAll={onClear} committedSearch={categorySearchQuery}>
          {(search: string) => {
            const filtered = dynamicCategories.filter(cat => getCategoryWithEmoji(cat).toLowerCase().includes(search.toLowerCase()));
            return (
              <>
                {!search && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onCategoryChange("All"); }}
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
                    onClick={(e) => { e.stopPropagation(); onCategoryChange(cat); }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-muted transition-colors ${
                      selectedCategories.includes(cat) ? "bg-primary/10 text-primary font-medium" : ""
                    }`}
                  >
                    {getCategoryWithEmoji(cat)}
                  </button>
                ))}
                {filtered.length === 0 && !search && <p className="text-xs text-muted-foreground px-3 py-1.5">No matches</p>}

                {/* 18+ restricted categories — always shown at the bottom, locked until verified */}
                {(() => {
                  const filteredRestricted = Array.from(restrictedCategories).filter(cat =>
                    getCategoryWithEmoji(cat).toLowerCase().includes(search.toLowerCase())
                  );
                  if (filteredRestricted.length === 0) return null;
                  return (
                    <div className="border-t border-border/50 mt-1 pt-1">
                      <div className="flex items-center gap-1 px-3 py-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">🔞 18+ categories</span>
                        {!ageVerified && <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />}
                      </div>
                      {filteredRestricted.map((cat) => (
                        <button
                          key={cat}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!ageVerified) {
                              setPendingCategory(cat);
                              setShowAgeModal(true);
                            } else {
                              onCategoryChange(cat);
                            }
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5 ${
                            !ageVerified
                              ? "text-muted-foreground/60 hover:bg-muted/50"
                              : selectedCategories.includes(cat)
                                ? "bg-primary/10 text-primary font-medium hover:bg-muted"
                                : "hover:bg-muted"
                          }`}
                        >
                          {!ageVerified && <Lock className="h-3 w-3 shrink-0" />}
                          {getCategoryWithEmoji(cat)}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </>
            );
          }}
        </FilterDropdown>

        {/* Age verification modal */}
        <Dialog open={showAgeModal} onOpenChange={setShowAgeModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>🔞 Age verification required</DialogTitle>
              <DialogDescription>
                This section includes merchants in age-restricted categories. You must be 18 or older to view this content.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2 flex-row sm:flex-row justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setShowAgeModal(false); setPendingCategory(null); }}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onAgeVerify?.();
                  if (pendingCategory) onCategoryChange(pendingCategory);
                  setPendingCategory(null);
                  setShowAgeModal(false);
                }}
              >
                I confirm I'm 18+
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <FilterDropdown label="💵 Payment" active={selectedPaymentMethods.length > 0} closeOnSelect={false}>
          {[
            { id: "onchain", label: "On-Chain", icon: <BitcoinLogo className="h-3.5 w-3.5" spin /> },
            { id: "lightning", label: "Lightning", icon: <Zap className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> },
            { id: "cashu", label: "Cashu", icon: <span className="text-xs leading-none animate-nut-wobble inline-block">🥜</span> },
            { id: "liquid", label: "Liquid", icon: <span className="text-xs leading-none animate-liquid-drip inline-block">💧</span> },
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

        <FilterDropdown label="📦 Availability" active={selectedCountries.length > 0} closeOnSelect={false} searchable searchPlaceholder="Type...">
          {(search: string) => {
            const filtered = dynamicCountries.filter(c => c.toLowerCase().includes(search.toLowerCase()));
            return (
              <>
                {!search && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onCountryChange("All"); }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-muted transition-colors ${
                      selectedCountries.length === 0 ? "bg-primary/10 text-primary font-medium" : ""
                    }`}
                  >
                    🌐 Anywhere
                  </button>
                )}
                {filtered.map((country) => (
                  <button
                    key={country}
                    onClick={(e) => { e.stopPropagation(); onCountryChange(country); }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-muted transition-colors ${
                      selectedCountries.includes(country) ? "bg-primary/10 text-primary font-medium" : ""
                    }`}
                  >
                    {getCountryWithFlag(country)}
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-xs text-muted-foreground px-3 py-1.5">No matches</p>}
              </>
            );
          }}
        </FilterDropdown>

        <FilterDropdown label="👷 Made in" active={selectedMadeIn.length > 0} closeOnSelect={false} searchable searchPlaceholder="Type...">
          {(search: string) => {
            const filtered = dynamicMadeIn.filter(c => c.toLowerCase().includes(search.toLowerCase()));
            return (
              <>
                {!search && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onMadeInChange("All"); }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-muted transition-colors ${
                      selectedMadeIn.length === 0 ? "bg-primary/10 text-primary font-medium" : ""
                    }`}
                  >
                    🌐 Anywhere
                  </button>
                )}
                {filtered.map((country) => (
                  <button
                    key={country}
                    onClick={(e) => { e.stopPropagation(); onMadeInChange(country); }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-muted transition-colors ${
                      selectedMadeIn.includes(country) ? "bg-primary/10 text-primary font-medium" : ""
                    }`}
                  >
                    {getCountryWithFlag(country)}
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-xs text-muted-foreground px-3 py-1.5">No matches</p>}
              </>
            );
          }}
        </FilterDropdown>

        <FilterDropdown label="🔌 Provider" active={selectedProviders.length > 0} closeOnSelect={false} searchable searchPlaceholder="Type...">
          {(search: string) => {
            const filtered = dynamicProviders.filter(p => p.toLowerCase().includes(search.toLowerCase()));
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

        <FilterDropdown label="🦴 Sort by" active={sortBy !== "default"}>
          {sortOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onSortChange?.(option.id)}
              className={`w-full text-left px-3 py-1.5 rounded-md text-sm hover:bg-muted transition-colors ${
                sortBy === option.id ? "bg-primary/10 text-primary font-medium" : ""
              }`}
              data-testid={`filter-sort-${option.id}`}
            >
              {option.label}
            </button>
          ))}
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
              {getCategoryWithEmoji(cat)} <X className="h-2.5 w-2.5" />
            </Badge>
          ))}
          {selectedPaymentMethods.map((m) => (
            <Badge key={m} variant="secondary" className="text-xs py-0.5 px-2 gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => onPaymentMethodChange(m)}>
              {m === "lightning" ? "⚡ Lightning" : m === "onchain" ? "₿ On-Chain" : m === "cashu" ? "🥜 Cashu" : "💧 Liquid"} <X className="h-2.5 w-2.5" />
            </Badge>
          ))}
          {selectedCountries.map((c) => (
            <Badge key={`ship-${c}`} variant="secondary" className="text-xs py-0.5 px-2 gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => onCountryChange(c)}>
              Availability: {getCountryWithFlag(c)} <X className="h-2.5 w-2.5" />
            </Badge>
          ))}
          {selectedMadeIn.map((c) => (
            <Badge key={`made-${c}`} variant="secondary" className="text-xs py-0.5 px-2 gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => onMadeInChange(c)}>
              Made in: {getCountryWithFlag(c)} <X className="h-2.5 w-2.5" />
            </Badge>
          ))}
          {selectedProviders.map((p) => (
            <Badge key={p} variant="secondary" className="text-xs py-0.5 px-2 gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => onProviderChange(p)}>
              {p} <X className="h-2.5 w-2.5" />
            </Badge>
          ))}
          {sortBy !== "default" && (
            <Badge variant="secondary" className="text-xs py-0.5 px-2 gap-1 cursor-pointer hover:bg-destructive/10" onClick={() => onSortChange?.("default")}>
              Sort: {currentSortLabel} <X className="h-2.5 w-2.5" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
