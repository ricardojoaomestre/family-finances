import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { budgets, categories } from '@/db/schema';
import {
  getDefaultCategoryColor,
  isCategoryColorToken,
  type CategoryColorToken,
} from '@/lib/categories/category-colors';
import {
  resolveCategoryIcon,
  type CategoryIconName,
} from '@/lib/categories/category-icons';
import { isSpendingCategoryType } from '@/lib/categories/category-type';
import {
  computeCategoryBudgetUsage,
  type CategoryBudgetUsage,
} from '@/lib/budgets/compute-category-budget-usage';
import { requireActiveHouseholdId } from '@/lib/household/active-household';
import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';

export type CategoryBudgetProgressRow = {
  categoryId: string;
  categoryName: string;
  categoryColor: CategoryColorToken;
  categoryIcon: CategoryIconName;
  budgetAmount: string;
  usage: CategoryBudgetUsage;
};

export async function getCategoryBudgetProgressRows(
  categoryTotals: MonthReportCategoryTotal[],
): Promise<CategoryBudgetProgressRow[]> {
  const householdId = await requireActiveHouseholdId();

  const budgetRows = await db
    .select({
      categoryId: budgets.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
      categoryType: categories.type,
      amount: budgets.amount,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(eq(budgets.householdId, householdId));

  if (budgetRows.length === 0) {
    return [];
  }

  const totalsByCategoryId = new Map(
    categoryTotals
      .filter((row) => row.categoryId !== null)
      .map((row) => [row.categoryId!, row.total]),
  );

  return budgetRows
    .filter((row) => isSpendingCategoryType(row.categoryType))
    .map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      categoryColor: isCategoryColorToken(row.categoryColor)
        ? row.categoryColor
        : getDefaultCategoryColor(row.categoryId),
      categoryIcon: resolveCategoryIcon(row.categoryIcon),
      budgetAmount: row.amount,
      usage: computeCategoryBudgetUsage(
        row.amount,
        totalsByCategoryId.get(row.categoryId) ?? '0',
      ),
    }))
    .sort((a, b) => b.usage.percentUsed - a.usage.percentUsed);
}
