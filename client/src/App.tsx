import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import Lists from "@/pages/lists";
import Favourites from "@/pages/favourites";
import { NostrProvider } from "@/context/NostrContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/merchant/:slug" component={Home} />
      <Route path="/favourites" component={Favourites} />
      <Route path="/lists" component={Lists} />
      <Route path="/x7k2m9p4r1qn" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <TooltipProvider>
          <NostrProvider>
            <Toaster />
            <Router />
          </NostrProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
