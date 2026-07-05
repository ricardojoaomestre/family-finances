import {
  getDefaultCategoryColor,
  isCategoryColorToken,
  type CategoryColorToken,
} from '@/lib/categories/category-colors';
import {
  resolveCategoryIcon,
  type CategoryIconName,
} from '@/lib/categories/category-icons';
import type { CategoryPriorMonthlySpendingRow } from '@/lib/reports/get-category-prior-monthly-spending';
import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';

export type CategorySpendingVsAverageUsage = {
  currentAmount: string;
  averageAmount: string | null;
  percentOfAverage: number;
  isOverAverage: boolean;
  hasBaseline: boolean;
};

export type CategorySpendingVsAverageRow = {
  categoryId: string | null;
  categoryName: string;
  categoryColor: CategoryColorToken;
  categoryIcon: CategoryIconName;
  usage: CategorySpendingVsAverageUsage;
};

export function buildCategorySpendingVsAverageRows(
  currentSpendingTotals: MonthReportCategoryTotal[],
  priorMonthlySpending: CategoryPriorMonthlySpendingRow[],
): CategorySpendingVsAverageRow[] {
  const averagesByCategoryId =
    computeCategoryAverageSpending(priorMonthlySpending);

  return currentSpendingTotals
    .map((row) => {
      const usage = computeCategorySpendingVsAverage(
        row.total,
        averagesByCategoryId.get(row.categoryId) ?? 0,
      );

      if (!usage) {
        return null;
      }

      return {
        categoryId: row.categoryId,
        categoryName: row.categoryName ?? 'Uncategorized',
        categoryColor: resolveRowCategoryColor(row),
        categoryIcon: resolveCategoryIcon(row.categoryIcon ?? 'tag'),
        usage,
      };
    })
    .filter((row): row is CategorySpendingVsAverageRow => row !== null)
    .sort(
      (a, b) =>
        Math.abs(Number(b.usage.currentAmount)) -
        Math.abs(Number(a.usage.currentAmount)),
    );
}

function computeCategoryAverageSpending(
  priorMonthlySpending: CategoryPriorMonthlySpendingRow[],
): Map<string | null, number> {
  const sumsByCategoryId = new Map<string | null, number>();
  const monthsWithSpendingByCategoryId = new Map<string | null, number>();

  for (const row of priorMonthlySpending) {
    const amount = Math.abs(Number(row.total));

    if (!Number.isFinite(amount) || amount <= 0) {
      continue;
    }

    sumsByCategoryId.set(
      row.categoryId,
      (sumsByCategoryId.get(row.categoryId) ?? 0) + amount,
    );
    monthsWithSpendingByCategoryId.set(
      row.categoryId,
      (monthsWithSpendingByCategoryId.get(row.categoryId) ?? 0) + 1,
    );
  }

  const averagesByCategoryId = new Map<string | null, number>();

  for (const [categoryId, sum] of sumsByCategoryId) {
    const monthsWithSpending = monthsWithSpendingByCategoryId.get(categoryId) ?? 0;

    if (monthsWithSpending > 0) {
      averagesByCategoryId.set(categoryId, sum / monthsWithSpending);
    }
  }

  return averagesByCategoryId;
}

export function computeCategorySpendingVsAverage(
  currentTotal: string,
  averageAmount: number,
): CategorySpendingVsAverageUsage | null {
  const current = Math.abs(Number(currentTotal));

  if (!Number.isFinite(current) || current <= 0) {
    return null;
  }

  if (!Number.isFinite(averageAmount) || averageAmount <= 0) {
    return {
      currentAmount: current.toFixed(2),
      averageAmount: null,
      percentOfAverage: 0,
      isOverAverage: false,
      hasBaseline: false,
    };
  }

  const percentOfAverage = Math.round((current / averageAmount) * 100);

  return {
    currentAmount: current.toFixed(2),
    averageAmount: averageAmount.toFixed(2),
    percentOfAverage,
    isOverAverage: current > averageAmount,
    hasBaseline: true,
  };
}

function resolveRowCategoryColor(
  row: MonthReportCategoryTotal,
): CategoryColorToken {
  if (row.categoryColor && isCategoryColorToken(row.categoryColor)) {
    return row.categoryColor;
  }

  if (row.categoryId) {
    return getDefaultCategoryColor(row.categoryId);
  }

  return 'amber-200';
}
