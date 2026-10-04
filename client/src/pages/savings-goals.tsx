import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useSavingsGoals, useCreateSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal, useAddSavingsContribution, useSweepToSavings } from "@/hooks/use-savings";
import { useCurrentBudget } from "@/hooks/use-budget";
import { useCategoriesWithAllocations, useCategories } from "@/hooks/use-expenses";
import { useSettings } from "@/hooks/use-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNavigation from "@/components/bottom-navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Target,
  Trophy,
  TrendingUp,
  Shield,
  Landmark,
  PieChart as PieChartIcon,
  Coins,
  Gem,
  Sparkles,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  CheckCircle2,
  Calendar,
  Wallet,
  DollarSign
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import type { SavingsGoal, SavingsType, SavingsCategory, SavingsContribution } from "@/types";

// Category metadata definitions
const SAVINGS_CATEGORIES: Array<{
  id: SavingsCategory;
  name: string;
  icon: any;
  color: string;
  defaultType: SavingsType;
  description: string;
}> = [
  {
    id: "emergency-fund",
    name: "Emergency Fund",
    icon: Shield,
    color: "#10B981",
    defaultType: "goal",
    description: "3-6 months liquid safety net",
  },
  {
    id: "stocks",
    name: "Stocks & Equities",
    icon: TrendingUp,
    color: "#3B82F6",
    defaultType: "sip",
    description: "Monthly SIP or stock market portfolio",
  },
  {
    id: "mutual-funds",
    name: "Mutual Funds",
    icon: PieChartIcon,
    color: "#8B5CF6",
    defaultType: "sip",
    description: "Systematic monthly mutual fund investments",
  },
  {
    id: "savings-acct",
    name: "Savings Account",
    icon: Landmark,
    color: "#F59E0B",
    defaultType: "general",
    description: "Liquid high-yield savings / bank deposits",
  },
  {
    id: "gold",
    name: "Gold & Precious",
    icon: Gem,
    color: "#EAB308",
    defaultType: "general",
    description: "Physical gold, silver or certificates",
  },
  {
    id: "crypto",
    name: "Crypto Assets",
    icon: Coins,
    color: "#EC4899",
    defaultType: "general",
    description: "Digital currencies and crypto holdings",
  },
  {
    id: "custom",
    name: "Custom Goal",
    icon: Target,
    color: "#06B6D4",
    defaultType: "goal",
    description: "Personal milestones, vacations, gadgets",
  },
];

const getCategoryMeta = (categoryId?: string) => {
  return SAVINGS_CATEGORIES.find((c) => c.id === categoryId) || {
    id: "custom",
    name: categoryId ? categoryId.charAt(0).toUpperCase() + categoryId.slice(1) : "Savings",
    icon: Target,
    color: "#06B6D4",
    defaultType: "goal",
    description: "Savings allocation",
  };
};

