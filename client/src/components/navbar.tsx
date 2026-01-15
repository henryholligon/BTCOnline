import { Link } from "wouter";
import { Search, Menu, Zap, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ostrichImg from "@assets/image_1768456571275.png";
import Filters from "./filters";

interface NavbarProps {
  onSearch: (query: string) => void;
  filtersSlot?: React.ReactNode; // For mobile menu
}

export default function Navbar({ onSearch, filtersSlot }: NavbarProps) {
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

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

        <Link href="/" className="mr-6 flex items-center space-x-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold font-display text-xl">
            ₿
          </div>
          <span className="hidden font-display font-bold sm:inline-block text-xl tracking-tight">
            btconline
          </span>
        </Link>

        <div className="flex flex-1 items-center space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search merchants..."
                className="h-9 w-full rounded-md border border-input bg-muted/50 pl-8 pr-4 text-sm shadow-none transition-colors focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:w-[300px] lg:w-[400px]"
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="ml-auto flex items-center space-x-2">
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
                <img src={ostrichImg} alt="" className="h-7 w-7 object-contain brightness-0 invert" />
                Connect Nostr
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
