import { Link } from "wouter";
import { Search, Menu, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "next-themes";

interface NavbarProps {
  onSearch: (query: string) => void;
  filtersSlot?: React.ReactNode; // For mobile menu
}

export default function Navbar({ onSearch, filtersSlot }: NavbarProps) {
  const { theme, setTheme } = useTheme();

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

        </div>
      </div>
    </nav>
  );
}
