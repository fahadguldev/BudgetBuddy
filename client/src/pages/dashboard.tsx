import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  DollarSign,
  FolderPlus,
  SlidersHorizontal,
  Coins,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  Search,
} from "lucide-react";
import BudgetOverview from "@/components/budget-overview";
import CategoryTile from "@/components/category-tile";
import AddExpenseModal from "@/components/add-expense-modal";
import CreateCategoryModal from "@/components/create-category-modal";
import BottomNavigation from "@/components/bottom-navigation";
import SpendingChart from "@/components/spending-chart";
import CategoryChartModal from "@/components/category-chart-modal";
import MonthSelector from "@/components/month-selector";
import { MonthlyIncomeModal } from "@/components/monthly-income-modal";
import { useCurrentBudget, useBudgetByMonth, useBudgetSummary } from "@/hooks/use-budget";
import { useCategoriesWithAllocations, useExpenses } from "@/hooks/use-expenses";
import { Skeleton } from "@/components/ui/skeleton";
import { type CategoryWithAllocation } from "@/types";
import { useSettings } from "@/hooks/use-settings";
import { queryClient } from "@/lib/queryClient";
import { ModeToggle } from "@/components/mode-toggle";
import { getCategoryIcon, CATEGORY_PRESETS } from "@/lib/icons";

