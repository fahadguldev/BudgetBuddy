import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import InstallButton from "./components/install-button";
import SyncStatus from "./components/sync-status";
import Dashboard from "@/pages/dashboard";
import BudgetSetup from "@/pages/budget-setup";
import ManageBudget from "@/pages/manage-budget";
import Transactions from "@/pages/transactions";
import Settings from "@/pages/settings";
import RecurringExpenses from "@/pages/recurring-expenses";
import SavingsGoals from "@/pages/savings-goals";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/components/protected-route";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { Cloud, LogIn, HardDrive } from "lucide-react";
import { Link } from "wouter";

function AuthStatusBar() {
  const { user, isConfigured } = useAuth();

  if (!isConfigured) {
    return (
      <Badge variant="outline" className="text-[10px] gap-1 py-0.5 border-dashed">
        <HardDrive className="w-3 h-3 text-muted-foreground" />
        Local Mode
      </Badge>
    );
  }

  if (user) {
    return (
      <Link href="/settings">
        <Badge variant="outline" className="text-[10px] gap-1 py-0.5 cursor-pointer bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 hover:opacity-80">
          <Cloud className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          {user.displayName?.split(" ")[0] || "Synced"}
        </Badge>
      </Link>
    );
  }

  return (
    <Link href="/auth">
      <Badge variant="outline" className="text-[10px] gap-1 py-0.5 cursor-pointer bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 hover:opacity-80">
        <LogIn className="w-3 h-3 text-blue-500" />
        Sign In
      </Badge>
    </Link>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/budget-setup" component={BudgetSetup} />
      <ProtectedRoute path="/manage-budget" component={ManageBudget} />
      <ProtectedRoute path="/transactions" component={Transactions} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/recurring-expenses" component={RecurringExpenses} />
      <ProtectedRoute path="/savings-goals" component={SavingsGoals} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="system" storageKey="budget-buddy-theme">
          <TooltipProvider>
            <div className="max-w-md mx-auto px-4 py-1.5 flex items-center justify-end gap-2">
              <AuthStatusBar />
              <InstallButton />
            </div>
            <Toaster />
            <SyncStatus />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
