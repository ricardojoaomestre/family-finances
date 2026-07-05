'use client';

import { useMemo, useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon, ArrowUpRightIcon } from 'lucide-react';

import { MonthReportCategoryDetailSheet } from '@/app/(protected)/report/new/components/month-report-category-detail-sheet';
import { CategoryIcon } from '@/components/categories/category-icon';
import { Badge } from '@/components/ui/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CategoryColorToken } from '@/lib/categories/category-colors';
import type { CategoryIconName } from '@/lib/categories/category-icons';
import { formatDisplayMoney } from '@/lib/formatters';
import type {
  CategorySpendingComparisonStatus,
  CategorySpendingVsAverageRow,
} from '@/lib/reports/build-category-spending-vs-average-rows';
import { getCategorySpendingVsAverageSummary } from '@/lib/reports/build-category-spending-vs-average-rows';
import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';
import { cn } from '@/lib/utils';

type CategoryOption = {
  id: string;
  name: string;
  color: CategoryColorToken;
  icon: CategoryIconName;
};

type SpendingVsAverageSort =
  | 'biggest-overage'
  | 'biggest-underage'
  | 'biggest-total'
  | 'category-name';

type MonthReportSpendingVsAverageProps = {
  rows: CategorySpendingVsAverageRow[];
  spendingTotals: MonthReportCategoryTotal[];
  dateFrom: string;
  dateTo: string;
  categories: CategoryOption[];
  bankAccounts: Array<{ id: string; label: string }>;
};

function formatMoneyDifference(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '—';
  }

  const formatted = formatDisplayMoney(Math.abs(amount));

  if (amount === 0) {
    return formatted;
  }

  return amount > 0 ? `+${formatted}` : `-${formatted}`;
}

function sortSpendingVsAverageRows(
  rows: CategorySpendingVsAverageRow[],
  sort: SpendingVsAverageSort,
) {
  const nextRows = [...rows];

  switch (sort) {
    case 'biggest-overage':
      return nextRows.sort((a, b) => {
        const aDiff =
          a.usage.comparisonStatus === 'over'
            ? Number(a.usage.differenceAmount ?? 0)
            : Number.NEGATIVE_INFINITY;
        const bDiff =
          b.usage.comparisonStatus === 'over'
            ? Number(b.usage.differenceAmount ?? 0)
            : Number.NEGATIVE_INFINITY;

        return bDiff - aDiff;
      });
    case 'biggest-underage':
      return nextRows.sort((a, b) => {
        const aDiff =
          a.usage.comparisonStatus === 'under'
            ? Number(a.usage.differenceAmount ?? 0)
            : Number.POSITIVE_INFINITY;
        const bDiff =
          b.usage.comparisonStatus === 'under'
            ? Number(b.usage.differenceAmount ?? 0)
            : Number.POSITIVE_INFINITY;

        return aDiff - bDiff;
      });
    case 'category-name':
      return nextRows.sort((a, b) =>
        a.categoryName.localeCompare(b.categoryName, undefined, {
          sensitivity: 'base',
        }),
      );
    case 'biggest-total':
    default:
      return nextRows.sort(
        (a, b) =>
          Math.abs(Number(b.usage.currentAmount)) -
          Math.abs(Number(a.usage.currentAmount)),
      );
  }
}

