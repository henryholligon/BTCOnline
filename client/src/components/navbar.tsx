import { Link } from "wouter";
import { Sun, Moon, Plus, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@/lib/mock-data";
import "altcha";

interface NavbarProps {
  onSearch: (query: string) => void;
  filtersSlot?: React.ReactNode;
}

export default function Navbar({ onSearch, filtersSlot }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessUrl, setBusinessUrl] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [publicContact, setPublicContact] = useState("");
  const [altchaVerified, setAltchaVerified] = useState(false);
  const altchaRef = useRef<HTMLElement>(null);
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

  const handleSubmitMerchant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!altchaVerified) {
      toast({ title: "Captcha Required", description: "Please complete the captcha verification." });
      return;
    }
    setIsAddOpen(false);
    toast({
      title: "Merchant Submitted",
      description: "Thank you! Your submission will be reviewed.",
    });
    setBusinessName("");
    setBusinessUrl("");
    setBusinessCategory("");
    setPaymentMethod("");
    setNotes("");
    setDataSource("");
    setPublicContact("");
    setAltchaVerified(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-end py-1.5 gap-2 border-b border-border/20">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="font-medium bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-8 text-xs px-3">
                <Plus className="h-3.5 w-3.5" />
                Add Merchant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Accept Bitcoin? Get listed.</DialogTitle>
                <DialogDescription>
                  Fill out the form below and we will review your submission.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitMerchant} className="space-y-5 py-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Merchant Name</Label>
                  <Input
                    id="businessName"
                    placeholder="Enter merchant name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    data-testid="input-business-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessCategory">Category</Label>
                  <Select value={businessCategory} onValueChange={setBusinessCategory} required>
                    <SelectTrigger data-testid="select-business-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger data-testid="select-payment-method">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onchain">₿ On-chain</SelectItem>
                      <SelectItem value="lightning">⚡ Lightning</SelectItem>
                      <SelectItem value="both">₿ On-chain + ⚡ Lightning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessUrl">Website</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <textarea
                    id="notes"
                    placeholder="Any additional information about this merchant..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    data-testid="input-notes"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data Source</Label>
                  <Select value={dataSource} onValueChange={setDataSource}>
                    <SelectTrigger data-testid="select-data-source">
                      <SelectValue placeholder="Please select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">I am the business owner</SelectItem>
                      <SelectItem value="customer">I visited as a customer</SelectItem>
                      <SelectItem value="other">Other method</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publicContact">Public Contact (optional)</Label>
                  <Input
                    id="publicContact"
                    placeholder="Email or Nostr npub"
                    value={publicContact}
                    onChange={(e) => setPublicContact(e.target.value)}
                    data-testid="input-public-contact"
                  />
                  <p className="text-xs text-muted-foreground">
                    If we have any follow-up questions we will contact you to add this merchant successfully.
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

                <Button type="submit" className="w-full" data-testid="button-submit-merchant">
                  Submit Merchant
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button asChild variant="outline" className="text-xs font-medium hover:text-primary transition-colors h-8 px-3 border-gray-300 dark:border-gray-600 border-2">
            <a href="https://btcmap.org/map" target="_blank" rel="noopener noreferrer">
              In-person
            </a>
          </Button>
        </div>

        <div className="flex items-center py-2 gap-3">
          <button
            ref={logoRef}
            type="button"
            onClick={() => setLogoMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 shrink-0 hover:opacity-80 transition-opacity"
          >
            <img
              src="/assets/main-logo.png"
              alt="btconline"
              className="h-9 w-9 object-contain dark:hidden mix-blend-multiply"
            />
            <img
              src="/assets/main-logo-dark.png"
              alt="btconline"
              className="h-9 w-9 object-contain hidden dark:block mix-blend-screen"
            />
            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${logoMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {logoMenuOpen && createPortal(
            <div
              ref={logoPanelRef}
              className="fixed bg-popover border border-border rounded-lg shadow-lg min-w-[180px] p-2"
              style={{ top: logoPos.top, left: logoPos.left, zIndex: 9999 }}
            >
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
                href="/"
                onClick={() => setLogoMenuOpen(false)}
                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors flex items-center gap-2"
              >
                Home
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
