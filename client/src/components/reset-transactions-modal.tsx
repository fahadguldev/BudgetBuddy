import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useResetTransactions } from "@/hooks/use-reset-transactions";

interface ResetTransactionsModalProps {
  budgetId: string;
  transactionCount?: number;
  children?: React.ReactNode;
}

export default function ResetTransactionsModal({ 
  budgetId, 
  transactionCount = 0,
  children 
}: ResetTransactionsModalProps) {
  const resetTransactions = useResetTransactions();

  const handleReset = async () => {
    try {
      await resetTransactions.mutateAsync({ budgetId });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children || (
          <Button 
            variant="destructive" 
            size="sm"
            disabled={transactionCount === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Reset Transactions
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset All Transactions?</AlertDialogTitle>
          <AlertDialogDescription>  
            This action cannot be undone. This will permanently delete all{" "}
            <strong>{transactionCount}</strong> transaction{transactionCount !== 1 ? "s" : ""} for this month
            and reset your spending data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={resetTransactions.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {resetTransactions.isPending ? "Resetting..." : "Reset Transactions"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
