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
  filtersSlot?: React.ReactNode; // For mobile menu
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
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle filters</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <div className="py-4">
              <h2 className="mb-4 text-lg font-semibold tracking-tight">Filters</h2>
              {filtersSlot}
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/" className="mr-6 flex items-center">
          <img 
            src="/assets/main-logo.png" 
            alt="btconline" 
            className="h-10 w-10 object-contain dark:hidden mix-blend-multiply" 
          />
          <img 
            src="/assets/main-logo-dark.png" 
            alt="btconline" 
            className="h-10 w-10 object-contain hidden dark:block mix-blend-screen" 
          />
        </Link>

        <div className="flex-1 flex items-center ml-4">
          <div className="relative w-full max-w-[400px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search merchants..."
              className="h-9 w-full rounded-md border border-input bg-muted/50 pl-8 pr-4 text-sm shadow-none transition-colors focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="font-medium bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Plus className="h-4 w-4" />
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

          <Button asChild variant="ghost" className="hidden md:flex text-sm font-medium hover:text-primary transition-colors h-9 px-4">
            <a href="https://btcmap.org" target="_blank" rel="noopener noreferrer">
              In-person
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
