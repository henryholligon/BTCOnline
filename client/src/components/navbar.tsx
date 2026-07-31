import { Link } from "wouter";
import { Sun, Moon, Plus, ChevronDown, Check, Copy, Eye, EyeOff } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNostr } from "@/context/NostrContext";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { npubEncode, nsecEncode } from "nostr-tools/nip19";
import { decrypt as ncryptsecDecrypt } from "nostr-tools/nip49";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import darkBrandLogo from "@assets/BTC_Online_Logo_Dark_1785284474123.png";
import lightBrandLogo from "@assets/BTC_Online_Logo_Light_1785284567379.png";
import { useToast } from "@/hooks/use-toast";
import { useCategoryEmojis } from "@/hooks/use-category-emojis";
import { useCountryEmojis } from "@/hooks/use-country-emojis";
import { useQuery } from "@tanstack/react-query";
import "altcha";

interface NavbarProps {
  onSearch: (query: string) => void;
  filtersSlot?: React.ReactNode;
  onClearFilters?: () => void;
}

const PAYMENT_OPTIONS = [
  { value: "On-chain", label: "₿ On-chain" },
  { value: "Lightning", label: "⚡ Lightning" },
  { value: "Cashu", label: "🥜 Cashu" },
  { value: "Liquid", label: "💧 Liquid" },
];

const PROVIDER_OPTIONS = [
  "BTCPay Server", "Bitcashier", "CoinCorner", "Coingate", "CoinsPaid",
  "NOWPayments", "Open Node", "Self-hosted", "Speed", "Strike",
  "The Giving Block", "Triple A", "Zaprite",
].map(p => ({ value: p, label: p }));

function useOutsideClick(ref: React.RefObject<HTMLElement>, open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);
}

