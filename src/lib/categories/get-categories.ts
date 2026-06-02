import { asc } from 'drizzle-orm';

import { db } from '@/db';
import { categories } from '@/db/schema';
import {
  getDefaultCategoryColor,
  isCategoryColorToken,
  type CategoryColorToken,
} from '@/lib/categories/category-colors';
import {
  resolveCategoryType,
  type CategoryType,
} from '@/lib/categories/category-type';

export type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  color: CategoryColorToken;
  pattern: string | null;
  priority: number;
  active: boolean;
  type: CategoryType;
};

export async function getCategories(): Promise<CategoryRow[]> {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
      color: categories.color,
      pattern: categories.pattern,
      priority: categories.priority,
      active: categories.active,
      type: categories.type,
    })
    .from(categories)
    .orderBy(asc(categories.priority))
    .then((rows) =>
      rows.map((row) => ({
        ...row,
        color: isCategoryColorToken(row.color)
          ? row.color
          : getDefaultCategoryColor(row.id),
        type: resolveCategoryType(row.type),
      })),
    );
}
