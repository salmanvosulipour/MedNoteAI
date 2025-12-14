import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import HomePage from "@/pages/home";
import RecordPage from "@/pages/record";
import CasesPage from "@/pages/cases";
import CaseDetailPage from "@/pages/case-detail";
import PatientProgressionPage from "@/pages/patient-progression";
import SubscriptionPage from "@/pages/subscription";
import ProfilePage from "@/pages/profile";
import SecurityPage from "@/pages/security";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/home" component={HomePage} />
      <Route path="/record" component={RecordPage} />
      <Route path="/cases" component={CasesPage} />
      <Route path="/cases/:id" component={CaseDetailPage} />
      <Route path="/patients/:mrn" component={PatientProgressionPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/subscription" component={SubscriptionPage} />
      <Route path="/security" component={SecurityPage} />
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
