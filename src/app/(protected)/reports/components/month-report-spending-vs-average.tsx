'use client';

import { useMemo, useState } from 'react';
import { ChevronRightIcon, TrendingUpIcon } from 'lucide-react';

import { MonthReportCategoryDetailSheet } from '@/app/(protected)/report/new/components/month-report-category-detail-sheet';
import { CategoryIcon } from '@/components/categories/category-icon';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Progress } from '@/components/ui/progress';
import { getBudgetProgressValue } from '@/lib/budgets/compute-category-budget-usage';
import type { CategoryColorToken } from '@/lib/categories/category-colors';
import type { CategoryIconName } from '@/lib/categories/category-icons';
import type { CategorySpendingVsAverageRow } from '@/lib/reports/build-category-spending-vs-average-rows';
import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';
import { formatDisplayMoney } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type CategoryOption = {
  id: string;
  name: string;
  color: CategoryColorToken;
  icon: CategoryIconName;
};

type MonthReportSpendingVsAverageProps = {
  rows: CategorySpendingVsAverageRow[];
  spendingTotals: MonthReportCategoryTotal[];
  dateFrom: string;
  dateTo: string;
  categories: CategoryOption[];
  bankAccounts: Array<{ id: string; label: string }>;
};

export function MonthReportSpendingVsAverage({
  rows,
  spendingTotals,
  dateFrom,
  dateTo,
  categories,
  bankAccounts,
}: MonthReportSpendingVsAverageProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<MonthReportCategoryTotal | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const totalsByCategoryId = useMemo(
    () =>
      new Map(
        spendingTotals.map((total) => [total.categoryId, total] as const),
      ),
    [spendingTotals],
  );

  function handleViewDetails(categoryId: string | null) {
    const category = totalsByCategoryId.get(categoryId) ?? null;

    if (!category) {
      return;
    }

    setSelectedCategory(category);
    setSheetOpen(true);
  }

  return (
    <>
      <div className="overflow-hidden rounded-md border">
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-2 text-base font-semibold">
            <TrendingUpIcon className="size-4 text-muted-foreground" />
            Spending vs average
          </div>
          <p className="text-sm text-muted-foreground">
            Compared to your last 6 months
          </p>
        </div>
        {rows.length === 0 ? (
          <div className="p-4">
            <Empty className="border border-dashed border-border/70 bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TrendingUpIcon />
                </EmptyMedia>
                <EmptyTitle>No spending this month</EmptyTitle>
                <EmptyDescription>
                  Categories with spending will appear here compared to their
                  recent average.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="space-y-5 p-4">
            {rows.map((row) => (
              <div key={row.categoryId ?? 'uncategorized'} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <CategoryIcon
                      icon={row.categoryIcon}
                      color={row.categoryColor}
                      className="size-8 shrink-0 rounded-lg [&_svg]:size-3.5"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {row.categoryName}
                      </p>
                      {!row.usage.hasBaseline ? (
                        <p className="text-xs text-muted-foreground">
                          No prior average
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p
                      className={cn(
                        'text-right text-sm font-mono tabular-nums',
                        row.usage.hasBaseline && row.usage.isOverAverage
                          ? 'text-destructive'
                          : 'text-muted-foreground',
                      )}
                    >
                      {formatDisplayMoney(row.usage.currentAmount)}
                      {' / '}
                      {row.usage.hasBaseline
                        ? `${formatDisplayMoney(row.usage.averageAmount)} avg`
                        : '— avg'}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`View details for ${row.categoryName}`}
                      onClick={() => handleViewDetails(row.categoryId)}
                    >
                      <span className="hidden sm:inline">View details</span>
                      <ChevronRightIcon className="sm:hidden" />
                    </Button>
                  </div>
                </div>
                <Progress
                  value={
                    row.usage.hasBaseline
                      ? getBudgetProgressValue(row.usage.percentOfAverage)
                      : 0
                  }
                  className={cn(
                    row.usage.hasBaseline &&
                      row.usage.isOverAverage &&
                      '[&_[data-slot=progress-indicator]]:bg-destructive',
                  )}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <MonthReportCategoryDetailSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);

          if (!open) {
            setSelectedCategory(null);
          }
        }}
        dateFrom={dateFrom}
        dateTo={dateTo}
        category={selectedCategory}
        categories={categories}
        bankAccounts={bankAccounts}
      />
    </>
  );
}
