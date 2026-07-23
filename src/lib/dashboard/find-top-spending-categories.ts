import {
  getDefaultCategoryColor,
  isCategoryColorToken,
  type CategoryColorToken,
} from '@/lib/categories/category-colors';
import { formatDashboardMagnitudeTotal } from '@/lib/dashboard/compute-dashboard-net-worth';
import type { DashboardTopSpendingCategory } from '@/lib/dashboard/dashboard-month-stats';
import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';

export const DASHBOARD_TOP_SPENDING_CATEGORIES_LIMIT = 10;

const UNCATEGORIZED_KEY = 'uncategorized';
const UNCATEGORIZED_NAME = 'Uncategorized';

export function findTopSpendingCategories(
  spending: MonthReportCategoryTotal[],
  limit = DASHBOARD_TOP_SPENDING_CATEGORIES_LIMIT,
): DashboardTopSpendingCategory[] {
  return [...spending]
    .map((row) => {
      const amount = formatDashboardMagnitudeTotal(row.total);
      const numericAmount = Number(amount);

      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return null;
      }

      const key = row.categoryId ?? UNCATEGORIZED_KEY;
      const categoryColor = resolveCategoryColor(row.categoryColor, key);

      return {
        key,
        categoryId: row.categoryId,
        categoryName: row.categoryName?.trim() || UNCATEGORIZED_NAME,
        categoryColor,
        amount,
      } satisfies DashboardTopSpendingCategory;
    })
    .filter((row): row is DashboardTopSpendingCategory => row !== null)
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, limit);
}

function resolveCategoryColor(
  color: string | null,
  fallbackId: string,
): CategoryColorToken {
  if (color && isCategoryColorToken(color)) {
    return color;
  }

  return getDefaultCategoryColor(fallbackId);
}
