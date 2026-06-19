import { asc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { categories } from '@/db/schema';
import { requireActiveHouseholdId } from '@/lib/household/active-household';
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

export type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  color: CategoryColorToken;
  icon: CategoryIconName;
  pattern: string | null;
  priority: number;
  active: boolean;
  type: CategoryType;
};

export async function getCategories(): Promise<CategoryRow[]> {
  const householdId = await requireActiveHouseholdId();
  return db
    .select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
      color: categories.color,
      icon: categories.icon,
      pattern: categories.pattern,
      priority: categories.priority,
      active: categories.active,
      type: categories.type,
    })
    .from(categories)
    .where(eq(categories.householdId, householdId))
    .orderBy(asc(categories.priority))
    .then((rows) =>
      rows.map((row) => ({
        ...row,
        color: isCategoryColorToken(row.color)
          ? row.color
          : getDefaultCategoryColor(row.id),
        icon: resolveCategoryIcon(row.icon),
        type: resolveCategoryType(row.type),
      })),
    );
}
