import { Link } from "wouter";
import { Search, Sun, Moon, Plus } from "lucide-react";
import { useState } from "react";
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
      <div className="container flex items-center px-4 py-2 gap-3">
        <Link href="/" className="flex items-center shrink-0">
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
        </Link>

        {filtersSlot && (
          <div className="flex-1 min-w-0">
            {filtersSlot}
          </div>
        )}

        <div className="flex items-center space-x-2 shrink-0">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="font-medium bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-9">
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

          <Button asChild variant="ghost" className="hidden md:flex text-sm font-medium hover:text-primary transition-colors h-9 px-3">
            <a href="https://btcmap.org" target="_blank" rel="noopener noreferrer">
              In-person
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
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
