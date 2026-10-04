import { useState } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { useBudget } from "@/hooks/use-budget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import DataManagement from "@/components/data-management";
import { ResetBudgetModal } from "@/components/reset-budget-modal";
import BottomNavigation from "@/components/bottom-navigation";
import { ArrowLeft, RotateCcw, Cloud, LogIn, LogOut, CheckCircle2, Trash2, AlertTriangle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useResetAllocations, useFactoryReset } from "@/hooks/use-reset-budget";
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

const CURRENCIES = [
    { code: "PKR", symbol: "PKR", name: "Pakistani Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
];

export default function Settings() {
    const { user, logout, isConfigured } = useAuth();
    const [, setLocation] = useLocation();
    const { data: settings } = useSettings();
    const updateSettings = useUpdateSettings();
    const { data: currentBudget } = useBudget();
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [resetAllocConfirmOpen, setResetAllocConfirmOpen] = useState(false);
    const [factoryResetConfirmOpen, setFactoryResetConfirmOpen] = useState(false);
    const resetAllocMutation = useResetAllocations();
    const factoryResetMutation = useFactoryReset();

    const handleConfirmResetAlloc = async () => {
        if (!currentBudget) return;
        await resetAllocMutation.mutateAsync(currentBudget.id);
        setResetAllocConfirmOpen(false);
    };

    const handleConfirmFactoryReset = async () => {
        await factoryResetMutation.mutateAsync();
        setFactoryResetConfirmOpen(false);
        setLocation("/");
    };

    const handleCurrencyChange = (value: string) => {
        updateSettings.mutate({ currency: value });
    };

    // Get current month
    const currentMonth = new Date().toISOString().slice(0, 7);

    return (
        <div className="min-h-screen bg-background pb-28 w-full max-w-full overflow-x-hidden">
            <header className="bg-card/95 backdrop-blur-md border-b border-border/80 sticky top-0 z-40">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
                    <Link href="/" className="p-1.5 -ml-1.5 rounded-xl hover:bg-muted transition-colors">
                        <ArrowLeft className="w-5 h-5 cursor-pointer" />
                    </Link>
                    <div>
                        <h1 className="font-display font-bold text-lg tracking-tight">Settings</h1>
                        <p className="text-[11px] text-muted-foreground">Preferences, currency & sync</p>
                    </div>
                </div>
            </header>

            <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle>Preferences</CardTitle>
                            <CardDescription>Customize your experience</CardDescription>
                        </div>
                        <ModeToggle />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select
                                value={settings?.currency || "PKR"}
                                onValueChange={handleCurrencyChange}
                            >
                                <SelectTrigger id="currency">
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map((c) => (
                                        <SelectItem key={c.code} value={c.code}>
                                            {c.name} ({c.symbol})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Budget Management Card */}
                {currentBudget && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Budget Management</CardTitle>
                            <CardDescription>
                                Manage your current monthly budget
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={() => setResetModalOpen(true)}
                                variant="outline"
                                className="w-full"
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reset Monthly Budget
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1 mb-4">
                                Start a new budget period when your salary arrives. Current expenses will be archived for history.
                            </p>

                            <Button
                                onClick={() => setResetAllocConfirmOpen(true)}
                                variant="outline"
                                className="w-full"
                                disabled={resetAllocMutation.isPending}
                            >
                                <RotateCcw className="h-4 w-4 mr-2 text-muted-foreground" />
                                Reset Monthly Allocations
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1">
                                Set all category allocations for this month to zero so you can reallocate your budget from scratch.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Account & Cloud Sync Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Cloud className="h-5 w-5 text-primary" />
                            Account & Cloud Sync
                        </CardTitle>
                        <CardDescription>
                            {user
                                ? "Your budget data is safely backed up and synced to your Google account."
                                : "Using BudgetBuddy in offline/guest mode on this device."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {user ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 font-medium text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        <span>{user.displayName || "Google User"}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => logout()}>
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Sign Out
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-xs text-muted-foreground">
                                    Sign in to sync your budgets and expenses in real-time across your phone, tablet, and computer.
                                </p>
                                {isConfigured ? (
                                    <Button
                                        className="w-full"
                                        onClick={() => setLocation("/auth")}
                                    >
                                        <LogIn className="h-4 w-4 mr-2" />
                                        Sign In with Google
                                    </Button>
                                ) : (
                                    <p className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded border border-amber-200 dark:border-amber-900">
                                        Cloud sync is available when Firebase environment variables are configured.
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <DataManagement />

                {/* Danger Zone: Fresh Restart */}
                <Card className="border-destructive/30 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription>
                            Permanently erase all data and start completely fresh.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button
                            onClick={() => setFactoryResetConfirmOpen(true)}
                            variant="destructive"
                            className="w-full"
                            disabled={factoryResetMutation.isPending}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Fresh Restart (Erase Everything)
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            This will wipe all monthly budgets, salaries, expense transactions, category allocations, extra incomes, recurring expenses, and savings goals.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <BottomNavigation />

            {/* Reset Budget Modal */}
            {currentBudget && (
                <ResetBudgetModal
                    isOpen={resetModalOpen}
                    onClose={() => setResetModalOpen(false)}
                    budgetId={currentBudget.id}
                />
            )}

            {/* Reset Monthly Allocations Confirmation Modal */}
            <AlertDialog open={resetAllocConfirmOpen} onOpenChange={setResetAllocConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reset Monthly Allocations?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will set all category allocations for this month to zero.
                            Your logged expense transactions, categories, and monthly salary will remain untouched.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={resetAllocMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmResetAlloc}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={resetAllocMutation.isPending}
                        >
                            {resetAllocMutation.isPending ? "Resetting..." : "Yes, Reset Allocations"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Fresh Restart (Factory Reset) Confirmation Modal */}
            <AlertDialog open={factoryResetConfirmOpen} onOpenChange={setFactoryResetConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <p>
                                    This action <strong>CANNOT</strong> be undone.
                                </p>
                                <p className="text-xs">
                                    Performing a Fresh Restart will permanently erase:
                                </p>
                                <ul className="list-disc pl-5 text-xs space-y-1">
                                    <li>All monthly budgets and salary income records</li>
                                    <li>All expense transactions and history</li>
                                    <li>All budget allocations across every category</li>
                                    <li>All recurring bills & subscriptions</li>
                                    <li>All savings goals and progress</li>
                                </ul>
                                <p className="pt-1 text-xs">
                                    BudgetBuddy will return to a clean initial state, prompting you to set up a brand new budget.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={factoryResetMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmFactoryReset}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={factoryResetMutation.isPending}
                        >
                            {factoryResetMutation.isPending ? "Erasing Data..." : "Yes, Erase Everything"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <BottomNavigation />
        </div>
    );
}
