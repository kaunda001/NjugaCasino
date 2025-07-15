import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import NjugaRoom from "@/pages/NjugaRoom";
import ShanshaRoom from "@/pages/ShanshaRoom";
import ChinshingwaRoom from "@/pages/ChinshingwaRoom";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

function AuthRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && location === '/') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/njuga-room" component={NjugaRoom} />
      <Route path="/shansha-room" component={ShanshaRoom} />
      <Route path="/chinshingwa-room" component={ChinshingwaRoom} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthRedirect />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
