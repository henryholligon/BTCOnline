import { Switch, Route } from "wouter";
import ResetPassword from "@/pages/reset-password";
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
import Discover from "@/pages/discover";
import DiscoverList from "@/pages/discover-list";
import Account from "@/pages/account";
import Profile from "@/pages/profile";
import Dashboard from "@/pages/dashboard";
import Leaderboard from "@/pages/leaderboard";
import FAQ from "@/pages/faq";
import { NostrProvider } from "@/context/NostrContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/merchant/:slug" component={Home} />
      <Route path="/favourites" component={Favourites} />
      <Route path="/lists" component={Lists} />
      <Route path="/discover" component={Discover} />
      <Route path="/discover/:npub/:dTag" component={DiscoverList} />
      <Route path="/account" component={Account} />
      <Route path="/profile/:npub" component={Profile} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/faq" component={FAQ} />
      <Route path="/x7k2m9p4r1qn" component={Admin} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
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