function SpendingVsAverageStatusBadge({
  status,
  percentOverAverage,
}: {
  status: CategorySpendingComparisonStatus;
  percentOverAverage: number | null;
}) {
  if (status === 'no-baseline') {
    return <Badge variant="secondary">New category</Badge>;
  }

  if (status === 'on-track') {
    return <Badge variant="secondary">On track</Badge>;
  }

  const percent = Math.abs(percentOverAverage ?? 0);

  if (status === 'over') {
    return (
      <Badge variant="destructive">
        <ArrowUpIcon aria-hidden />
        {percent}% over avg
      </Badge>
    );
  }

  return (
    <Badge variant="success">
      <ArrowDownIcon aria-hidden />
      {percent}% under avg
    </Badge>
  );
}

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
  const [selectedAverageContext, setSelectedAverageContext] =
    useState<CategorySpendingVsAverageRow['averageContext'] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sort, setSort] = useState<SpendingVsAverageSort>('biggest-overage');

  const totalsByCategoryId = useMemo(
    () =>
      new Map(
        spendingTotals.map((total) => [total.categoryId, total] as const),
      ),
    [spendingTotals],
  );

  const averageContextByCategoryId = useMemo(
    () => new Map(rows.map((row) => [row.categoryId, row.averageContext] as const)),
    [rows],
  );

  const summary = useMemo(() => getCategorySpendingVsAverageSummary(rows), [rows]);

  const sortedRows = useMemo(
    () => sortSpendingVsAverageRows(rows, sort),
    [rows, sort],
  );

  function handleViewDetails(categoryId: string | null) {
    const category = totalsByCategoryId.get(categoryId) ?? null;

    if (!category) {
      return;
    }

    setSelectedCategory(category);
    setSelectedAverageContext(
      averageContextByCategoryId.get(categoryId) ?? null,
    );
    setSheetOpen(true);
  }

  return (
    <>
      <div className="overflow-hidden rounded-md border">
        {rows.length === 0 ? (
          <div className="p-4">
            <Empty className="border border-dashed border-border/70 bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ArrowUpIcon />
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
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <p>
                  <span className="font-semibold text-destructive">
                    {summary.categoriesOverAverage}
                  </span>{' '}
                  of {summary.totalCategories} categories over average
                </p>
                {summary.categoriesOverAverage > 0 ? (
                  <p>
                    Total over avg:{' '}
                    <span className="font-semibold text-destructive">
                      {formatMoneyDifference(summary.totalOverAverage)}
                    </span>
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Sort by</span>
                <Select
                  value={sort}
                  onValueChange={(value) =>
                    setSort(value as SpendingVsAverageSort)
                  }
                >
                  <SelectTrigger size="sm" aria-label="Sort categories">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="biggest-overage">
                      Biggest overage (€)
                    </SelectItem>
                    <SelectItem value="biggest-underage">
                      Biggest underage (€)
                    </SelectItem>
                    <SelectItem value="biggest-total">
                      Highest total (€)
                    </SelectItem>
                    <SelectItem value="category-name">Category name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              {sortedRows.map((row, index) => {
                const { usage } = row;
                const differenceClassName =
                  usage.comparisonStatus === 'over'
                    ? 'text-destructive'
                    : usage.comparisonStatus === 'under'
                      ? 'text-success'
                      : 'text-muted-foreground';

                return (
                  <div
                    key={row.categoryId ?? 'uncategorized'}
                    className={cn(
                      'px-4 py-4',
                      index < sortedRows.length - 1 && 'border-b',
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <CategoryIcon
                          icon={row.categoryIcon}
                          color={row.categoryColor}
                          className="size-9 shrink-0 rounded-lg [&_svg]:size-4"
                        />
                        <div className="min-w-0 space-y-1.5">
                          <p className="truncate font-medium">
                            {row.categoryName}
                          </p>
                          <SpendingVsAverageStatusBadge
                            status={usage.comparisonStatus}
                            percentOverAverage={usage.percentOverAverage}
                          />
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <p className="text-base font-semibold font-mono tabular-nums">
                          {formatDisplayMoney(usage.currentAmount)}
                        </p>
                        {usage.hasBaseline && usage.averageAmount ? (
                          <p className="text-sm text-muted-foreground">
                            avg {formatDisplayMoney(usage.averageAmount)}
                            {' · '}
                            <span
                              className={cn(
                                'font-mono tabular-nums',
                                differenceClassName,
                              )}
                            >
                              {formatMoneyDifference(usage.differenceAmount)}
                            </span>
                          </p>
                        ) : null}
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={`View details for ${row.categoryName}`}
                          onClick={() => handleViewDetails(row.categoryId)}
                        >
                          View details
                          <ArrowUpRightIcon className="size-3.5 shrink-0" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <MonthReportCategoryDetailSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);

          if (!open) {
            setSelectedCategory(null);
            setSelectedAverageContext(null);
          }
        }}
        dateFrom={dateFrom}
        dateTo={dateTo}
        category={selectedCategory}
        categories={categories}
        bankAccounts={bankAccounts}
        spendingAverageContext={selectedAverageContext}
      />
    </>
  );
}
