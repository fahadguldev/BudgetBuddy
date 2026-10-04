import { type Budget, type Category, type BudgetAllocation, type Expense, type CategoryWithAllocation, type BudgetSummary, type RecurringExpense, type SavingsGoal, type AppSettings } from "@/types";
import { db, auth } from "./firebase";
import { doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { indexedDBStorage } from "./indexeddb-storage";

class StorageService {
  private get userId(): string | undefined {
    return auth?.currentUser?.uid;
  }

  private get isCloud(): boolean {
    return Boolean(this.userId && db);
  }

  private cleanDoc<T extends Record<string, any>>(obj: T): T {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    }
    return cleaned;
  }

  // Non-blocking fire-and-forget sync to Firestore
  private syncToCloud(collectionName: string, id: string, data: any) {
    if (!this.isCloud || !this.userId || !db) return;
    try {
      const ref = doc(db, "users", this.userId, collectionName, id);
      setDoc(ref, this.cleanDoc(data)).catch((err) => {
        console.warn(`[CloudSync] Background sync failed for ${collectionName}/${id}:`, err?.message || err);
      });
    } catch (e) {
      console.warn(`[CloudSync] Trigger error:`, e);
    }
  }

  private deleteFromCloud(collectionName: string, id: string) {
    if (!this.isCloud || !this.userId || !db) return;
    try {
      const ref = doc(db, "users", this.userId, collectionName, id);
      deleteDoc(ref).catch((err) => {
        console.warn(`[CloudSync] Background delete failed for ${collectionName}/${id}:`, err?.message || err);
      });
    } catch (e) {
      console.warn(`[CloudSync] Trigger error:`, e);
    }
  }

  constructor() {
    indexedDBStorage.initializeData().catch(console.error);
  }

  async initializeData() {
    return indexedDBStorage.initializeData();
  }

  // --- SETTINGS ---
  async getSettings(): Promise<AppSettings> {
    return indexedDBStorage.getSettings();
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const updated = await indexedDBStorage.updateSettings(settings);
    this.syncToCloud('settings', 'app_settings', updated);
    return updated;
  }

  // --- EXPORT/IMPORT ---
  async exportData(): Promise<string> {
    return indexedDBStorage.exportData();
  }

  async importData(jsonString: string): Promise<void> {
    await indexedDBStorage.importData(jsonString);
  }

  // --- BUDGETS ---
  async getBudget(month: string): Promise<Budget | undefined> {
    return indexedDBStorage.getBudget(month);
  }

  async createBudget(budgetData: { monthlyIncome: string; month: string }): Promise<Budget> {
    const newBudget = await indexedDBStorage.createBudget(budgetData);
    this.syncToCloud('budgets', newBudget.id, newBudget);
    return newBudget;
  }

  async updateBudget(id: string, updateData: Partial<{ monthlyIncome: string; month: string }>): Promise<Budget> {
    const updated = await indexedDBStorage.updateBudget(id, updateData);
    this.syncToCloud('budgets', id, updated);
    return updated;
  }

  async getBudgets(): Promise<Budget[]> {
    return indexedDBStorage.getBudgets();
  }

  async getRecentBudgets(limitNum: number = 8): Promise<Budget[]> {
    return indexedDBStorage.getRecentBudgets(limitNum);
  }

  // --- CALCULATIONS ---
  async calculatePreviousMonthRemaining(month: string): Promise<{ remaining: number; wasOverspent: boolean; rollover: number }> {
    return indexedDBStorage.calculatePreviousMonthRemaining(month);
  }

  async getPreviousMonthTotalAllocated(month: string): Promise<number> {
    return indexedDBStorage.getPreviousMonthTotalAllocated(month);
  }

  async createBudgetWithRollover(budgetData: { monthlyIncome: string; month: string; includeRollover?: boolean }): Promise<Budget> {
    const newBudget = await indexedDBStorage.createBudgetWithRollover(budgetData);
    this.syncToCloud('budgets', newBudget.id, newBudget);
    return newBudget;
  }

  async resetMonthlyBudget(params: { budgetId: string; newIncome: string; includeRollover: boolean }): Promise<Budget> {
    const updated = await indexedDBStorage.resetMonthlyBudget(params);
    this.syncToCloud('budgets', updated.id, updated);
    return updated;
  }

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    return indexedDBStorage.getCategories();
  }

  async createCategory(categoryData: { name: string; icon: string; color: string; isDefault?: boolean }): Promise<Category> {
    const newCat = await indexedDBStorage.createCategory(categoryData);
    this.syncToCloud('categories', newCat.id, newCat);
    return newCat;
  }

  async deleteCategory(id: string): Promise<void> {
    await indexedDBStorage.deleteCategory(id);
    this.deleteFromCloud('categories', id);
  }

  // --- ALLOCATIONS ---
  async getBudgetAllocations(budgetId: string): Promise<BudgetAllocation[]> {
    return indexedDBStorage.getBudgetAllocations(budgetId);
  }
  
  async getAllocations(): Promise<BudgetAllocation[]> {
    return indexedDBStorage.getAllocations();
  }

  async createBudgetAllocation(data: { budgetId: string; categoryId: string; allocatedAmount: string }): Promise<BudgetAllocation> {
    const newAlloc = await indexedDBStorage.createBudgetAllocation(data);
    this.syncToCloud('allocations', newAlloc.id, newAlloc);
    return newAlloc;
  }

  async updateBudgetAllocation(id: string, updateData: Partial<{ allocatedAmount: string }>): Promise<BudgetAllocation> {
    const updated = await indexedDBStorage.updateBudgetAllocation(id, updateData);
    this.syncToCloud('allocations', id, updated);
    return updated;
  }
  
  async deleteBudgetAllocation(id: string): Promise<void> {
    await indexedDBStorage.deleteBudgetAllocation(id);
    this.deleteFromCloud('allocations', id);
  }
  
  async copyAllocations(fromBudgetId: string, toBudgetId: string): Promise<void> {
    await indexedDBStorage.copyAllocations(fromBudgetId, toBudgetId);
    const newAllocations = await indexedDBStorage.getBudgetAllocations(toBudgetId);
    for (const alloc of newAllocations) {
      this.syncToCloud('allocations', alloc.id, alloc);
    }
  }

  async resetBudgetAllocations(budgetId: string): Promise<void> {
    const allocations = await indexedDBStorage.getBudgetAllocations(budgetId);
    await indexedDBStorage.resetBudgetAllocations(budgetId);
    if (this.isCloud && this.userId && db) {
      try {
        const batch = writeBatch(db);
        for (const a of allocations) {
          batch.delete(doc(db, "users", this.userId, "allocations", a.id));
        }
        batch.commit().catch(console.warn);
      } catch (e) {
        console.warn("[CloudSync] resetBudgetAllocations cloud error:", e);
      }
    }
  }

  // --- EXPENSES ---
  async getAllExpenses(): Promise<Expense[]> {
    return indexedDBStorage.getAllExpenses();
  }

  async getExpenses(budgetId: string, includeArchived: boolean = true): Promise<Expense[]> {
    return indexedDBStorage.getExpenses(budgetId, includeArchived);
  }

  async createExpense(data: { amount: string; description: string; categoryId: string; budgetId: string; date: string }): Promise<Expense> {
    const newExp = await indexedDBStorage.createExpense(data);
    this.syncToCloud('expenses', newExp.id, newExp);
    return newExp;
  }

  async deleteExpense(id: string): Promise<void> {
    await indexedDBStorage.deleteExpense(id);
    this.deleteFromCloud('expenses', id);
  }
  
  async resetBudgetExpenses(budgetId: string): Promise<void> {
    const expenses = await indexedDBStorage.getExpenses(budgetId);
    await indexedDBStorage.resetBudgetExpenses(budgetId);
    if (this.isCloud && this.userId && db) {
      try {
        const batch = writeBatch(db);
        for (const e of expenses) {
          batch.delete(doc(db, "users", this.userId, "expenses", e.id));
        }
        batch.commit().catch(console.warn);
      } catch (e) {
        console.warn("[CloudSync] resetBudgetExpenses cloud error:", e);
      }
    }
  }
  
  async archiveCurrentMonthExpenses(budgetId: string): Promise<number> {
    const count = await indexedDBStorage.archiveCurrentMonthExpenses(budgetId);
    const expenses = await indexedDBStorage.getExpenses(budgetId, true);
    for (const e of expenses) {
      this.syncToCloud('expenses', e.id, e);
    }
    return count;
  }
  
  // --- INCOMES ---
  async getIncomeRecords(budgetId?: string): Promise<any[]> {
    return indexedDBStorage.getIncomeRecords(budgetId);
  }

  async createIncomeRecord(data: any): Promise<any> {
    const newInc = await indexedDBStorage.createIncomeRecord(data);
    this.syncToCloud('incomes', newInc.id, newInc);
    return newInc;
  }

  // --- RECURRING & SAVINGS ---
  async getRecurringExpenses(): Promise<RecurringExpense[]> {
    return indexedDBStorage.getRecurringExpenses();
  }
  
  async createRecurringExpense(data: any): Promise<RecurringExpense> {
    const newRec = await indexedDBStorage.createRecurringExpense(data);
    this.syncToCloud('recurring_expenses', newRec.id, newRec);
    return newRec;
  }
  
  async deleteRecurringExpense(id: string): Promise<void> {
    await indexedDBStorage.deleteRecurringExpense(id);
    this.deleteFromCloud('recurring_expenses', id);
  }
  
  async processRecurringExpenses(): Promise<void> {
    return indexedDBStorage.processRecurringExpenses();
  }

  async getSavingsGoals(): Promise<SavingsGoal[]> {
    return indexedDBStorage.getSavingsGoals();
  }

  async createSavingsGoal(data: any): Promise<SavingsGoal> {
    const newGoal = await indexedDBStorage.createSavingsGoal(data);
    this.syncToCloud('savings_goals', newGoal.id, newGoal);
    return newGoal;
  }
  
  async updateSavingsGoal(id: string, data: any): Promise<SavingsGoal> {
    const updated = await indexedDBStorage.updateSavingsGoal(id, data);
    this.syncToCloud('savings_goals', id, updated);
    return updated;
  }

  async addSavingsContribution(id: string, amount: number, note?: string, sourceCategory?: string): Promise<SavingsGoal> {
    const updated = await indexedDBStorage.addSavingsContribution(id, amount, note, sourceCategory);
    this.syncToCloud('savings_goals', id, updated);
    return updated;
  }

  async sweepCategoryRemainingToSavings(params: {
    budgetId: string;
    targetSavingsGoalId: string;
    categorySweepItems: Array<{ categoryId: string; categoryName: string; amount: number }>;
    note?: string;
  }): Promise<{ sweptTotal: number; updatedGoal: SavingsGoal }> {
    const result = await indexedDBStorage.sweepCategoryRemainingToSavings(params);
    this.syncToCloud('savings_goals', result.updatedGoal.id, result.updatedGoal);
    return result;
  }
  
  async deleteSavingsGoal(id: string): Promise<void> {
    await indexedDBStorage.deleteSavingsGoal(id);
    this.deleteFromCloud('savings_goals', id);
  }

  // --- ANALYTICS ---
  async getCategoriesWithAllocations(budgetId: string): Promise<CategoryWithAllocation[]> {
    return indexedDBStorage.getCategoriesWithAllocations(budgetId);
  }

  async getBudgetSummary(budgetId: string): Promise<BudgetSummary> {
    return indexedDBStorage.getBudgetSummary(budgetId);
  }

  // --- FACTORY RESET ---
  async factoryReset(): Promise<void> {
    await indexedDBStorage.factoryReset();
  }
}

export const storageService = new StorageService();