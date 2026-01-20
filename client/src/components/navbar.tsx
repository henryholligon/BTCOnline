import { Link } from "wouter";
import { Search, Menu, Zap, User, LogOut, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "next-themes";
import ostrichImg from "@assets/image_1768456571275.png";
import btcLogo from "/assets/main-logo.png";
import Filters from "./filters";

interface NavbarProps {
  onSearch: (query: string) => void;
  filtersSlot?: React.ReactNode; // For mobile menu
}

export default function Navbar({ onSearch, filtersSlot }: NavbarProps) {
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const handleConnect = () => {
    // Mock Nostr connection
    toast({
      title: "Connecting to Nostr...",
      duration: 1000,
    });
    
    setTimeout(() => {
      setIsConnected(true);
      toast({
        title: "Connected",
        description: "Logged in as npub1...8x9z",
        variant: "default",
      });
    }, 1500);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast({
      title: "Disconnected",
      description: "You have signed out.",
    });
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
          <Button asChild variant="ghost" className="hidden md:flex text-sm font-medium hover:text-primary transition-colors h-9 px-4">
            <a href="https://btcmap.org" target="_blank" rel="noopener noreferrer">
              In-person
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="mr-2"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="hidden text-xs text-muted-foreground sm:inline-block font-mono">
                npub1...8x9z
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleDisconnect}
                className="hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </Button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 border border-border"></div>
            </div>
          ) : (
            <Button onClick={handleConnect} className="font-medium bg-[#A855F7] hover:bg-[#9333EA] text-white border-none gap-2">
              <img src={ostrichImg} alt="" className="h-5 w-5 object-contain brightness-0 invert" />
              Connect Nostr
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
