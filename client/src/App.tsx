import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import TermsPage from "@/pages/terms";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import HomePage from "@/pages/home";
import RecordPage from "@/pages/record";
import CasesPage from "@/pages/cases";
import CaseDetailPage from "@/pages/case-detail";
import DispositionSummaryPage from "@/pages/disposition-summary";
import PatientProgressionPage from "@/pages/patient-progression";
import SubscriptionPage from "@/pages/subscription";
import ProfilePage from "@/pages/profile";
import SecurityPage from "@/pages/security";

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={AuthPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/home" component={AuthPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route component={AuthPage} />
      </Switch>
    );
  }

  if (!user?.termsAcceptedAt) {
    return (
      <Switch>
        <Route path="/" component={TermsPage} />
        <Route path="/terms" component={TermsPage} />
        <Route component={TermsPage} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/home" component={HomePage} />
      <Route path="/record" component={RecordPage} />
      <Route path="/cases" component={CasesPage} />
      <Route path="/cases/:id" component={CaseDetailPage} />
      <Route path="/cases/:id/disposition" component={DispositionSummaryPage} />
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
