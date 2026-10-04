import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Wallet,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useSettings } from "@/hooks/use-settings";

interface BudgetSummary {
  monthlyBudget: number;
  totalAllocated: number;
  totalSpent: number;
  remainingBudget: number;
  categoryCount: number;
  daysLeft: number;
}

interface BudgetOverviewProps {
  summary: BudgetSummary | undefined;
  isLoading: boolean;
  onSetIncomeClick?: () => void;
}

export default function BudgetOverview({
  summary,
  isLoading,
  onSetIncomeClick,
}: BudgetOverviewProps) {
  const { data: settings } = useSettings();
  const currency = settings?.currency || "PKR";

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 mt-4">
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (!summary || summary.monthlyBudget === 0) {
    return (
      <div className="max-w-md mx-auto px-4 mt-4">
        <Card className="rounded-3xl border-0 shadow-lg bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-950 text-white overflow-hidden p-6 relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col items-center text-center py-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-3 border border-white/20">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-display text-xl font-bold tracking-tight">
              Start Tracking Your Budget
            </h3>
            <p className="text-sm text-white/80 mt-1 max-w-xs">
              Set your monthly salary or income to unlock budget allocations and live spending tracking.
            </p>
            {onSetIncomeClick && (
              <button
                type="button"
                onClick={onSetIncomeClick}
                className="mt-4 px-5 py-2.5 rounded-2xl bg-white text-emerald-950 font-semibold text-sm shadow-md hover:bg-white/90 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Set Monthly Income</span>
              </button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const spentPercentage =
    summary.monthlyBudget > 0
      ? (summary.totalSpent / summary.monthlyBudget) * 100
      : 0;
  const availableAmount = summary.monthlyBudget - summary.totalSpent;
  const isOverBudget = summary.totalSpent > summary.monthlyBudget;
  const isOverAllocated = summary.totalAllocated > summary.monthlyBudget;
  const dailyBudget =
    summary.daysLeft > 0 ? availableAmount / summary.daysLeft : 0;

  const getBudgetStatus = () => {
    if (isOverBudget) {
      return {
        text: "Over Budget",
        badgeBg: "bg-rose-500/20 text-rose-200 border-rose-500/30",
        icon: AlertTriangle,
      };
    }
    if (spentPercentage > 85) {
      return {
        text: "Caution (85%+)",
        badgeBg: "bg-amber-500/20 text-amber-200 border-amber-500/30",
        icon: AlertTriangle,
      };
    }
    if (spentPercentage < 50) {
      return {
        text: "Healthy & On Track",
        badgeBg: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
        icon: ShieldCheck,
      };
    }
    return {
      text: "Normal Pace",
      badgeBg: "bg-teal-500/20 text-teal-200 border-teal-500/30",
      icon: TrendingUp,
    };
  };

  const status = getBudgetStatus();
  const StatusIcon = status.icon;

  return (
    <div className="max-w-md mx-auto px-4 mt-4" data-testid="budget-overview">
      <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-xl border border-white/10">
        {/* Glow background effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-white/70 font-semibold flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-300" /> Available Cash
              </span>
            </div>
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-md ${status.badgeBg}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{status.text}</span>
            </div>
          </div>

          {/* Large Available Amount */}
          <div>
            <div className="flex items-baseline gap-2">
              <h2
                className={`font-display text-3xl sm:text-4xl font-extrabold tracking-tight tnum ${
                  availableAmount < 0 ? "text-rose-300" : "text-white"
                }`}
                data-testid="available-amount"
              >
                {currency} {availableAmount.toLocaleString()}
              </h2>
            </div>
            <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
              <span>of</span>
              <span className="font-semibold text-white/90">
                {currency} {summary.monthlyBudget.toLocaleString()}
              </span>
              <span>total monthly income</span>
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-white/80">
              <span>Spent {Math.round(spentPercentage)}%</span>
              <span>
                {Math.max(0, 100 - Math.round(spentPercentage))}% remaining
              </span>
            </div>
            <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverBudget
                    ? "bg-rose-400"
                    : spentPercentage > 85
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                }`}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Glassmorphic Stats Grid */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* Total Spent */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/15">
              <div className="flex items-center gap-1 text-[11px] text-white/70">
                <TrendingUp className="w-3 h-3 text-rose-300" />
                <span>Spent</span>
              </div>
              <p
                className="font-display font-bold text-sm sm:text-base text-white mt-1 truncate tnum"
                data-testid="total-spent"
              >
                {currency} {summary.totalSpent.toLocaleString()}
              </p>
            </div>

            {/* Total Allocated */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/15">
              <div className="flex items-center gap-1 text-[11px] text-white/70">
                <Zap className="w-3 h-3 text-amber-300" />
                <span>Allocated</span>
              </div>
              <p className="font-display font-bold text-sm sm:text-base text-white mt-1 truncate tnum">
                {currency} {summary.totalAllocated.toLocaleString()}
              </p>
            </div>

            {/* Daily Budget or Days Left */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/15">
              <div className="flex items-center gap-1 text-[11px] text-white/70">
                <Calendar className="w-3 h-3 text-emerald-300" />
                <span>Daily Pace</span>
              </div>
              <p className="font-display font-bold text-sm sm:text-base text-white mt-1 truncate tnum">
                {dailyBudget > 0
                  ? `${currency} ${Math.round(dailyBudget).toLocaleString()}`
                  : `${summary.daysLeft}d left`}
              </p>
            </div>
          </div>

          {/* Over-allocation warning banner if applicable */}
          {isOverAllocated && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />
              <span>
                Allocations exceed income by {currency}{" "}
                {(summary.totalAllocated - summary.monthlyBudget).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}