export default function Dashboard() {
  const { data: settings } = useSettings();
  const currency = settings?.currency || "PKR";
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCategoryChart, setShowCategoryChart] = useState(false);
  const [showManualIncomeModal, setShowManualIncomeModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithAllocation | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [categoryFilter, setCategoryFilter] = useState<"all" | "overspent" | "nearing" | "healthy">("all");
  const [, navigate] = useLocation();

  // Budget for selected month
  const { data: budget, isLoading: budgetLoading } = useBudgetByMonth(selectedMonth);
  const { data: summary, isLoading: summaryLoading } = useBudgetSummary(budget?.id);
  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesWithAllocations(budget?.id);
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses(budget?.id);

  // If no budget exists for current month (and we're viewing current month), show income modal
  const isCurrentMonth = selectedMonth === new Date().toISOString().slice(0, 7);
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const showInitialIncomeModal = isCurrentMonth && !budgetLoading && !budget;

  const handleIncomeComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["budget"] });
  };

  // Filter categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const pct = cat.allocated > 0 ? (cat.spent / cat.allocated) * 100 : 0;
      if (categoryFilter === "overspent") return cat.spent > cat.allocated;
      if (categoryFilter === "nearing") return cat.spent <= cat.allocated && pct >= 80;
      if (categoryFilter === "healthy") return cat.spent <= cat.allocated && pct < 80;
      return true;
    });
  }, [categories, categoryFilter]);

  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [expenses]);

  const overspentCount = categories.filter((c) => c.spent > c.allocated).length;
  const nearingCount = categories.filter((c) => {
    const pct = c.allocated > 0 ? (c.spent / c.allocated) * 100 : 0;
    return c.spent <= c.allocated && pct >= 80;
  }).length;

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden w-full max-w-full">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-md border-b border-border/80 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md shrink-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h1 className="font-display font-bold text-base sm:text-lg tracking-tight shrink-0">
                BudgetBuddy
              </h1>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <MonthSelector
                currentMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
              />
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Budget Overview — Modern Hero Portfolio Card */}
      <BudgetOverview
        summary={summary}
        isLoading={summaryLoading}
        onSetIncomeClick={() => setShowManualIncomeModal(true)}
      />

      {/* Quick Actions Hub */}
      <section className="max-w-md mx-auto px-4 mt-4">
        <div className="grid grid-cols-4 gap-2">
          {/* Add Expense (Primary) */}
          <button
            onClick={() => setShowAddExpense(true)}
            data-testid="button-quick-add"
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-primary text-primary-foreground shadow-sm hover:shadow-md active:scale-95 transition-all text-center"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold leading-tight">Expense</span>
          </button>

          {/* New Category */}
          <button
            onClick={() => setShowCreateCategory(true)}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-primary/40 active:scale-95 transition-all text-center"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium leading-tight">Category</span>
          </button>

          {/* Manage Allocations */}
          <button
            onClick={() => navigate(`/manage-budget?budgetId=${budget?.id}`)}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-primary/40 active:scale-95 transition-all text-center"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium leading-tight">Allocate</span>
          </button>

          {/* Month Sweep to Savings */}
          <button
            onClick={() => navigate("/savings-goals")}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-primary/40 active:scale-95 transition-all text-center"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium leading-tight">Savings</span>
          </button>
        </div>
      </section>

      {/* Spending Chart Section */}
      <section className="max-w-md mx-auto px-4 mt-5" data-testid="header-chart-section">
        <SpendingChart expenses={expenses} isLoading={expensesLoading} />
      </section>

      {/* Budget Categories */}
      <section className="max-w-md mx-auto px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold tracking-tight">
              Budget Categories
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
              {categories.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              onClick={() => setShowCreateCategory(true)}
              variant="outline"
              size="sm"
              className="h-8 px-2.5 rounded-xl text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Category
            </Button>
            <Button
              onClick={() => navigate(`/manage-budget?budgetId=${budget?.id}`)}
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary h-8 px-2.5 rounded-xl text-xs font-medium"
            >
              Manage
            </Button>
          </div>
        </div>

        {/* Category Filter Pills (if categories exist) */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-1">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                categoryFilter === "all"
                  ? "bg-primary text-primary-foreground border-primary font-medium shadow-sm"
                  : "bg-card border-border/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({categories.length})
            </button>
            {overspentCount > 0 && (
              <button
                onClick={() => setCategoryFilter("overspent")}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                  categoryFilter === "overspent"
                    ? "bg-rose-600 text-white border-rose-600 font-medium shadow-sm"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                }`}
              >
                Overspent ({overspentCount})
              </button>
            )}
            {nearingCount > 0 && (
              <button
                onClick={() => setCategoryFilter("nearing")}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                  categoryFilter === "nearing"
                    ? "bg-amber-600 text-white border-amber-600 font-medium shadow-sm"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                }`}
              >
                Nearing ({nearingCount})
              </button>
            )}
            <button
              onClick={() => setCategoryFilter("healthy")}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                categoryFilter === "healthy"
                  ? "bg-emerald-600 text-white border-emerald-600 font-medium shadow-sm"
                  : "bg-card border-border/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              Healthy
            </button>
          </div>
        )}

        {categoriesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <Card className="rounded-3xl border border-dashed border-border/80 p-6 text-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
              <FolderPlus className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-base">
              No categories configured yet
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Create categories like Fuel, Groceries, or Rent to allocate your budget and track spending.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button
                onClick={() => setShowCreateCategory(true)}
                className="h-10 px-4 rounded-xl text-xs font-semibold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create Category
              </Button>
            </div>
          </Card>
        ) : filteredCategories.length === 0 ? (
          <Card className="rounded-2xl p-6 text-center border-border/60">
            <p className="text-xs text-muted-foreground">
              No categories match the "{categoryFilter}" filter.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCategoryFilter("all")}
              className="mt-2 text-xs h-8"
            >
              Show all categories
            </Button>
          </Card>
        ) : (
          <div className="space-y-3" data-testid="categories-list">
            {filteredCategories.map((category) => (
              <CategoryTile
                key={category.id}
                category={category}
                onClick={(id) => {
                  const cat = categories.find((c) => c.id === id);
                  if (cat) {
                    setSelectedCategory(cat);
                    setShowCategoryChart(true);
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recent Transactions */}
      <section className="max-w-md mx-auto px-4 mt-7">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold tracking-tight">
              Recent Transactions
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
              {expenses.length}
            </span>
          </div>

          <Button
            onClick={() => navigate(`/transactions?budgetId=${budget?.id}`)}
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary h-8 px-2.5 rounded-xl text-xs font-medium"
          >
            View All
          </Button>
        </div>

        {expensesLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : recentExpenses.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-border/80 p-6 text-center">
            <p className="font-medium text-sm">No transactions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your first expense to see your live spending feed.
            </p>
            <Button
              onClick={() => setShowAddExpense(true)}
              variant="outline"
              size="sm"
              className="mt-3 h-9 rounded-xl text-xs"
              data-testid="button-add-first-expense"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add First Expense
            </Button>
          </Card>
        ) : (
          <div className="space-y-2.5" data-testid="recent-transactions">
            {recentExpenses.map((expense) => {
              const category = categories.find((c) => c.id === expense.categoryId);
              const CatIcon = getCategoryIcon(category?.icon);
              const catColor = category?.color || "#3B82F6";

              return (
                <Card
                  key={expense.id}
                  className="rounded-2xl border border-border/80 shadow-sm hover:border-primary/30 transition-all overflow-hidden"
                >
                  <CardContent className="p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                          style={{
                            backgroundColor: `${catColor}1c`,
                            color: catColor,
                          }}
                        >
                          <CatIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-medium text-sm truncate"
                            data-testid={`transaction-category-${expense.id}`}
                          >
                            {category?.name ?? "Uncategorized"}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            {expense.description && (
                              <span className="truncate max-w-[130px]">
                                {expense.description}
                              </span>
                            )}
                            {expense.description && <span>•</span>}
                            <span>
                              {new Date(expense.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p
                        className="font-display font-bold text-sm text-rose-600 dark:text-rose-400 tnum shrink-0"
                        data-testid={`transaction-amount-${expense.id}`}
                      >
                        -{currency} {Number(expense.amount).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Add Expense Modal */}
      {budget && (
        <AddExpenseModal
          open={showAddExpense}
          onOpenChange={setShowAddExpense}
          budgetId={budget.id}
        />
      )}

      {/* Create Category Modal */}
      <CreateCategoryModal
        open={showCreateCategory}
        onOpenChange={setShowCreateCategory}
        budgetId={budget?.id}
      />

      {/* Category Chart Modal */}
      <CategoryChartModal
        open={showCategoryChart}
        onOpenChange={(open) => {
          if (!open) setSelectedCategory(null);
          setShowCategoryChart(open);
        }}
        category={selectedCategory}
        expenses={expenses}
      />

      {/* Monthly Income Modal */}
      <MonthlyIncomeModal
        isOpen={showInitialIncomeModal || showManualIncomeModal}
        currentMonth={currentMonthStr}
        onComplete={() => {
          setShowManualIncomeModal(false);
          handleIncomeComplete();
        }}
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        onAddExpenseClick={() => setShowAddExpense(true)}
        onManageBudgetClick={() => navigate(`/manage-budget?budgetId=${budget?.id}`)}
        onTransactionsClick={() => navigate(`/transactions?budgetId=${budget?.id}`)}
      />
    </div>
  );
}
