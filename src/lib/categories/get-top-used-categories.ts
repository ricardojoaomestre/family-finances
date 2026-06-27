import { and, desc, eq, isNotNull, sql } from 'drizzle-orm';

import { db } from '@/db';
import { categories, transactions } from '@/db/schema';
import {
  getDefaultCategoryColor,
  isCategoryColorToken,
} from '@/lib/categories/category-colors';
import {
  resolveCategoryIcon,
} from '@/lib/categories/category-icons';
import { resolveCategoryType } from '@/lib/categories/category-type';
import type { CategorySelectorItem } from '@/lib/categories/filter-category-selector-items';
import { requireActiveHouseholdId } from '@/lib/household/active-household';

export async function getTopUsedCategories(
  limit = 15,
): Promise<CategorySelectorItem[]> {
  const householdId = await requireActiveHouseholdId();

  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      color: categories.color,
      icon: categories.icon,
      type: categories.type,
      active: categories.active,
      usageCount: sql<number>`count(${transactions.id})::int`,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.householdId, householdId),
        eq(categories.householdId, householdId),
        eq(categories.active, true),
        isNotNull(transactions.categoryId),
      ),
    )
    .groupBy(
      categories.id,
      categories.name,
      categories.color,
      categories.icon,
      categories.type,
      categories.active,
    )
    .orderBy(desc(sql`count(${transactions.id})`))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: isCategoryColorToken(row.color)
      ? row.color
      : getDefaultCategoryColor(row.id),
    icon: resolveCategoryIcon(row.icon),
    type: resolveCategoryType(row.type),
    active: row.active,
  }));
}