function MultiSelect({ options, selected, onChange, placeholder, testId }: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (vals: string[]) => void;
  placeholder: string;
  testId: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useOutsideClick(ref, open, () => setOpen(false));

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
    else setSearch("");
  }, [open]);

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };

  const label = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? options.find(o => o.value === selected[0])?.label ?? selected[0]
      : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative" data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        data-testid={`${testId}-trigger`}
      >
        <span className={selected.length === 0 ? "text-muted-foreground" : ""}>{label}</span>
        <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          <div className="border-b border-border px-2 py-1.5">
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-52 overflow-auto p-1">
            {filtered.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">No results</p>
            )}
            {filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                data-testid={`${testId}-option-${opt.value}`}
              >
                <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected.includes(opt.value) ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>
                  {selected.includes(opt.value) && <Check className="h-3 w-3" />}
                </div>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchableSelect({ options, value, onChange, placeholder, testId }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useOutsideClick(ref, open, () => setOpen(false));

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
    else setSearch("");
  }, [open]);

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selectedLabel = options.find(o => o.value === value)?.label ?? "";

  return (
    <div ref={ref} className="relative" data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span className={!value ? "text-muted-foreground" : ""}>{selectedLabel || placeholder}</span>
        <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          <div className="border-b border-border px-2 py-1.5">
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-52 overflow-auto p-1">
            {value && (
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                Clear selection
              </button>
            )}
            {filtered.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">No results</p>
            )}
            {filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); setSearch(""); }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${value === opt.value ? "border-primary bg-primary text-primary-foreground" : "border-transparent"}`}>
                  {value === opt.value && <Check className="h-3 w-3" />}
                </div>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KeyCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="shrink-0 h-6 w-6 inline-flex items-center justify-center rounded hover:bg-muted transition-colors"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
    </button>
  );
}

function MyKeysModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, getSecretKey, sessionNcryptsec } = useNostr();
  const [showNsec, setShowNsec] = useState(false);
  const [isNsecVerified, setIsNsecVerified] = useState(false);
  const [promptPassword, setPromptPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const sk = open ? getSecretKey() : null;
  const npub = user ? npubEncode(user.pubkey) : "";
  const nsec = sk ? nsecEncode(sk) : "";
  const needsPasswordGate = !!sessionNcryptsec;

  function handleClose() {
    setShowNsec(false);
    setIsNsecVerified(false);
    setPromptPassword(false);
    setPasswordInput("");
    setPasswordError("");
    onClose();
  }

  function handleRevealClick() {
    if (showNsec) {
      setShowNsec(false);
      return;
    }
    if (needsPasswordGate && !isNsecVerified) {
      setPromptPassword(true);
      setPasswordInput("");
      setPasswordError("");
    } else {
      setShowNsec(true);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setPasswordError("");
    try {
      if (sessionNcryptsec) {
        ncryptsecDecrypt(sessionNcryptsec, passwordInput);
      }
      setIsNsecVerified(true);
      setShowNsec(true);
      setPromptPassword(false);
      setPasswordInput("");
    } catch {
      setPasswordError("Incorrect password. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md" data-testid="modal-my-keys">
        <DialogHeader>
          <DialogTitle>🔑 My Nostr Keys</DialogTitle>
          <DialogDescription>
            Your Nostr identity. The npub is public — share it freely. Keep the nsec secret.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Public key (npub) — safe to share</Label>
            <div className="flex items-center gap-1 bg-muted rounded px-2.5 py-1.5">
              <code className="text-xs break-all flex-1 select-all">{npub}</code>
              <KeyCopyButton text={npub} />
            </div>
          </div>
          {nsec ? (
            <div className="space-y-1">
              <Label className="text-xs">Private key (nsec) — keep secret</Label>
              <div className="flex items-center gap-1 bg-muted rounded px-2.5 py-1.5">
                <code className="text-xs break-all flex-1 select-all">
                  {showNsec ? nsec : "•".repeat(Math.min(nsec.length, 48))}
                </code>
                <button
                  type="button"
                  onClick={handleRevealClick}
                  className="shrink-0 h-6 w-6 flex items-center justify-center rounded hover:bg-background transition-colors"
                  data-testid="button-reveal-nsec-keys"
                >
                  {showNsec ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
                {showNsec && <KeyCopyButton text={nsec} />}
              </div>
              {promptPassword && !showNsec && (
                <form onSubmit={handlePasswordSubmit} className="mt-2 space-y-2" data-testid="form-nsec-password">
                  <p className="text-xs text-muted-foreground">Enter your password to reveal the private key.</p>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Your password"
                      value={passwordInput}
                      onChange={e => { setPasswordInput(e.target.value); setPasswordError(""); }}
                      className="h-8 text-xs"
                      autoFocus
                      data-testid="input-nsec-password"
                    />
                    <Button type="submit" size="sm" className="h-8 text-xs px-3 shrink-0" disabled={verifying || !passwordInput} data-testid="button-confirm-nsec-password">
                      {verifying ? "…" : "Confirm"}
                    </Button>
                  </div>
                  {passwordError && (
                    <p className="text-xs text-destructive" data-testid="text-nsec-password-error">{passwordError}</p>
                  )}
                </form>
              )}
              <p className="text-xs text-muted-foreground">
                Import this into <a href="https://getalby.com" target="_blank" rel="noopener noreferrer" className="underline">Alby</a>, Primal, or any Nostr client.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Private key is not available in this session (extension or bunker login).
            </p>
          )}
          {sessionNcryptsec && (
            <div className="space-y-1">
              <Label className="text-xs">Encrypted backup (ncryptsec) — password-protected</Label>
              <div className="flex items-center gap-1 bg-muted rounded px-2.5 py-1.5">
                <code className="text-xs break-all flex-1 select-all">{sessionNcryptsec}</code>
                <KeyCopyButton text={sessionNcryptsec} />
              </div>
              <p className="text-xs text-muted-foreground">
                Paste into <a href="https://getalby.com" target="_blank" rel="noopener noreferrer" className="underline">Alby</a>, Primal, or the login screen's ncryptsec tab to restore your session.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NostrUserButton() {
  const { user, logout, openLoginModal, loginMethod } = useNostr();
  const [open, setOpen] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!user) {
    return (
      <button
        onClick={openLoginModal}
        className="h-8 px-3 text-xs font-medium rounded-md border-2 border-gray-300 dark:border-gray-600 hover:text-primary transition-colors flex items-center gap-1.5"
        data-testid="button-nostr-signin"
      >
        Sign in
      </button>
    );
  }

  return (
    <>
      <MyKeysModal open={keysOpen} onClose={() => setKeysOpen(false)} />
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 h-8 px-2 rounded-md border border-border hover:bg-muted transition-colors"
          data-testid="button-nostr-user-menu"
        >
          {user.picture ? (
            <img src={user.picture} alt={user.displayName} className="h-6 w-6 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {user.displayName[0]?.toUpperCase() || "⚡"}
            </div>
          )}
          <span className="text-xs font-medium max-w-[80px] truncate hidden sm:block">{user.displayName}</span>
          <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg min-w-[140px] p-1 z-50">
            <Link
              href={`/profile/${user?.npub}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors"
              data-testid="link-my-profile"
            >
              👤 My Profile
            </Link>
            <Link
              href="/favourites"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors"
              data-testid="link-my-favourites"
            >
              ♡ My Likes
            </Link>
            <Link
              href="/lists"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors"
              data-testid="link-my-lists"
            >
              🔖 My Lists
            </Link>
            {loginMethod === "generated" && (
              <button
                onClick={() => { setKeysOpen(true); setOpen(false); }}
                className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors"
                data-testid="button-my-keys"
              >
                🔑 My Keys
              </button>
            )}
            <div className="border-t border-border/50 my-1" />
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors"
              data-testid="link-account-settings"
            >
              ⚙️ Account Settings
            </Link>
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors text-muted-foreground"
              data-testid="button-nostr-signout"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function Navbar({ onSearch, filtersSlot, onClearFilters }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { user, openLoginModal } = useNostr();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessUrl, setBusinessUrl] = useState("");
  const [businessCategories, setBusinessCategories] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [publicContact, setPublicContact] = useState("");
  const [shippingCountries, setShippingCountries] = useState<string[]>([]);
  const [countryMadeIn, setCountryMadeIn] = useState("");
  const [paymentProvider, setPaymentProvider] = useState("");
  const [submitterNpub, setSubmitterNpub] = useState("");
  const [altchaVerified, setAltchaVerified] = useState(false);
  const altchaRef = useRef<HTMLElement>(null);
  const { getCategoryWithEmoji } = useCategoryEmojis();
  const { getCountryWithFlag } = useCountryEmojis();
  const { data: dynamicCategories = [] } = useQuery<string[]>({ queryKey: ["/api/categories"] });
  const { data: dynamicCountries = [] } = useQuery<string[]>({ queryKey: ["/api/countries"] });
  const logoRef = useRef<HTMLButtonElement>(null);
  const logoPanelRef = useRef<HTMLDivElement>(null);
  const [logoPos, setLogoPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!logoMenuOpen) return;
    if (logoRef.current) {
      const rect = logoRef.current.getBoundingClientRect();
      setLogoPos({ top: rect.bottom + 8, left: rect.left });
    }
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (logoRef.current?.contains(target) || logoPanelRef.current?.contains(target)) return;
      setLogoMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [logoMenuOpen]);

  // Auto-fill submitter npub from the logged-in session when the form opens.
  useEffect(() => {
    if (isAddOpen && user?.npub) {
      setSubmitterNpub(user.npub);
    }
  }, [isAddOpen, user?.npub]);

  useEffect(() => {
    const widget = altchaRef.current;
    if (!widget) return;
    const handleStateChange = (ev: Event) => {
      const detail = (ev as CustomEvent).detail;
      setAltchaVerified(detail?.state === "verified");
    };
    widget.addEventListener("statechange", handleStateChange);
    return () => widget.removeEventListener("statechange", handleStateChange);
  }, [isAddOpen]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!altchaVerified) {
      toast({ title: "Captcha Required", description: "Please complete the captcha verification." });
      return;
    }

    // Grab the altcha payload from the widget
    const widget = altchaRef.current as any;
    const altchaPayload = widget?.value ?? widget?.getAttribute?.("value") ?? null;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/submit-merchant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          altcha: altchaPayload,
          businessName,
          businessUrl,
          businessCategories,
          paymentMethods,
          shippingCountries,
          countryMadeIn,
          paymentProvider,
          notes,
          dataSource,
          publicContact,
          submitterNpub,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Submission Failed", description: data.message ?? "Please try again.", variant: "destructive" });
        return;
      }

      setIsAddOpen(false);
      toast({
        title: "Submission received! 🎉",
        description: (
          <span>
            Your submission is now a{" "}
            <a href={data.issueUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">
              public GitHub issue
            </a>
            . We'll review it shortly.
          </span>
        ),
      });
      setBusinessName("");
      setBusinessUrl("");
      setBusinessCategories([]);
      setPaymentMethods([]);
      setShippingCountries([]);
      setCountryMadeIn("");
      setPaymentProvider("");
      setNotes("");
      setDataSource("");
      setPublicContact("");
      setSubmitterNpub("");
      setAltchaVerified(false);
    } catch {
      toast({ title: "Network Error", description: "Could not reach the server. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = dynamicCategories.map(c => ({ value: c, label: getCategoryWithEmoji(c) }));
  const countryOptions = dynamicCountries.map(c => ({ value: c, label: getCountryWithFlag(c) }));

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-end py-2 gap-2 border-b border-border/20">
          <Button asChild className="font-medium bg-green-600 hover:bg-green-700 text-white gap-2 h-10 text-sm px-4">
            <a href="https://btcmap.org/map" target="_blank" rel="noopener noreferrer">
              In-person
            </a>
          </Button>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="font-medium bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-10 text-sm px-4">
                <Plus className="h-4 w-4" />
                Add Merchant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Accept Bitcoin? Get listed.</DialogTitle>
                <DialogDescription>
                  Only the website URL is required — fill in as much or as little as you know.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitMerchant} className="space-y-4 py-2">

                {/* Merchant Name */}
                <div className="space-y-2">
                  <Label htmlFor="businessName">Merchant Name <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <Input
                    id="businessName"
                    placeholder="Enter merchant name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    data-testid="input-business-name"
                  />
                </div>

                {/* Website — only required field */}
                <div className="space-y-2">
                  <Label htmlFor="businessUrl">
                    Website <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="businessUrl"
                    type="url"
                    placeholder="https://example.com"
                    value={businessUrl}
                    onChange={(e) => setBusinessUrl(e.target.value)}
                    required
                    data-testid="input-business-url"
                  />
                </div>

                {/* Submitter identity — used for leaderboard credit */}
                <div className="space-y-2">
                  <Label htmlFor="submitterNpub">
                    Submitting as <span className="text-xs text-muted-foreground">(recommended)</span>
                  </Label>
                  {user ? (
                    <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2">
                      {user.picture && (
                        <img src={user.picture} alt={user.displayName} className="h-5 w-5 rounded-full object-cover shrink-0" />
                      )}
                      <span className="text-sm font-medium truncate flex-1">{user.displayName}</span>
                      <code className="text-[10px] text-muted-foreground truncate max-w-[120px]">{user.npub?.slice(0, 16)}…</code>
                    </div>
                  ) : (
                    <>
                      <Input
                        id="submitterNpub"
                        placeholder="Email or npub…"
                        value={submitterNpub}
                        onChange={(e) => setSubmitterNpub(e.target.value)}
                        data-testid="input-submitter-npub"
                      />
                      {!submitterNpub.trim() && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <span>⚠️</span>
                          Without your email or npub you won't appear on the leaderboard.{" "}
                          <button type="button" onClick={openLoginModal} className="underline hover:text-amber-700 dark:hover:text-amber-300">
                            Sign in to auto-fill.
                          </button>
                        </p>
                      )}
                      {submitterNpub.trim() && (
                        <p className="text-xs text-muted-foreground">
                          Your Nostr public key — used for leaderboard credit.
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Category <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <MultiSelect
                    options={categoryOptions}
                    selected={businessCategories}
                    onChange={setBusinessCategories}
                    placeholder="Search and select categories…"
                    testId="select-business-category"
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label>Payment Method <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <MultiSelect
                    options={PAYMENT_OPTIONS}
                    selected={paymentMethods}
                    onChange={setPaymentMethods}
                    placeholder="Select payment methods…"
                    testId="select-payment-method"
                  />
                </div>

                {/* Ships to (Availability) */}
                <div className="space-y-2">
                  <Label>Ships to <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <MultiSelect
                    options={countryOptions}
                    selected={shippingCountries}
                    onChange={setShippingCountries}
                    placeholder="Search countries…"
                    testId="select-shipping-countries"
                  />
                </div>

                {/* Made in + Provider on one row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Made in <span className="text-xs text-muted-foreground">(optional)</span></Label>
                    <SearchableSelect
                      options={countryOptions}
                      value={countryMadeIn}
                      onChange={setCountryMadeIn}
                      placeholder="Country…"
                      testId="select-country-made-in"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provider <span className="text-xs text-muted-foreground">(optional)</span></Label>
                    <SearchableSelect
                      options={PROVIDER_OPTIONS}
                      value={paymentProvider}
                      onChange={setPaymentProvider}
                      placeholder="Provider…"
                      testId="select-payment-provider"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <textarea
                    id="notes"
                    placeholder="Any additional information about this merchant…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    data-testid="input-notes"
                  />
                </div>

                {/* Data Source */}
                <div className="space-y-2">
                  <Label>How do you know this merchant? <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <Select value={dataSource} onValueChange={setDataSource}>
                    <SelectTrigger data-testid="select-data-source">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">I am the business owner</SelectItem>
                      <SelectItem value="customer">I visited as a customer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Public Contact */}
                <div className="space-y-2">
                  <Label htmlFor="publicContact">Follow-up contact <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <Input
                    id="publicContact"
                    placeholder="Email for follow-up questions"
                    value={publicContact}
                    onChange={(e) => setPublicContact(e.target.value)}
                    data-testid="input-public-contact"
                  />
                  <p className="text-xs text-muted-foreground">
                    Not published. Only used if we need to follow up.
                  </p>
                </div>

                <div className="space-y-2">
                  {/* @ts-ignore */}
                  <altcha-widget
                    ref={altchaRef}
                    challengeurl="/api/altcha-challenge"
                    style={{ '--altcha-max-width': '100%' } as React.CSSProperties}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-submit-merchant">
                  {isSubmitting ? "Submitting…" : "Submit Merchant"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <NostrUserButton />
        </div>

        <div className="flex items-center py-2 gap-3">
          <button
            ref={logoRef}
            type="button"
            onClick={() => setLogoMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 shrink-0 hover:opacity-80 transition-opacity"
          >
            <img
              src={lightBrandLogo}
              alt="btconline"
              className="h-10 w-10 object-contain dark:hidden mix-blend-multiply"
            />
            <img
              src={darkBrandLogo}
              alt="btconline"
              className="h-10 w-10 object-contain hidden dark:block mix-blend-screen"
            />
            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${logoMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {logoMenuOpen && createPortal(
            <div
              ref={logoPanelRef}
              className="fixed bg-popover border border-border rounded-lg shadow-lg min-w-[180px] p-2"
              style={{ top: logoPos.top, left: logoPos.left, zIndex: 9999 }}
            >
              <Link
                href="/"
                onClick={() => { setLogoMenuOpen(false); onClearFilters?.(); }}
                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors flex items-center gap-2"
              >
                Home
              </Link>
              <button
                onClick={() => {
                  setTheme(theme === "dark" ? "light" : "dark");
                  setLogoMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors flex items-center gap-2"
                data-testid="button-toggle-theme"
              >
                {theme === "dark" ? (
                  <><Sun className="h-4 w-4" /> Light Mode</>
                ) : (
                  <><Moon className="h-4 w-4" /> Dark Mode</>
                )}
              </button>
              <Link
                href="/discover"
                onClick={() => setLogoMenuOpen(false)}
                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors flex items-center gap-2"
              >
                Merchant Packs
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setLogoMenuOpen(false)}
                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors flex items-center gap-2"
              >
                Merchant dashboard
              </Link>
              <Link
                href="/leaderboard"
                onClick={() => setLogoMenuOpen(false)}
                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors flex items-center gap-2"
              >
                User leaderboard
              </Link>
              <Link
                href="/faq"
                onClick={() => setLogoMenuOpen(false)}
                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors flex items-center gap-2"
                data-testid="link-faq"
              >
                FAQ
              </Link>
            </div>,
            document.body
          )}

          {filtersSlot && (
            <div className="flex-1 min-w-0">
              {filtersSlot}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
