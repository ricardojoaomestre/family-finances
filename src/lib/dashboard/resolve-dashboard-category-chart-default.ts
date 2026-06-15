import type { CategoryOption } from '@/lib/categories/to-category-options';
import type { DashboardTopSpendingCategory } from '@/lib/dashboard/dashboard-month-stats';
import { UNCATEGORIZED_CATEGORY_VALUE } from '@/lib/transactions/validate-transaction-form';

export function resolveDashboardCategoryChartDefaultId(
  topSpendingCategory: DashboardTopSpendingCategory | null,
  spendingCategories: readonly CategoryOption[],
): string {
  if (topSpendingCategory) {
    return topSpendingCategory.categoryId ?? UNCATEGORIZED_CATEGORY_VALUE;
  }

  return spendingCategories[0]?.id ?? UNCATEGORIZED_CATEGORY_VALUE;
}

export function resolveDashboardCategoryChartCategoryId(
  selectedValue: string,
): string | null {
  return selectedValue === UNCATEGORIZED_CATEGORY_VALUE ? null : selectedValue;
}
