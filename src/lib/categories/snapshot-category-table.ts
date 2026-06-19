import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { categories, categoryImportSnapshots } from '@/db/schema';
import { resolveCategoryType } from '@/lib/categories/category-type';
import type { CategorySnapshotRow } from '@/lib/categories/import/types';
import { isMissingRelationError } from '@/lib/db/format-db-error';

export async function loadCategoryTableSnapshot(
  householdId: string,
): Promise<CategorySnapshotRow[]> {
  const rows = await db
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
    .where(eq(categories.householdId, householdId));

  return rows.map((row) => ({
    ...row,
    type: resolveCategoryType(row.type),
  }));
}

export async function saveCategoryImportSnapshot(
  householdId: string,
  payload: CategorySnapshotRow[],
): Promise<void> {
  const now = new Date();

  await db
    .insert(categoryImportSnapshots)
    .values({
      householdId,
      payload,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: categoryImportSnapshots.householdId,
      set: {
        payload,
        createdAt: now,
      },
    });
}

export async function clearCategoryImportSnapshot(
  householdId: string,
): Promise<void> {
  await db
    .delete(categoryImportSnapshots)
    .where(eq(categoryImportSnapshots.householdId, householdId));
}

export async function loadSavedCategoryImportSnapshot(
  householdId: string,
): Promise<CategorySnapshotRow[] | null> {
  try {
    const [row] = await db
      .select({ payload: categoryImportSnapshots.payload })
      .from(categoryImportSnapshots)
      .where(eq(categoryImportSnapshots.householdId, householdId))
      .limit(1);

    return row?.payload ?? null;
  } catch (error) {
    if (isMissingRelationError(error, 'category_import_snapshot')) {
      return null;
    }

    throw error;
  }
}
