import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { storageService } from "@/lib/storage";
import { queryClient } from "@/lib/queryClient";
import { useSettings } from "@/hooks/use-settings";
import {
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  CATEGORY_PRESETS,
  getCategoryIcon,
  type CategoryPreset,
} from "@/lib/icons";
import { Sparkles, Plus } from "lucide-react";

interface CreateCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetId?: string;
  onCreated?: (categoryId: string) => void;
}

export default function CreateCategoryModal({
  open,
  onOpenChange,
  budgetId,
  onCreated,
}: CreateCategoryModalProps) {
  const { toast } = useToast();
  const { data: settings } = useSettings();
  const currency = settings?.currency || "PKR";

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("shopping-cart");
  const [color, setColor] = useState("#10B981");
  const [initialAllocation, setInitialAllocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PreviewIcon = getCategoryIcon(icon);
  const allocNum = Number(initialAllocation) || 0;

  const handleApplyPreset = (preset: CategoryPreset) => {
    setName(preset.name);
    setIcon(preset.icon);
    setColor(preset.color);
  };

  const resetForm = () => {
    setName("");
    setIcon("shopping-cart");
    setColor("#10B981");
    setInitialAllocation("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the category.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const newCategory = await storageService.createCategory({
        name: name.trim(),
        icon,
        color,
        isDefault: false,
      });

      // If an allocation was entered and budgetId exists, allocate immediately
      if (budgetId && allocNum > 0) {
        await storageService.createBudgetAllocation({
          budgetId,
          categoryId: newCategory.id,
          allocatedAmount: String(allocNum),
        });
      }

      // Invalidate queries so dashboard & manage budget update instantly
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      queryClient.invalidateQueries();

      toast({
        title: "Category Created",
        description: `"${newCategory.name}" is now ready to track spending.`,
      });

      onCreated?.(newCategory.id);
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentColorObj =
    CATEGORY_COLORS.find(
      (c) => c.value.toLowerCase() === color.toLowerCase()
    ) || { value: color, label: "Custom Color" };

  const currentIconObj =
    CATEGORY_ICONS.find((i) => i.value === icon) || {
      value: icon,
      label: "Custom Icon",
      icon: PreviewIcon,
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-3xl p-4 sm:p-6 border border-border shadow-2xl">
        <DialogHeader className="pb-1 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="font-display text-lg sm:text-xl font-bold truncate">
                New Budget Category
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate">
                Organize expenses and set monthly spending caps
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Live Visual Preview */}
        <div className="my-1 p-3.5 rounded-2xl bg-card border border-border shadow-sm max-w-full overflow-hidden">
          <p className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" /> Live Preview
          </p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200"
                style={{ backgroundColor: `${color}18`, color }}
              >
                <PreviewIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display font-semibold tracking-tight truncate text-sm">
                  {name.trim() || "Category Name"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  0 transactions
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display font-semibold text-sm tnum">
                {currency} 0
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                of {currency} {allocNum.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: allocNum > 0 ? "20%" : "0%",
                backgroundColor: color,
              }}
            />
          </div>
        </div>

        {/* Quick Presets (Wrapped cleanly without horizontal overflow) */}
        <div className="space-y-1.5 max-w-full">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Popular Presets
          </Label>
          <div className="flex flex-wrap gap-1.5 max-w-full">
            {CATEGORY_PRESETS.slice(0, 8).map((preset) => {
              const isSelected = name === preset.name;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`text-xs px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 shrink-0 transition-all active:scale-95 ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary font-medium shadow-sm"
                      : "bg-muted/40 hover:bg-muted text-foreground border-border/80"
                  }`}
                >
                  <span>{preset.emoji}</span>
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-3.5 pt-1 max-w-full">
          {/* Category Name */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-name" className="text-xs font-medium">
              Category Name *
            </Label>
            <Input
              id="cat-name"
              placeholder="e.g. Fuel, Groceries, Dining"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl"
              maxLength={40}
              required
              autoFocus
            />
          </div>

          {/* Initial Monthly Allocation (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="cat-alloc" className="text-xs font-medium">
                Monthly Budget Allocation ({currency})
              </Label>
              <span className="text-[11px] text-muted-foreground">Optional</span>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">
                {currency}
              </div>
              <Input
                id="cat-alloc"
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 5000"
                value={initialAllocation}
                onChange={(e) => setInitialAllocation(e.target.value)}
                className="h-11 rounded-xl pl-12"
              />
            </div>
          </div>

          {/* Color Selection - Dropdown List */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-color" className="text-xs font-medium">
              Theme Color *
            </Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger id="cat-color" className="h-11 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-medium">
                    {currentColorObj.label}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {CATEGORY_COLORS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2.5 py-0.5">
                      <div
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-sm"
                        style={{ backgroundColor: c.value }}
                      />
                      <span className="text-sm font-medium">{c.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Icon Selection - Dropdown List */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-icon" className="text-xs font-medium">
              Category Icon *
            </Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger id="cat-icon" className="h-11 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}1c`, color }}
                  >
                    <PreviewIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium">
                    {currentIconObj.label}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {CATEGORY_ICONS.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <SelectItem key={item.value} value={item.value}>
                      <div className="flex items-center gap-2.5 py-0.5">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${color}18`, color }}
                        >
                          <ItemIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              className="flex-1 h-11 rounded-xl"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 rounded-xl font-semibold shadow-md active:scale-98"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? "Creating..." : "Create Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
