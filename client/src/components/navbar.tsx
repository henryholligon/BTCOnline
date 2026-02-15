import { Link } from "wouter";
import { Search, Menu, Sun, Moon, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  const [businessName, setBusinessName] = useState("");
  const [businessUrl, setBusinessUrl] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");

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
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 glass">
      <div className="container flex h-14 items-center px-4 gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden shrink-0 h-8 w-8">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle filters</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[360px]">
            <div className="py-6">
              <h2 className="mb-6 text-lg font-semibold">Filters</h2>
              {filtersSlot}
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex items-center shrink-0">
          <img 
            src="/assets/main-logo.png" 
            alt="btconline" 
            className="h-8 w-8 object-contain dark:hidden" 
          />
          <img 
            src="/assets/main-logo-dark.png" 
            alt="btconline" 
            className="h-8 w-8 object-contain hidden dark:block" 
          />
        </Link>

        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              type="search"
              placeholder="Search merchants..."
              className="h-8 w-full rounded-lg border-0 bg-secondary/80 pl-9 pr-4 text-sm shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-ring focus-visible:bg-background"
              onChange={(e) => onSearch(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-lg bg-foreground text-background hover:bg-foreground/90 dark:bg-white dark:text-black dark:hover:bg-white/90 font-medium text-[13px] h-8 px-3 gap-1.5 shadow-sm" data-testid="button-add-merchant">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
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
                    className="rounded-lg"
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
                    className="rounded-lg"
                    data-testid="input-business-url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessCategory">Category</Label>
                  <Select value={businessCategory} onValueChange={setBusinessCategory} required>
                    <SelectTrigger className="rounded-lg" data-testid="select-business-category">
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
                  <Button type="submit" className="rounded-lg" data-testid="button-submit-merchant">Submit Merchant</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button asChild variant="ghost" size="sm" className="hidden md:flex text-[13px] font-medium text-muted-foreground hover:text-foreground h-8 px-3 rounded-lg">
            <a href="https://btcmap.org" target="_blank" rel="noopener noreferrer">
              In-person
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