export default function SavingsGoals() {
  const { data: goals = [], isLoading } = useSavingsGoals();
  const { data: settings } = useSettings();
  const currency = settings?.currency || "PKR";
  const { toast } = useToast();

  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();
  const deleteGoal = useDeleteSavingsGoal();
  const addContribution = useAddSavingsContribution();
  const sweepToSavings = useSweepToSavings();

  // Current month budget & category remaining
  const { data: currentBudget } = useCurrentBudget();
  const { data: categoriesWithAllocations = [] } = useCategoriesWithAllocations(currentBudget?.id);

  // Filter state
  const [activeTypeTab, setActiveTypeTab] = useState<"all" | SavingsType>("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSweepOpen, setIsSweepOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [itemToActOn, setItemToActOn] = useState<SavingsGoal | null>(null);
  const [itemToDelete, setItemToDelete] = useState<SavingsGoal | null>(null);

  // Form states for creation
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<SavingsCategory>("emergency-fund");
  const [formType, setFormType] = useState<SavingsType>("goal");
  const [formTargetAmount, setFormTargetAmount] = useState("");
  const [formCurrentAmount, setFormCurrentAmount] = useState("0");
  const [formMonthlyContribution, setFormMonthlyContribution] = useState("");
  const [formTargetDate, setFormTargetDate] = useState("");

  // Deposit modal state
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [depositType, setDepositType] = useState<"add" | "withdraw">("add");

  // Month-end sweep state
  const [sweepTargetId, setSweepTargetId] = useState<string>("");
  const [sweepSelections, setSweepSelections] = useState<Record<string, { selected: boolean; amount: number }>>({});
  const [sweepCustomNote, setSweepCustomNote] = useState("");

  // Categories eligible for sweeping (positive remaining)
  const eligibleSweepCategories = useMemo(() => {
    return categoriesWithAllocations
      .filter((c) => (c.remaining ?? 0) > 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        remaining: c.remaining,
        allocated: c.allocated,
        spent: c.spent,
      }));
  }, [categoriesWithAllocations]);

  // Total available to sweep across all eligible categories
  const totalEligibleSweepAmount = useMemo(() => {
    return eligibleSweepCategories.reduce((sum, c) => sum + (c.remaining || 0), 0);
  }, [eligibleSweepCategories]);

  // Portfolio aggregates
  const portfolioStats = useMemo(() => {
    let totalSaved = 0;
    let totalTarget = 0;
    let totalMonthlySIP = 0;
    let goalsCount = 0;
    let sipCount = 0;

    goals.forEach((g) => {
      const current = Number(g.currentAmount || 0);
      const target = Number(g.targetAmount || 0);
      const sip = Number(g.monthlyContribution || 0);

      totalSaved += current;
      if (g.type === "goal" || (!g.type && target > 0)) {
        totalTarget += target;
        goalsCount++;
      }
      if (g.type === "sip") {
        totalMonthlySIP += sip;
        sipCount++;
      }
    });

    const overallGoalProgress = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;

    return {
      totalSaved,
      totalTarget,
      totalMonthlySIP,
      overallGoalProgress,
      goalsCount,
      sipCount,
      totalItems: goals.length,
    };
  }, [goals]);

  // Category breakdown for chart and cards
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { categoryId: string; name: string; total: number; count: number; color: string; icon: any }>();

    goals.forEach((g) => {
      const catId = g.category || "custom";
      const meta = getCategoryMeta(catId);
      const existing = map.get(catId) || {
        categoryId: catId,
        name: meta.name,
        total: 0,
        count: 0,
        color: g.color || meta.color,
        icon: meta.icon,
      };

      existing.total += Number(g.currentAmount || 0);
      existing.count += 1;
      map.set(catId, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [goals]);

  // Donut chart data
  const chartData = useMemo(() => {
    return categoryBreakdown
      .filter((c) => c.total > 0)
      .map((c) => ({
        name: c.name,
        value: c.total,
        color: c.color,
      }));
  }, [categoryBreakdown]);

  // Filtered goals
  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      const matchesType =
        activeTypeTab === "all" ||
        (activeTypeTab === "goal" && (g.type === "goal" || (!g.type && Number(g.targetAmount || 0) > 0))) ||
        (activeTypeTab === "sip" && g.type === "sip") ||
        (activeTypeTab === "general" && g.type === "general");

      const matchesCat =
        selectedCategoryFilter === "all" || (g.category || "custom") === selectedCategoryFilter;

      return matchesType && matchesCat;
    });
  }, [goals, activeTypeTab, selectedCategoryFilter]);

  // Handlers
  const handleOpenCreate = () => {
    setFormName("");
    setFormCategory("emergency-fund");
    setFormType("goal");
    setFormTargetAmount("");
    setFormCurrentAmount("0");
    setFormMonthlyContribution("");
    setFormTargetDate("");
    setIsCreateOpen(true);
  };

  const handleCategoryChangeInForm = (catId: SavingsCategory) => {
    setFormCategory(catId);
    const meta = getCategoryMeta(catId);
    setFormType(meta.defaultType);
    if (!formName) {
      setFormName(meta.name);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast({ title: "Name Required", description: "Please enter a name for your savings item.", variant: "destructive" });
      return;
    }

    const meta = getCategoryMeta(formCategory);

    try {
      await createGoal.mutateAsync({
        name: formName.trim(),
        category: formCategory,
        type: formType,
        targetAmount: formTargetAmount || "0",
        currentAmount: formCurrentAmount || "0",
        monthlyContribution: formMonthlyContribution || "0",
        targetDate: formTargetDate ? new Date(formTargetDate) : null,
        icon: formCategory,
        color: meta.color,
      });

      toast({
        title: "Savings Created",
        description: `Successfully added ${formName}!`,
      });
      setIsCreateOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to create savings goal.", variant: "destructive" });
    }
  };

  const handleOpenSweepModal = () => {
    if (goals.length === 0) {
      toast({
        title: "No Savings Created",
        description: "Please create a savings goal, SIP, or savings account first before sweeping remaining funds.",
        variant: "destructive",
      });
      return;
    }

    if (eligibleSweepCategories.length === 0) {
      toast({
        title: "No Remaining Funds",
        description: "All categories for this month have either zero allocations or have been spent.",
      });
      return;
    }

    // Initialize sweep selections with all eligible selected
    const initialMap: Record<string, { selected: boolean; amount: number }> = {};
    eligibleSweepCategories.forEach((cat) => {
      initialMap[cat.id] = { selected: true, amount: cat.remaining };
    });
    setSweepSelections(initialMap);
    setSweepTargetId(goals[0]?.id || "");
    setSweepCustomNote("");
    setIsSweepOpen(true);
  };

  const handleConfirmSweep = async () => {
    if (!sweepTargetId) {
      toast({ title: "Select Destination", description: "Please pick a savings goal to deposit into.", variant: "destructive" });
      return;
    }

    const selectedItems = eligibleSweepCategories
      .filter((cat) => sweepSelections[cat.id]?.selected && (sweepSelections[cat.id]?.amount || 0) > 0)
      .map((cat) => ({
        categoryId: cat.id,
        categoryName: cat.name,
        amount: Number(sweepSelections[cat.id]?.amount || 0),
      }));

    if (selectedItems.length === 0) {
      toast({ title: "Nothing Selected", description: "Please select at least one category to sweep.", variant: "destructive" });
      return;
    }

    try {
      const result = await sweepToSavings.mutateAsync({
        budgetId: currentBudget?.id || "",
        targetSavingsGoalId: sweepTargetId,
        categorySweepItems: selectedItems,
        note: sweepCustomNote.trim() || undefined,
      });

      const targetGoal = goals.find((g) => g.id === sweepTargetId);
      toast({
        title: "🎉 Sweep Successful!",
        description: `Added ${currency} ${result.sweptTotal.toLocaleString()} into ${targetGoal?.name || "Savings"}!`,
      });
      setIsSweepOpen(false);
    } catch (err: any) {
      toast({ title: "Sweep Failed", description: err?.message || "Could not transfer funds.", variant: "destructive" });
    }
  };

  const handleOpenDeposit = (goal: SavingsGoal, mode: "add" | "withdraw" = "add") => {
    setItemToActOn(goal);
    setDepositType(mode);
    setDepositAmount("");
    setDepositNote("");
    setIsDepositOpen(true);
  };

  const handleConfirmDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToActOn) return;

    const numAmount = parseFloat(depositAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }

    const signedAmount = depositType === "add" ? numAmount : -numAmount;

    try {
      await addContribution.mutateAsync({
        id: itemToActOn.id,
        amount: signedAmount,
        note: depositNote.trim() || (depositType === "add" ? "Manual contribution" : "Manual withdrawal"),
        sourceCategory: depositType === "add" ? "Manual Deposit" : "Withdrawal",
      });

      toast({
        title: depositType === "add" ? "Funds Deposited" : "Funds Withdrawn",
        description: `${depositType === "add" ? "Added" : "Withdrew"} ${currency} ${numAmount.toLocaleString()} in ${itemToActOn.name}`,
      });
      setIsDepositOpen(false);
      setItemToActOn(null);
    } catch (err: any) {
      toast({ title: "Operation Failed", description: err?.message || "Failed to update balance.", variant: "destructive" });
    }
  };

  const handleOpenHistory = (goal: SavingsGoal) => {
    setItemToActOn(goal);
    setIsHistoryOpen(true);
  };

  const handleDeleteGoal = async () => {
    if (!itemToDelete) return;
    try {
      await deleteGoal.mutateAsync(itemToDelete.id);
      toast({ title: "Goal Deleted", description: `Deleted ${itemToDelete.name}` });
      setItemToDelete(null);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden w-full max-w-full">
      {/* Sticky Header */}
      <header className="bg-card/95 backdrop-blur border-b border-border sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 cursor-pointer" />
            </Link>
            <div>
              <h1 className="font-display font-bold text-lg tracking-tight">Savings & Wealth</h1>
              <p className="text-[11px] text-muted-foreground">Goals, SIPs & Cumulative Reserves</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="h-9 px-3 rounded-xl gap-1.5 font-medium shadow-sm active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Month-End Sweep Action Banner */}
        {eligibleSweepCategories.length > 0 && (
          <Card className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 shadow-sm overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Month-End Sweep Available</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  You have <span className="font-semibold text-foreground tnum">{currency} {totalEligibleSweepAmount.toLocaleString()}</span> unspent across {eligibleSweepCategories.length} categories.
                </p>
              </div>
              <Button
                onClick={handleOpenSweepModal}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-3 text-xs font-semibold shadow-sm flex-shrink-0 gap-1.5"
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span>Sweep</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Hero Portfolio Card */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-xl border border-white/10">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs uppercase tracking-wider text-emerald-200/90 font-medium">Total Saved & Invested</p>
                <h2 className="font-display text-3xl font-extrabold tracking-tight tnum text-white">
                  {currency} {portfolioStats.totalSaved.toLocaleString()}
                </h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shadow-inner border border-white/20">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/20">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/15">
                <p className="text-[10px] text-emerald-200 font-medium">Monthly SIPs</p>
                <p className="text-xs font-bold tnum mt-0.5 text-white truncate">
                  {currency} {portfolioStats.totalMonthlySIP.toLocaleString()}
                </p>
                <p className="text-[9px] text-emerald-300 mt-0.5">Recurring</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/15">
                <p className="text-[10px] text-emerald-200 font-medium">Goals Target</p>
                <p className="text-xs font-bold tnum mt-0.5 text-white truncate">
                  {currency} {portfolioStats.totalTarget.toLocaleString()}
                </p>
                <p className="text-[9px] text-emerald-300 mt-0.5">{portfolioStats.goalsCount} targets</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/15">
                <p className="text-[10px] text-emerald-200 font-medium">Goal Funding</p>
                <p className="text-xs font-bold tnum mt-0.5 text-white truncate">
                  {portfolioStats.overallGoalProgress.toFixed(1)}%
                </p>
                <p className="text-[9px] text-emerald-300 mt-0.5">Funded</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown & Distribution Section */}
        {categoryBreakdown.length > 0 && (
          <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-sm font-bold tracking-tight">Category-Wise Allocation</CardTitle>
                <span className="text-xs text-muted-foreground">{categoryBreakdown.length} active buckets</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-4">
              {/* Donut Chart + Legend */}
              <div className="flex items-center justify-between gap-4">
                <div className="w-32 h-32 flex-shrink-0 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius={36}
                        outerRadius={56}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => [`${currency} ${val.toLocaleString()}`, "Saved"]}
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          borderColor: "#334155",
                          borderRadius: 8,
                          color: "#fff",
                          fontSize: 11,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[9px] text-muted-foreground font-medium">TOTAL</span>
                    <span className="text-[11px] font-bold tnum">{chartData.length}</span>
                  </div>
                </div>

                {/* Top Categories List */}
                <div className="flex-1 space-y-2 min-w-0">
                  {categoryBreakdown.slice(0, 4).map((cat) => {
                    const percent = portfolioStats.totalSaved > 0 ? (cat.total / portfolioStats.totalSaved) * 100 : 0;
                    const IconComp = cat.icon || Target;
                    return (
                      <div key={cat.categoryId} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="font-medium truncate">{cat.name}</span>
                          </div>
                          <span className="font-bold tnum text-muted-foreground ml-2">
                            {currency} {cat.total.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={percent} className="h-1.5 rounded-full" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category Pills Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
                <button
                  onClick={() => setSelectedCategoryFilter("all")}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategoryFilter === "all"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  All Categories
                </button>
                {categoryBreakdown.map((cat) => (
                  <button
                    key={cat.categoryId}
                    onClick={() => setSelectedCategoryFilter(cat.categoryId)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                      selectedCategoryFilter === cat.categoryId
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Type Tabs Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold tracking-tight">Your Savings & Assets</h3>
            <span className="text-xs text-muted-foreground">{filteredGoals.length} items</span>
          </div>

          <Tabs value={activeTypeTab} onValueChange={(v) => setActiveTypeTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-4 h-9 p-1 bg-muted/60 rounded-xl">
              <TabsTrigger value="all" className="text-[11px] rounded-lg">All</TabsTrigger>
              <TabsTrigger value="goal" className="text-[11px] rounded-lg">Goals</TabsTrigger>
              <TabsTrigger value="sip" className="text-[11px] rounded-lg">SIPs</TabsTrigger>
              <TabsTrigger value="general" className="text-[11px] rounded-lg">Accounts</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Goals List */}
        {filteredGoals.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-border p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-semibold text-sm">No savings items found</h4>
              <p className="text-xs text-muted-foreground">
                {goals.length === 0
                  ? "Start by adding an Emergency Fund, Stocks SIP, or Savings Account!"
                  : "No items match your active tab and category filter."}
              </p>
            </div>
            <div className="pt-2 flex flex-wrap gap-2 justify-center">
              <Button onClick={handleOpenCreate} size="sm" className="rounded-xl h-9 px-4 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create First Item
              </Button>
              {eligibleSweepCategories.length > 0 && goals.length > 0 && (
                <Button onClick={handleOpenSweepModal} variant="outline" size="sm" className="rounded-xl h-9 px-4 text-xs">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Sweep Remaining Funds
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredGoals.map((goal) => {
              const meta = getCategoryMeta(goal.category);
              const IconComp = meta.icon || Target;
              const current = Number(goal.currentAmount || 0);
              const target = Number(goal.targetAmount || 0);
              const isGoalType = goal.type === "goal" || (!goal.type && target > 0);
              const isSipType = goal.type === "sip";
              const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
              const remainingToGoal = Math.max(0, target - current);

              return (
                <Card
                  key={goal.id}
                  className="rounded-2xl border-0 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  <CardContent className="p-4 space-y-3.5">
                    {/* Top Row: Meta Badges & Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: `${goal.color || meta.color}18` }}
                        >
                          <IconComp className="w-5 h-5" style={{ color: goal.color || meta.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-display font-bold text-sm tracking-tight text-foreground">{goal.name}</h4>
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 h-4 border-0 font-medium"
                              style={{ backgroundColor: `${goal.color || meta.color}15`, color: goal.color || meta.color }}
                            >
                              {meta.name}
                            </Badge>
                            {isSipType && (
                              <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4 font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40">
                                SIP Monthly
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {isSipType
                              ? `SIP: ${currency} ${Number(goal.monthlyContribution || 0).toLocaleString()} / month`
                              : isGoalType && goal.targetDate
                              ? `Target: ${new Date(goal.targetDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                              : meta.description}
                          </p>
                        </div>
                      </div>

                      {/* Top Action Icons */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenHistory(goal)}
                          className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
                          title="View history"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setItemToDelete(goal)}
                          className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive"
                          title="Delete goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Middle: Amount & Progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Current Balance</span>
                          <p className="font-display text-xl font-extrabold tracking-tight tnum text-foreground">
                            {currency} {current.toLocaleString()}
                          </p>
                        </div>
                        {isGoalType && target > 0 && (
                          <div className="text-right">
                            <span className="text-[10px] text-muted-foreground font-medium">Target</span>
                            <p className="text-xs font-semibold tnum text-muted-foreground">
                              {currency} {target.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Goal Progress Bar */}
                      {isGoalType && target > 0 && (
                        <div className="space-y-1">
                          <Progress
                            value={progress}
                            className="h-2 rounded-full"
                            style={{
                              // @ts-ignore
                              "--progress-background": goal.color || meta.color,
                            }}
                          />
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 tnum">
                              {progress.toFixed(1)}% funded
                            </span>
                            <span className="tnum">
                              {remainingToGoal > 0 ? `${currency} ${remainingToGoal.toLocaleString()} remaining` : "Goal Achieved! 🎉"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-border/60">
                      <Button
                        onClick={() => handleOpenDeposit(goal, "add")}
                        size="sm"
                        className="flex-1 h-8 rounded-xl text-xs font-semibold gap-1 bg-primary/10 hover:bg-primary/20 text-primary border-0 shadow-none"
                      >
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                        <span>Deposit</span>
                      </Button>
                      <Button
                        onClick={() => handleOpenDeposit(goal, "withdraw")}
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 rounded-xl text-xs font-medium gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        <span>Withdraw</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL 1: Create New Savings / Goal / SIP */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg">Add Savings & Wealth Item</DialogTitle>
            <DialogDescription>
              Create an emergency fund, stock SIP, mutual fund, or general savings bucket.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            {/* Category Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category *</Label>
              <div className="grid grid-cols-2 gap-2">
                {SAVINGS_CATEGORIES.map((cat) => {
                  const IconComponent = cat.icon;
                  const isSelected = formCategory === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => handleCategoryChangeInForm(cat.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate leading-tight">{cat.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{cat.defaultType.toUpperCase()}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title / Name */}
            <div className="space-y-1">
              <Label htmlFor="goal-name" className="text-xs font-semibold">Name / Label *</Label>
              <Input
                id="goal-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. 6-Month Emergency Fund, PSX Dividend Stocks"
                required
                className="h-10 rounded-xl text-sm"
              />
            </div>

            {/* Savings Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Savings Model</Label>
              <Tabs value={formType} onValueChange={(v) => setFormType(v as SavingsType)}>
                <TabsList className="grid grid-cols-3 h-9 p-1 bg-muted rounded-xl">
                  <TabsTrigger value="goal" className="text-xs rounded-lg">🎯 Goal Target</TabsTrigger>
                  <TabsTrigger value="sip" className="text-xs rounded-lg">📈 SIP Monthly</TabsTrigger>
                  <TabsTrigger value="general" className="text-xs rounded-lg">🏦 Cumulative</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Dynamic fields based on type */}
            {formType === "goal" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="target-amount" className="text-xs font-semibold">Target ({currency}) *</Label>
                  <Input
                    id="target-amount"
                    type="number"
                    min="1"
                    value={formTargetAmount}
                    onChange={(e) => setFormTargetAmount(e.target.value)}
                    placeholder="100000"
                    required
                    className="h-10 rounded-xl text-sm tnum"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="target-date" className="text-xs font-semibold">Target Date (Optional)</Label>
                  <Input
                    id="target-date"
                    type="date"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    className="h-10 rounded-xl text-sm"
                  />
                </div>
              </div>
            )}

            {formType === "sip" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="monthly-sip" className="text-xs font-semibold">Monthly SIP ({currency}) *</Label>
                  <Input
                    id="monthly-sip"
                    type="number"
                    min="1"
                    value={formMonthlyContribution}
                    onChange={(e) => setFormMonthlyContribution(e.target.value)}
                    placeholder="5000"
                    required
                    className="h-10 rounded-xl text-sm tnum"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="optional-target" className="text-xs font-semibold">Portfolio Goal ({currency})</Label>
                  <Input
                    id="optional-target"
                    type="number"
                    value={formTargetAmount}
                    onChange={(e) => setFormTargetAmount(e.target.value)}
                    placeholder="e.g. 500000"
                    className="h-10 rounded-xl text-sm tnum"
                  />
                </div>
              </div>
            )}

            {/* Initial Amount */}
            <div className="space-y-1">
              <Label htmlFor="initial-amount" className="text-xs font-semibold">Initial Starting Balance ({currency})</Label>
              <Input
                id="initial-amount"
                type="number"
                min="0"
                value={formCurrentAmount}
                onChange={(e) => setFormCurrentAmount(e.target.value)}
                placeholder="0"
                className="h-10 rounded-xl text-sm tnum"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={createGoal.isPending} className="rounded-xl flex-1">
                {createGoal.isPending ? "Creating..." : "Save Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Month-End Sweep from Main Budget Categories */}
      <Dialog open={isSweepOpen} onOpenChange={setIsSweepOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center mb-1">
              <Sparkles className="w-5 h-5" />
            </div>
            <DialogTitle className="font-display font-bold text-lg">Month-End Category Sweep</DialogTitle>
            <DialogDescription>
              Sweep the remaining unspent amounts from your monthly budget categories straight into your savings!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Target Destination Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Deposit Into Savings Item *</Label>
              <Select value={sweepTargetId} onValueChange={setSweepTargetId}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select target savings bucket" />
                </SelectTrigger>
                <SelectContent>
                  {goals.map((g) => {
                    const meta = getCategoryMeta(g.category);
                    return (
                      <SelectItem key={g.id} value={g.id}>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color || meta.color }} />
                          <span className="font-medium">{g.name}</span>
                          <span className="text-xs text-muted-foreground tnum">
                            ({currency} {Number(g.currentAmount || 0).toLocaleString()})
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Category Sweep Selection List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Select Categories to Sweep</span>
                <button
                  type="button"
                  onClick={() => {
                    const allSelected = eligibleSweepCategories.every((c) => sweepSelections[c.id]?.selected);
                    const newMap: Record<string, { selected: boolean; amount: number }> = {};
                    eligibleSweepCategories.forEach((c) => {
                      newMap[c.id] = { selected: !allSelected, amount: c.remaining };
                    });
                    setSweepSelections(newMap);
                  }}
                  className="text-primary hover:underline"
                >
                  Toggle All
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {eligibleSweepCategories.map((cat) => {
                  const isChecked = sweepSelections[cat.id]?.selected ?? true;
                  const sweepVal = sweepSelections[cat.id]?.amount ?? cat.remaining;

                  return (
                    <div
                      key={cat.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isChecked ? "border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20" : "border-border opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              setSweepSelections((prev) => ({
                                ...prev,
                                [cat.id]: {
                                  selected: e.target.checked,
                                  amount: prev[cat.id]?.amount ?? cat.remaining,
                                },
                              }));
                            }}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          />
                          <div className="truncate">
                            <p className="text-xs font-semibold truncate text-foreground">{cat.name}</p>
                            <p className="text-[10px] text-muted-foreground tnum">
                              Allocated {currency} {cat.allocated.toLocaleString()} • Spent {currency} {cat.spent.toLocaleString()}
                            </p>
                          </div>
                        </label>

                        {/* Sweep Amount Input */}
                        <div className="w-28 flex-shrink-0">
                          <Input
                            type="number"
                            min="0"
                            max={cat.remaining}
                            disabled={!isChecked}
                            value={sweepVal}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setSweepSelections((prev) => ({
                                ...prev,
                                [cat.id]: { selected: true, amount: Math.min(cat.remaining, val) },
                              }));
                            }}
                            className="h-8 text-right text-xs font-semibold tnum rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sweep Summary Box */}
            <div className="p-3.5 rounded-xl bg-muted/70 flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Total to Sweep into Savings:</span>
              <span className="font-display font-extrabold text-base text-emerald-600 dark:text-emerald-400 tnum">
                {currency}{" "}
                {eligibleSweepCategories
                  .filter((c) => sweepSelections[c.id]?.selected)
                  .reduce((sum, c) => sum + (sweepSelections[c.id]?.amount || 0), 0)
                  .toLocaleString()}
              </span>
            </div>

            {/* Optional Note */}
            <div className="space-y-1">
              <Label htmlFor="sweep-note" className="text-xs font-medium">Sweep Note (Optional)</Label>
              <Input
                id="sweep-note"
                value={sweepCustomNote}
                onChange={(e) => setSweepCustomNote(e.target.value)}
                placeholder="e.g. October surplus savings"
                className="h-9 rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsSweepOpen(false)} className="rounded-xl flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSweep}
              disabled={sweepToSavings.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex-1 gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{sweepToSavings.isPending ? "Sweeping..." : "Confirm Sweep"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Quick Deposit / Withdraw */}
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-base flex items-center gap-2">
              {depositType === "add" ? (
                <>
                  <ArrowDownCircle className="w-5 h-5 text-emerald-600" />
                  <span>Deposit into {itemToActOn?.name}</span>
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-5 h-5 text-amber-600" />
                  <span>Withdraw from {itemToActOn?.name}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {depositType === "add"
                ? "Contribute funds to your savings bucket."
                : "Redeem or spend funds from this balance."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmDeposit} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label htmlFor="deposit-amount" className="text-xs font-semibold">Amount ({currency}) *</Label>
              <Input
                id="deposit-amount"
                type="number"
                min="0.01"
                step="any"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                required
                autoFocus
                className="h-11 rounded-xl text-lg font-bold tnum"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="deposit-note" className="text-xs font-medium">Note / Source (Optional)</Label>
              <Input
                id="deposit-note"
                value={depositNote}
                onChange={(e) => setDepositNote(e.target.value)}
                placeholder={depositType === "add" ? "e.g. Salary bonus, dividend payout" : "e.g. Medical bill, repairs"}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDepositOpen(false)} className="rounded-xl flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={addContribution.isPending} className="rounded-xl flex-1">
                {addContribution.isPending ? "Saving..." : depositType === "add" ? "Deposit Funds" : "Withdraw Funds"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: Contribution History */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-base flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <span>Contribution History — {itemToActOn?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Recent deposits, category sweeps, and withdrawals.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 pt-2">
            {(!itemToActOn?.contributions || itemToActOn.contributions.length === 0) ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No recorded deposit history yet for this item.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {itemToActOn.contributions.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl border border-border/80 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">{item.sourceCategory || "Deposit"}</p>
                      {item.note && <p className="text-[11px] text-muted-foreground">{item.note}</p>}
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <span className={`font-bold tnum text-sm ${item.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}`}>
                      {item.amount >= 0 ? "+" : ""}{currency} {item.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsHistoryOpen(false)} className="rounded-xl w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 5: Delete Confirmation */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this savings bucket from your portfolio. Any accumulated records will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGoal} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Persistent Bottom Navigation with Goals highlighted */}
      <BottomNavigation />
    </div>
  );
}
