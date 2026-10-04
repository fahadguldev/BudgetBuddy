import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUpdateBudget, useBudgetByMonth } from "@/hooks/use-budget";
import { useBudgetSummary } from "@/hooks/use-budget";
import { storageService } from "@/lib/storage";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Category, BudgetAllocation } from "@/types";
import { ShoppingCart, Car, FileText, Zap, Smile, ArrowLeft, Plus, Wallet, TrendingUp, ChevronDown, ChevronUp, BarChart3, Trash2, RotateCcw, FolderPlus } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, subWeeks, parseISO } from "date-fns";
import { useExpenses } from "@/hooks/use-expenses";
import ResetTransactionsModal from "@/components/reset-transactions-modal";
import MonthSelector from "@/components/month-selector";
import CreateCategoryModal from "@/components/create-category-modal";
import { getCategoryIcon } from "@/lib/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ManageBudget() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  // Get budget for selected month
  const { data: budget } = useBudgetByMonth(selectedMonth);
  const budgetId = budget?.id;

  const { data: summary } = useBudgetSummary(budgetId || undefined);
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => await storageService.getCategories(),
  });
  const { data: settings } = useSettings();
  const currency = settings?.currency || 'PKR';

  const { data: allocations = [] } = useQuery<BudgetAllocation[]>({
    queryKey: ["allocations", budgetId],
    enabled: !!budgetId,
    queryFn: async () => (budgetId ? await storageService.getBudgetAllocations(budgetId) : []),
  });

  const [localAlloc, setLocalAlloc] = useState<Record<string, { id?: string; allocatedAmount: string }>>({});
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [extraIncome, setExtraIncome] = useState("");
  const [extraIncomeNote, setExtraIncomeNote] = useState("");
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetAllocConfirm, setShowResetAllocConfirm] = useState(false);
  const [isResettingAlloc, setIsResettingAlloc] = useState(false);
  const updateBudget = useUpdateBudget();

  const { data: expenses = [] } = useExpenses(budgetId || undefined);

  const iconOptions = [
    { value: "shopping-cart", label: "Shopping Cart", icon: ShoppingCart },
    { value: "car", label: "Car", icon: Car },
    { value: "file-text", label: "File", icon: FileText },
    { value: "zap", label: "Lightning", icon: Zap },
    { value: "smile", label: "Smile", icon: Smile },
  ];

  const colorOptions = [
    { value: "#2ECC71", label: "Green" },
    { value: "#3498DB", label: "Blue" },
    { value: "#E74C3C", label: "Red" },
    { value: "#F39C12", label: "Orange" },
    { value: "#9B59B6", label: "Purple" },
  ];

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: { name: string; icon: string; color: string }) => {
      return await storageService.createCategory({ ...categoryData, isDefault: false });
    },
    onSuccess: (created: Category) => {
      queryClient.setQueryData(["categories"], (old: Category[] | undefined) => {
        const arr = old ? [...old] : [];
        arr.push(created);
        return arr;
      });

      setLocalAlloc((s) => ({ ...s, [created.id]: { id: undefined, allocatedAmount: "0" } }));

      setNewCategoryName("");
      setNewCategoryIcon("");
      setNewCategoryColor("");
      setIsCreating(false);
      setShowCreateCategory(false);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      toast({ title: "Success", description: "Category created successfully!" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      return await storageService.deleteCategory(categoryId);
    },
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(["categories"], (old: Category[] | undefined) => {
        return old ? old.filter(c => c.id !== deletedId) : [];
      });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      toast({ title: "Success", description: "Category deleted successfully!" });
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Cannot Delete Category",
        description: error.message,
        variant: "destructive"
      });
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    },
  });

  useEffect(() => {
    const map: Record<string, { id?: string; allocatedAmount: string }> = {};
    categories.forEach((c) => {
      const existing = allocations.find((a) => a.categoryId === c.id);
      map[c.id] = { id: existing?.id, allocatedAmount: existing ? String(existing.allocatedAmount) : "0" };
    });
    setLocalAlloc(map);
  }, [categories, allocations]);

  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCategoryName || !newCategoryIcon || !newCategoryColor) {
      toast({ title: "Error", description: "Please fill in all category fields", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      await createCategoryMutation.mutateAsync({ name: newCategoryName, icon: newCategoryIcon, color: newCategoryColor });
    } catch (err: any) {
      setIsCreating(false);
      toast({
        title: "Error",
        description: err?.message || "Failed to create category",
        variant: "destructive"
      });
    }
  };

  const handleAddExtraIncome = async () => {
    let currentBudgetId = budgetId;
    const amount = parseFloat(extraIncome || "0");
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Error", description: "Enter a valid amount", variant: "destructive" });
      return;
    }

    try {
      if (!currentBudgetId) {
        const newBudget = await storageService.createBudget({
          monthlyIncome: String(amount),
          month: selectedMonth,
        });
        currentBudgetId = newBudget.id;
      } else {
        const current = summary?.monthlyBudget ?? 0;
        const newTotal = current + amount;
        await updateBudget.mutateAsync({ id: currentBudgetId, data: { monthlyIncome: String(newTotal) } });
      }

      await storageService.createIncomeRecord({ budgetId: currentBudgetId, amount: String(amount), note: extraIncomeNote });

      queryClient.invalidateQueries({ queryKey: ["budget"] });
      queryClient.invalidateQueries();

      toast({ title: "Success", description: `Added ${currency} ${amount.toLocaleString()} to monthly budget` });
      setExtraIncome("");
      setExtraIncomeNote("");
      setShowAddIncome(false);
    } catch (err) {
      toast({ title: "Error", description: "Failed to update budget", variant: "destructive" });
    }
  };

  const handleChange = (categoryId: string, value: string) => {
    setLocalAlloc((s) => ({ ...s, [categoryId]: { ...s[categoryId], allocatedAmount: value } }));
  };

  const handleSave = async () => {
    let currentBudgetId = budgetId;
    if (!currentBudgetId) {
      try {
        const newBudget = await storageService.createBudget({
          monthlyIncome: "0",
          month: selectedMonth,
        });
        currentBudgetId = newBudget.id;
        queryClient.invalidateQueries({ queryKey: ["budget"] });
      } catch (err) {
        toast({ title: "Error", description: "Please set your monthly income first.", variant: "destructive" });
        return;
      }
    }

    const totalAllocated = Object.values(localAlloc).reduce((sum, v) => sum + Number(v.allocatedAmount || 0), 0);
    const monthlyBudget = summary?.monthlyBudget ?? 0;
    if (monthlyBudget > 0 && totalAllocated > monthlyBudget) {
      toast({ title: "Error", description: "Total allocations exceed monthly budget", variant: "destructive" });
      return;
    }

    try {
      for (const categoryId of Object.keys(localAlloc)) {
        const amount = localAlloc[categoryId].allocatedAmount || "0";
        const existing = allocations.find((a) => a.categoryId === categoryId);

        if (existing) {
          if (Number(amount) === 0) {
            await storageService.deleteBudgetAllocation(existing.id);
          } else if (String(existing.allocatedAmount) !== String(amount)) {
            await storageService.updateBudgetAllocation(existing.id, { allocatedAmount: amount });
          }
        } else {
          if (Number(amount) > 0) {
            await storageService.createBudgetAllocation({ budgetId: currentBudgetId, categoryId, allocatedAmount: amount });
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["budget"] });
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      queryClient.invalidateQueries();

      toast({ title: "Success", description: "Allocations updated successfully" });
      navigate("/");
    } catch (error) {
      toast({ title: "Error", description: "Failed to update allocations", variant: "destructive" });
    }
  };

  const handleResetAllocations = async () => {
    if (!budgetId) return;
    try {
      setIsResettingAlloc(true);
      await storageService.resetBudgetAllocations(budgetId);
      const resetMap: Record<string, { id?: string; allocatedAmount: string }> = {};
      categories.forEach((c) => {
        resetMap[c.id] = { id: undefined, allocatedAmount: "0" };
      });
      setLocalAlloc(resetMap);
      queryClient.setQueryData(["allocations", budgetId], []);
      queryClient.invalidateQueries({ queryKey: ["allocations", budgetId] });
      queryClient.invalidateQueries({ queryKey: ["budget", budgetId, "summary"] });
      queryClient.invalidateQueries({ queryKey: ["budget", budgetId, "categories-with-allocations"] });
      toast({ title: "Allocations Reset", description: "All category allocations for this month have been reset to zero." });
      setShowResetAllocConfirm(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to reset allocations", variant: "destructive" });
    } finally {
      setIsResettingAlloc(false);
    }
  };

  const totalAllocated = Object.values(localAlloc).reduce((sum, v) => sum + Number(v.allocatedAmount || 0), 0);
  const monthlyBudget = summary?.monthlyBudget ?? 0;
  const remaining = Math.max(0, monthlyBudget - totalAllocated);
  const overBudget = totalAllocated > monthlyBudget;
  const allocationPercentage = monthlyBudget > 0 ? Math.min((totalAllocated / monthlyBudget) * 100, 100) : 0;

  // Calculate chart data - only for categories with expenses
  const chartData = useMemo(() => {
    if (!expenses || expenses.length === 0 || categories.length === 0) return [];

    // Get categories that have expenses
    const categoriesWithExpenses = categories.filter(cat =>
      expenses.some(exp => exp.categoryId === cat.id)
    );

    if (categoriesWithExpenses.length === 0) return [];

    // Use selected month date for relative calculations
    const monthDate = parseISO(selectedMonth + "-01");
    // If selected month is current month, use now, otherwise use end of that month
    const isCurrentMonth = selectedMonth === new Date().toISOString().slice(0, 7);
    const referenceDate = isCurrentMonth ? new Date() : endOfDay(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));

    const data: any[] = [];

    if (chartPeriod === 'day') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = subDays(referenceDate, i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const dayData: any = {
          label: format(date, "EEE"),
          fullDate: date,
        };

        categoriesWithExpenses.forEach((category) => {
          const categoryExpenses = expenses.filter((exp) => {
            const expDate = new Date(exp.date);
            return exp.categoryId === category.id && expDate >= dayStart && expDate <= dayEnd;
          });

          const total = categoryExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
          dayData[category.id] = total;
        });

        data.push(dayData);
      }
    } else if (chartPeriod === 'week') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(referenceDate, i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(subWeeks(referenceDate, i), { weekStartsOn: 1 });

        const weekData: any = {
          label: `W${4 - i}`,
          fullDate: weekStart,
        };

        categoriesWithExpenses.forEach((category) => {
          const categoryExpenses = expenses.filter((exp) => {
            const expDate = new Date(exp.date);
            return exp.categoryId === category.id && expDate >= weekStart && expDate <= weekEnd;
          });

          const total = categoryExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
          weekData[category.id] = total;
        });

        data.push(weekData);
      }
    } else {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = subDays(referenceDate, i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const dayData: any = {
          label: format(date, "d"),
          fullDate: date,
        };

        categoriesWithExpenses.forEach((category) => {
          const categoryExpenses = expenses.filter((exp) => {
            const expDate = new Date(exp.date);
            return exp.categoryId === category.id && expDate >= dayStart && expDate <= dayEnd;
          });

          const total = categoryExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
          dayData[category.id] = total;
        });

        data.push(dayData);
      }
    }

    return data;
  }, [expenses, categories, chartPeriod, selectedMonth]);

  // Get categories that have expenses for the chart
  const categoriesWithExpenses = useMemo(() => {
    return categories.filter(cat =>
      expenses.some(exp => exp.categoryId === cat.id)
    );
  }, [categories, expenses]);

  // Calculate current month transactions for reset functionality
  const currentMonthTransactions = useMemo(() => {
    if (!expenses) return 0;
    // We are already filtered by budgetId which corresponds to selectedMonth
    return expenses.length;
  }, [expenses]);

  return (
    <div className="min-h-screen bg-background pb-20 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-md border-b border-border/80 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                data-testid="button-back"
                className="h-9 w-9 rounded-xl shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="font-display font-bold text-base sm:text-lg tracking-tight truncate">
                  Manage Budget
                </h1>
                <p className="text-[11px] text-muted-foreground truncate">
                  Allocations & categories
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <MonthSelector
                currentMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-5 w-full overflow-x-hidden">
        {/* Budget Overview Card */}
        <Card className="rounded-3xl border border-border/80 shadow-sm overflow-hidden bg-card">
          <CardHeader className="pb-2 p-4 sm:p-5 border-b border-border/40">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="font-display font-bold text-sm sm:text-base">Budget Overview</span>
              </div>
              <Badge variant={overBudget ? "destructive" : "secondary"} className="text-xs rounded-lg">
                {allocationPercentage.toFixed(0)}% Allocated
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3.5">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/40 text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Total Budget</p>
                <p className="text-xs sm:text-sm font-bold text-primary mt-0.5 truncate tnum">
                  {currency} {monthlyBudget.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/40 text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Allocated</p>
                <p className={`text-xs sm:text-sm font-bold mt-0.5 truncate tnum ${overBudget ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {currency} {totalAllocated.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/40 text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Remaining</p>
                <p className={`text-xs sm:text-sm font-bold mt-0.5 truncate tnum ${overBudget ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {currency} {remaining.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Allocation Progress</span>
                <span className={`font-semibold tnum ${overBudget ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                  {allocationPercentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(allocationPercentage, 100)} className="h-2 rounded-full" />
            </div>

            {overBudget && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400">
                ⚠️ Total allocations exceed monthly budget by {currency} {(totalAllocated - monthlyBudget).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending Trends Chart */}
        {categoriesWithExpenses.length > 0 && chartData.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-primary flex-shrink-0" />
                  <CardTitle className="text-base sm:text-lg">Spending Trends</CardTitle>
                </div>
                <Tabs value={chartPeriod} onValueChange={(v) => setChartPeriod(v as typeof chartPeriod)} className="w-full sm:w-auto">
                  <TabsList className="h-8 p-0.5 bg-muted/50 w-full sm:w-auto">
                    <TabsTrigger value="day" className="text-[10px] sm:text-xs px-2 py-1 flex-1 sm:flex-none">Daily</TabsTrigger>
                    <TabsTrigger value="week" className="text-[10px] sm:text-xs px-2 py-1 flex-1 sm:flex-none">Weekly</TabsTrigger>
                    <TabsTrigger value="month" className="text-[10px] sm:text-xs px-2 py-1 flex-1 sm:flex-none">Monthly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="w-full overflow-x-auto">
                <ResponsiveContainer width="100%" height={280} className="sm:h-[300px]">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 9, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                      interval={chartPeriod === 'month' ? 5 : chartPeriod === 'week' ? 0 : 0}
                      height={20}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: '#6b7280' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value === 0 ? '0' : `${(value / 1000).toFixed(0)}k`}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '10px',
                        padding: '6px 8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                      formatter={(value: number, name: string) => {
                        const category = categoriesWithExpenses.find(c => c.id === name);
                        return [`${currency} ${value.toLocaleString()}`, category?.name || name];
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          const data = payload[0].payload;
                          if (chartPeriod === 'day') {
                            return format(data.fullDate, "EEEE, MMM d");
                          } else if (chartPeriod === 'week') {
                            return `Week of ${format(data.fullDate, "MMM d")}`;
                          } else {
                            return format(data.fullDate, "MMM d, yyyy");
                          }
                        }
                        return label;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '9px', paddingTop: '8px' }}
                      formatter={(value) => {
                        const category = categoriesWithExpenses.find(c => c.id === value);
                        return category?.name || value;
                      }}
                      iconSize={8}
                    />
                    {categoriesWithExpenses.map((category) => (
                      <Line
                        key={category.id}
                        type="monotone"
                        dataKey={category.id}
                        stroke={category.color}
                        strokeWidth={2}
                        dot={{ fill: category.color, strokeWidth: 1.5, r: 2, stroke: '#ffffff' }}
                        activeDot={{ r: 4, fill: category.color, stroke: '#ffffff', strokeWidth: 2 }}
                        name={category.name}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center mt-2">
                {chartPeriod === 'day' && "Daily spending for the last 7 days"}
                {chartPeriod === 'week' && "Weekly spending for the last 4 weeks"}
                {chartPeriod === 'month' && "Daily spending for the last 30 days"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center space-y-2"
            onClick={() => setShowAddIncome(!showAddIncome)}
            data-testid="button-toggle-add-income"
          >
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium">Add Income</span>
            {showAddIncome ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center space-y-2"
            onClick={() => setShowCreateCategory(!showCreateCategory)}
            data-testid="button-toggle-create-category"
          >
            <Plus className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">New Category</span>
            {showCreateCategory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Add Income Section */}
        {showAddIncome && (
          <Card className="border-2 border-green-200 bg-green-50/50 dark:bg-green-950/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add Extra Income</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="extra-income">Amount ({currency}) *</Label>
                <Input
                  id="extra-income"
                  type="number"
                  placeholder="e.g. 5000"
                  value={extraIncome}
                  onChange={(e) => setExtraIncome(e.target.value)}
                  data-testid="input-extra-income"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="extra-note">Note (optional)</Label>
                <Input
                  id="extra-note"
                  placeholder="e.g. freelance project, bonus"
                  value={extraIncomeNote}
                  onChange={(e) => setExtraIncomeNote(e.target.value)}
                  data-testid="input-extra-note"
                  className="mt-1"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddIncome(false);
                    setExtraIncome("");
                    setExtraIncomeNote("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddExtraIncome} className="flex-1" data-testid="button-add-extra">
                  Add Income
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Category Modal */}
        <CreateCategoryModal
          open={showCreateCategory}
          onOpenChange={setShowCreateCategory}
          budgetId={budgetId}
        />

        {/* Category Allocations */}
        <Card className="rounded-3xl border border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="p-4 border-b border-border/40 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-display font-bold text-base truncate">
                  Category Allocations
                </span>
                <Badge variant="secondary" className="rounded-md text-[11px] px-2 py-0.5 shrink-0">
                  {categories.length}
                </Badge>
              </div>

              <Button
                size="sm"
                onClick={() => setShowCreateCategory(true)}
                className="text-xs h-8 px-3 rounded-xl font-medium shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                New Category
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30">
              <span className="text-[11px] text-muted-foreground truncate">
                Set monthly limits per category
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetAllocConfirm(true)}
                className="text-xs h-7 px-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                disabled={!budgetId || isResettingAlloc}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset Allocations
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-3 sm:pt-4">
            {categories.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
                  <FolderPlus className="w-6 h-6" />
                </div>
                <p className="font-medium text-sm">No categories configured</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Create your first budget category to start allocating funds.
                </p>
                <Button
                  onClick={() => setShowCreateCategory(true)}
                  className="rounded-xl h-10 px-4 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Create Category
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => {
                  const currentAllocVal = Number(localAlloc[category.id]?.allocatedAmount || 0);
                  const percentage = monthlyBudget > 0 ? (currentAllocVal / monthlyBudget) * 100 : 0;
                  const IconComponent = getCategoryIcon(category.icon);

                  const bumpAlloc = (delta: number) => {
                    const newVal = Math.max(0, currentAllocVal + delta);
                    handleChange(category.id, String(newVal));
                  };

                  return (
                    <div
                      key={category.id}
                      className="p-3 sm:p-3.5 rounded-2xl bg-card border border-border/70 hover:border-primary/30 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                            style={{
                              backgroundColor: `${category.color}1c`,
                              color: category.color,
                            }}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-display font-semibold truncate text-sm">
                              {category.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground tnum truncate">
                              {percentage > 0 ? `${percentage.toFixed(1)}% of budget` : "Not allocated"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <div className="relative w-28 sm:w-32">
                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">
                              {currency}
                            </div>
                            <Input
                              id={`alloc-${category.id}`}
                              type="number"
                              min="0"
                              step="any"
                              value={localAlloc[category.id]?.allocatedAmount ?? "0"}
                              onChange={(e) => handleChange(category.id, e.target.value)}
                              data-testid={`input-alloc-${category.id}`}
                              className="text-right font-semibold text-xs sm:text-sm pl-8 pr-2 h-9 rounded-xl"
                              placeholder="0"
                            />
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCategoryToDelete(category);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9 rounded-xl shrink-0"
                            title="Delete category"
                            data-testid={`button-delete-category-${category.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Quick Increment Chips */}
                      <div className="flex items-center justify-between gap-1 pt-0.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] text-muted-foreground mr-0.5">Quick +:</span>
                          <button
                            type="button"
                            onClick={() => bumpAlloc(500)}
                            className="text-[11px] px-2 py-0.5 rounded-lg bg-muted/60 hover:bg-muted font-medium transition-all active:scale-95"
                          >
                            +500
                          </button>
                          <button
                            type="button"
                            onClick={() => bumpAlloc(1000)}
                            className="text-[11px] px-2 py-0.5 rounded-lg bg-muted/60 hover:bg-muted font-medium transition-all active:scale-95"
                          >
                            +1k
                          </button>
                          <button
                            type="button"
                            onClick={() => bumpAlloc(5000)}
                            className="text-[11px] px-2 py-0.5 rounded-lg bg-muted/60 hover:bg-muted font-medium transition-all active:scale-95"
                          >
                            +5k
                          </button>
                        </div>

                        {currentAllocVal > 0 && (
                          <button
                            type="button"
                            onClick={() => handleChange(category.id, "0")}
                            className="text-[10px] text-muted-foreground hover:text-destructive font-medium transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {currentAllocVal > 0 && (
                        <div className="w-full bg-muted/80 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(percentage, 100)}%`,
                              backgroundColor: category.color,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reset Transactions Section (Only if transactions exist for month) */}
        {currentMonthTransactions > 0 && budgetId && (
          <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-sm flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-xs sm:text-sm">
                Transactions ({currentMonthTransactions})
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                Expenses recorded in this month
              </p>
            </div>
            <ResetTransactionsModal
              budgetId={budgetId}
              transactionCount={currentMonthTransactions}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 rounded-xl text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 shrink-0 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Reset Txns
              </Button>
            </ResetTransactionsModal>
          </div>
        )}

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-md pt-3 pb-4 border-t border-border/80 -mx-4 px-4 z-30">
          <div className="max-w-md mx-auto flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
              className="flex-1 h-12 rounded-2xl"
              size="lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={overBudget}
              className="flex-1 h-12 rounded-2xl font-semibold shadow-md active:scale-98"
              size="lg"
            >
              Save Allocations
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{categoryToDelete?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteConfirm(false);
              setCategoryToDelete(null);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (categoryToDelete) {
                  deleteCategoryMutation.mutate(categoryToDelete.id);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Monthly Allocations Confirmation Dialog */}
      <AlertDialog open={showResetAllocConfirm} onOpenChange={setShowResetAllocConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Monthly Allocations?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set all category allocations for this month to zero ({currency} 0).
              Your recorded transactions, categories, and monthly income will remain intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResettingAlloc}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetAllocations}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isResettingAlloc}
            >
              {isResettingAlloc ? "Resetting..." : "Yes, Reset Allocations"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
