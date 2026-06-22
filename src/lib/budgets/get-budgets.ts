import { asc, eq } from 'drizzle-orm';

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
import {
  resolveCategoryType,
  type CategoryType,
} from '@/lib/categories/category-type';
import { requireActiveHouseholdId } from '@/lib/household/active-household';

export type BudgetRow = {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: CategoryColorToken;
  categoryIcon: CategoryIconName;
  categoryType: CategoryType;
  amount: string;
  period: 'monthly';
};

export async function getBudgets(): Promise<BudgetRow[]> {
  const householdId = await requireActiveHouseholdId();

  const rows = await db
    .select({
      id: budgets.id,
      categoryId: budgets.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
      categoryType: categories.type,
      amount: budgets.amount,
      period: budgets.period,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(eq(budgets.householdId, householdId))
    .orderBy(asc(categories.priority));

  return rows.map((row) => ({
    id: row.id,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    categoryColor: isCategoryColorToken(row.categoryColor)
      ? row.categoryColor
      : getDefaultCategoryColor(row.categoryId),
    categoryIcon: resolveCategoryIcon(row.categoryIcon),
    categoryType: resolveCategoryType(row.categoryType),
    amount: row.amount,
    period: row.period ?? 'monthly',
  }));
}
