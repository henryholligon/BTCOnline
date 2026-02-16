import { Link } from "wouter";
import { Sun, Moon, Plus, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@/lib/mock-data";

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

  const handleSubmitMerchant = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddOpen(false);
    toast({
      title: "Merchant Submitted",
      description: "Thank you! Your submission will be reviewed.",
    });
    setBusinessName("");
    setBusinessUrl("");
    setBusinessCategory("");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4">
        <div className="flex items-center justify-end py-1.5 gap-2 border-b border-border/20">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="font-medium bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-8 text-xs px-3">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Merchant</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Merchant</DialogTitle>
                <DialogDescription>
                  Submit a business that accepts Bitcoin to be added to the directory.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitMerchant} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    placeholder="Enter business name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                    data-testid="input-business-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessUrl">Website URL</Label>
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
                <DialogFooter>
                  <Button type="submit" data-testid="button-submit-merchant">Submit Merchant</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button asChild variant="ghost" className="text-xs font-medium hover:text-primary transition-colors h-8 px-3">
            <a href="https://btcmap.org" target="_blank" rel="noopener noreferrer">
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
