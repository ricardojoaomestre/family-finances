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
import { formatReportMonth } from '@/lib/reports/report-month';

export type CategoryPriorMonthSpendingPoint = {
  monthDateFrom: string;
  monthLabel: string;
  amount: string;
};

export type CategorySpendingAverageContext = {
  priorMonths: CategoryPriorMonthSpendingPoint[];
  averageAmount: string | null;
  hasBaseline: boolean;
};

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
  averageContext: CategorySpendingAverageContext;
};

export function buildCategorySpendingVsAverageRows(
  currentSpendingTotals: MonthReportCategoryTotal[],
  priorMonthlySpending: CategoryPriorMonthlySpendingRow[],
): CategorySpendingVsAverageRow[] {
  const averageDataByCategoryId =
    computeCategoryAverageData(priorMonthlySpending);

  return currentSpendingTotals
    .map((row) => {
      const averageData =
        averageDataByCategoryId.get(row.categoryId) ??
        emptyCategoryAverageData();
      const usage = computeCategorySpendingVsAverage(
        row.total,
        averageData.averageAmount ?? 0,
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
        averageContext: {
          priorMonths: averageData.priorMonths,
          averageAmount: usage.averageAmount,
          hasBaseline: usage.hasBaseline,
        },
      };
    })
    .filter((row): row is CategorySpendingVsAverageRow => row !== null)
    .sort(
      (a, b) =>
        Math.abs(Number(b.usage.currentAmount)) -
        Math.abs(Number(a.usage.currentAmount)),
    );
}

type CategoryAverageData = {
  averageAmount: number | null;
  priorMonths: CategoryPriorMonthSpendingPoint[];
};

function emptyCategoryAverageData(): CategoryAverageData {
  return {
    averageAmount: null,
    priorMonths: [],
  };
}

function computeCategoryAverageData(
  priorMonthlySpending: CategoryPriorMonthlySpendingRow[],
): Map<string | null, CategoryAverageData> {
  const monthsByCategoryId = new Map<
    string | null,
    CategoryPriorMonthSpendingPoint[]
  >();

  for (const row of priorMonthlySpending) {
    const amount = Math.abs(Number(row.total));

    if (!Number.isFinite(amount) || amount <= 0) {
      continue;
    }

    const existing = monthsByCategoryId.get(row.categoryId) ?? [];

    existing.push({
      monthDateFrom: row.monthDateFrom,
      monthLabel: formatReportMonth(row.monthDateFrom),
      amount: amount.toFixed(2),
    });
    monthsByCategoryId.set(row.categoryId, existing);
  }

  const averageDataByCategoryId = new Map<string | null, CategoryAverageData>();

  for (const [categoryId, priorMonths] of monthsByCategoryId) {
    const sortedPriorMonths = [...priorMonths].sort((a, b) =>
      a.monthDateFrom.localeCompare(b.monthDateFrom),
    );
    const sum = sortedPriorMonths.reduce(
      (total, month) => total + Number(month.amount),
      0,
    );

    averageDataByCategoryId.set(categoryId, {
      priorMonths: sortedPriorMonths,
      averageAmount:
        sortedPriorMonths.length > 0 ? sum / sortedPriorMonths.length : null,
    });
  }

  return averageDataByCategoryId;
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
