import { Link, useLocation } from "wouter";
import { Plus, Settings, Receipt, Home, RefreshCw, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  onAddExpenseClick?: () => void;
  onManageBudgetClick?: () => void;
  onTransactionsClick?: () => void;
}

export default function BottomNavigation({ onAddExpenseClick }: BottomNavigationProps) {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const linkClasses = (active: boolean) =>
    cn(
      "flex flex-col items-center justify-center gap-1 min-h-[48px] min-w-[56px] px-3 rounded-xl cursor-pointer transition-colors",
      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
    );

  return (
    <nav aria-label="Primary" className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border shadow-lg z-50 pb-safe" data-testid="bottom-navigation">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-end justify-between py-2">

          <Link href="/" aria-current={isActive("/") ? "page" : undefined}>
            <div className={linkClasses(isActive("/"))}>
              <Home className="w-6 h-6" aria-hidden />
              <span className="text-[11px] font-medium">Home</span>
            </div>
          </Link>

          <Link href="/recurring-expenses" aria-current={isActive("/recurring-expenses") ? "page" : undefined}>
            <div className={linkClasses(isActive("/recurring-expenses"))}>
              <RefreshCw className="w-6 h-6" aria-hidden />
              <span className="text-[11px] font-medium">Recurring</span>
            </div>
          </Link>

          <div className="relative -top-6">
            <button
              onClick={onAddExpenseClick}
              aria-label="Add expense"
              className="flex flex-col items-center justify-center w-14 h-14 bg-primary rounded-full shadow-lg ring-4 ring-background hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-7 h-7 text-primary-foreground" aria-hidden />
            </button>
          </div>

          <Link href="/savings-goals" aria-current={isActive("/savings-goals") ? "page" : undefined}>
            <div className={linkClasses(isActive("/savings-goals"))}>
              <Target className="w-6 h-6" aria-hidden />
              <span className="text-[11px] font-medium">Savings</span>
            </div>
          </Link>

          <Link href="/settings" aria-current={isActive("/settings") ? "page" : undefined}>
            <div className={linkClasses(isActive("/settings"))}>
              <Settings className="w-6 h-6" aria-hidden />
              <span className="text-[11px] font-medium">Settings</span>
            </div>
          </Link>

        </div>
      </div>
    </nav>
  );
}
