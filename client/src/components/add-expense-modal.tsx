import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Currency symbol replaced inline with 'PKR'
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateExpense } from "@/hooks/use-expenses";
import { useCategoriesWithAllocations, useCategories } from "@/hooks/use-expenses";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettings } from "@/hooks/use-settings";
import { getCategoryIcon } from "@/lib/icons";

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetId: string;
}

function ExpenseForm({ budgetId, onDone }: { budgetId: string; onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const { data: settings } = useSettings();
  const currency = settings?.currency || 'PKR';

  const { toast } = useToast();
  const createExpense = useCreateExpense();

  // Categories for this budget
  const { data: categoriesWithAllocations = [] } = useCategoriesWithAllocations(budgetId);
  const { data: allCategories = [] } = useCategories();

  // If some categories have positive allocations, show those; otherwise show all categories
  const hasAllocations = categoriesWithAllocations.some((c) => (c.allocated ?? 0) > 0);
  const availableCategories = hasAllocations
    ? categoriesWithAllocations.filter((c) => (c.allocated ?? 0) > 0)
    : allCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !categoryId) {
      toast({
        title: "Error",
        description: "Please fill in amount and select a category",
        variant: "destructive",
      });
      return;
    }

    try {
      await createExpense.mutateAsync({
        budgetId,
        expenseData: {
          amount: amount,
          description: description || "",
          categoryId,
          date,
        },
      });

      toast({
        title: "Success",
        description: "Expense added successfully",
      });

      // Reset form
      setAmount("");
      setDescription("");
      setCategoryId("");
      setDate(new Date().toISOString().slice(0, 10));
      onDone();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="amount">Amount *</Label>
        <div className="relative mt-1.5">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">{`${currency}\u00A0`}</span>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-12 h-12 text-lg tnum rounded-xl"
            data-testid="input-amount"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="category">Category *</Label>
        <Select value={categoryId} onValueChange={setCategoryId} required>
          <SelectTrigger data-testid="select-category" className="mt-1.5 h-12 rounded-xl">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {availableCategories.map((category) => {
              const CatIcon = getCategoryIcon(category.icon);
              return (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${category.color}22`, color: category.color }}
                    >
                      <CatIcon className="w-3.5 h-3.5" />
                    </div>
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          type="text"
          placeholder="What did you spend on?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1.5 h-12 rounded-xl"
          data-testid="input-description"
        />
      </div>

      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1.5 h-12 rounded-xl"
          data-testid="input-date"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          className="flex-1 h-12 rounded-xl"
          data-testid="button-cancel"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 h-12 rounded-xl font-semibold"
          disabled={createExpense.isPending}
          data-testid="button-add-expense"
        >
          {createExpense.isPending ? "Adding..." : "Add Expense"}
        </Button>
      </div>
    </form>
  );
}

export default function AddExpenseModal({ open, onOpenChange, budgetId }: AddExpenseModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="pb-safe" data-testid="add-expense-modal">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-display font-bold tracking-tight">Add Expense</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <ExpenseForm budgetId={budgetId} onDone={() => onOpenChange(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl" data-testid="add-expense-modal">
        <DialogHeader>
          <DialogTitle className="font-display font-bold tracking-tight">Add Expense</DialogTitle>
        </DialogHeader>
        <ExpenseForm budgetId={budgetId} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
