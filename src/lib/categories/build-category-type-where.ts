import { inArray, notInArray, or, sql, type SQL } from 'drizzle-orm';

import { categories, transactions } from '@/db/schema';
import {
  categoryTypesExcludedFromSpendingTotals,
  type CategoryType,
} from '@/lib/categories/category-type';

export function buildExcludeCategoryTypesCondition(
  excludedTypes: CategoryType[],
): SQL | undefined {
  if (excludedTypes.length === 0) {
    return undefined;
  }

  return or(
    sql`${transactions.categoryId} IS NULL`,
    notInArray(categories.type, excludedTypes),
  );
}

export function buildExcludeTransfersFromSpendingCondition(): SQL | undefined {
  return buildExcludeCategoryTypesCondition(
    categoryTypesExcludedFromSpendingTotals,
  );
}

export function buildCategoryTypesCondition(
  includedTypes: CategoryType[],
): SQL | undefined {
  if (includedTypes.length === 0) {
    return undefined;
  }

  return inArray(categories.type, includedTypes);
}
