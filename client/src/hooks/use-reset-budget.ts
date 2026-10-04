import { useMutation, useQueryClient } from "@tanstack/react-query";
import { storageService } from "@/lib/storage";
import { useToast } from "./use-toast";

export function useResetBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      budgetId: string;
      newIncome: string;
      includeRollover: boolean;
    }) => {
      return storageService.resetMonthlyBudget(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["budget-summary"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-allocations"] });
      
      toast({
        title: "Budget Reset Successfully",
        description: "Your monthly budget has been reset with new income.",
      });
    },
    onError: (error) => {
      console.error("Reset budget error:", error);
      toast({
        title: "Error",
        description: "Failed to reset budget. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useResetAllocations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (budgetId: string) => {
      return storageService.resetBudgetAllocations(budgetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      queryClient.invalidateQueries({ queryKey: ["budget-summary"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-allocations"] });

      toast({
        title: "Allocations Reset",
        description: "All monthly category allocations have been reset to zero.",
      });
    },
    onError: (error) => {
      console.error("Reset allocations error:", error);
      toast({
        title: "Error",
        description: "Failed to reset allocations. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useFactoryReset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      return storageService.factoryReset();
    },
    onSuccess: () => {
      queryClient.clear();

      toast({
        title: "Fresh Restart Complete",
        description: "All budgets, expenses, and records have been cleared.",
      });
    },
    onError: (error) => {
      console.error("Factory reset error:", error);
      toast({
        title: "Error",
        description: "Failed to perform factory reset. Please try again.",
        variant: "destructive",
      });
    },
  });
}
