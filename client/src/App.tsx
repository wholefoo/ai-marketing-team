import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuditPage from "@/pages/audit";
import AdminPage from "@/pages/admin";
import PrivacyPolicy from "@/pages/privacy";
import TermsOfService from "@/pages/terms";
import RefundPolicy from "@/pages/refund";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/audit/:id" component={AuditPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/refund" component={RefundPolicy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
