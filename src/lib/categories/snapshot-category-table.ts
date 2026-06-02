import { eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  categories,
  CATEGORY_IMPORT_SNAPSHOT_ID,
  categoryImportSnapshots,
} from '@/db/schema';
import { resolveCategoryType } from '@/lib/categories/category-type';
import type { CategorySnapshotRow } from '@/lib/categories/import/types';
import { isMissingRelationError } from '@/lib/db/format-db-error';

export async function loadCategoryTableSnapshot(): Promise<CategorySnapshotRow[]> {
  const rows = await db
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
    .from(categories);

  return rows.map((row) => ({
    ...row,
    type: resolveCategoryType(row.type),
  }));
}

export async function saveCategoryImportSnapshot(
  payload: CategorySnapshotRow[],
): Promise<void> {
  const now = new Date();

  await db
    .insert(categoryImportSnapshots)
    .values({
      id: CATEGORY_IMPORT_SNAPSHOT_ID,
      payload,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: categoryImportSnapshots.id,
      set: {
        payload,
        createdAt: now,
      },
    });
}

export async function clearCategoryImportSnapshot(): Promise<void> {
  await db
    .delete(categoryImportSnapshots)
    .where(eq(categoryImportSnapshots.id, CATEGORY_IMPORT_SNAPSHOT_ID));
}

export async function loadSavedCategoryImportSnapshot(): Promise<
  CategorySnapshotRow[] | null
> {
  try {
    const [row] = await db
      .select({ payload: categoryImportSnapshots.payload })
      .from(categoryImportSnapshots)
      .where(eq(categoryImportSnapshots.id, CATEGORY_IMPORT_SNAPSHOT_ID))
      .limit(1);

    return row?.payload ?? null;
  } catch (error) {
    if (isMissingRelationError(error, 'category_import_snapshot')) {
      return null;
    }

    throw error;
  }
}
