import { Card, CardContent } from "@/components/ui/card";
import { type CategoryWithAllocation } from "@/types";
import { useSettings } from "@/hooks/use-settings";
import { getCategoryIcon } from "@/lib/icons";
import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";

interface CategoryTileProps {
  category: CategoryWithAllocation;
  onClick?: (categoryId: string) => void;
}

export default function CategoryTile({ category, onClick }: CategoryTileProps) {
  const { data: settings } = useSettings();
  const currency = settings?.currency || "PKR";
  const IconComponent = getCategoryIcon(category.icon);

  const spentPercentage =
    category.allocated > 0 ? (category.spent / category.allocated) * 100 : 0;
  const isOverspent = category.spent > category.allocated;
  const isNearLimit = !isOverspent && spentPercentage >= 80;

  return (
    <Card
      className={`rounded-2xl shadow-sm border border-border/80 transition-all duration-200 overflow-hidden ${
        onClick
          ? "cursor-pointer hover:shadow-md hover:border-primary/40 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          : ""
      }`}
      data-testid={`category-tile-${category.id}`}
      onClick={() => onClick?.(category.id)}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick(category.id);
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={
        onClick
          ? `${category.name}, ${Math.round(spentPercentage)} percent used`
          : undefined
      }
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200"
              style={{
                backgroundColor: `${category.color}1c`,
                color: category.color,
              }}
            >
              <IconComponent className="w-5 h-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3
                  className="font-display font-semibold tracking-tight truncate text-sm sm:text-base"
                  data-testid={`category-name-${category.id}`}
                >
                  {category.name}
                </h3>
                {isOverspent && (
                  <span className="inline-flex items-center text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-full">
                    Over
                  </span>
                )}
                {isNearLimit && (
                  <span className="inline-flex items-center text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                    80%+
                  </span>
                )}
              </div>
              <p
                className="text-xs text-muted-foreground tnum mt-0.5"
                data-testid={`category-transactions-${category.id}`}
              >
                {category.transactionCount} transaction{category.transactionCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p
              className={`font-display font-bold text-sm sm:text-base tnum ${
                isOverspent ? "text-rose-600 dark:text-rose-400" : "text-foreground"
              }`}
              data-testid={`category-spent-${category.id}`}
            >
              {currency} {category.spent.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground tnum">
              of <span data-testid={`category-allocated-${category.id}`}>{currency} {category.allocated.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="w-full bg-muted/80 rounded-full h-2 overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(Math.min(spentPercentage, 100))}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              isOverspent
                ? "bg-rose-500"
                : isNearLimit
                ? "bg-amber-500"
                : ""
            }`}
            style={{
              width: `${Math.min(spentPercentage, 100)}%`,
              backgroundColor: !isOverspent && !isNearLimit ? category.color : undefined,
            }}
            data-testid={`category-progress-${category.id}`}
          />
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs mt-2.5 pt-0.5">
          <span className="text-muted-foreground tnum font-medium">
            {Math.round(spentPercentage)}% spent
          </span>

          <div className="flex items-center gap-1">
            <span
              className={`font-semibold tnum ${
                isOverspent
                  ? "text-rose-600 dark:text-rose-400"
                  : isNearLimit
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
              data-testid={`category-remaining-${category.id}`}
            >
              {isOverspent
                ? `${currency} ${Math.abs(category.remaining).toLocaleString()} over`
                : `${currency} ${category.remaining.toLocaleString()} left`}
            </span>
            {onClick && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
