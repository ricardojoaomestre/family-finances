'use server';

import { eq, inArray, max } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { db } from '@/db';
import { categories, transactions } from '@/db/schema';
import {
  isCategoryColorToken,
  type CategoryColorToken,
} from '@/lib/categories/category-colors';
import {
  buildCategoryImportPlan,
  pickCategoryImportColor,
  type CategoryImportCsvRow,
} from '@/lib/categories/import';
import {
  clearCategoryImportSnapshot,
  loadCategoryTableSnapshot,
  loadSavedCategoryImportSnapshot,
  saveCategoryImportSnapshot,
} from '@/lib/categories/snapshot-category-table';
import { formatDbError } from '@/lib/db/format-db-error';

export type ImportCategoriesInput = {
  rows: CategoryImportCsvRow[];
};

export type ImportCategoriesResult =
  | {
      ok: true;
      skippedDuplicateCount: number;
      inactiveUpdated: { id: string; name: string }[];
    }
  | { ok: false; error: string };

function revalidateCategoryPaths() {
  revalidatePath('/settings/categories');
  revalidatePath('/transactions');
  revalidatePath('/imports');
  revalidatePath('/dashboard');
}

async function getNextPriority(): Promise<number> {
  const [result] = await db
    .select({ value: max(categories.priority) })
    .from(categories);

  return (result?.value ?? 0) + 1;
}

export async function importCategories(
  input: ImportCategoriesInput,
): Promise<ImportCategoriesResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  if (!Array.isArray(input.rows) || input.rows.length === 0) {
    return { ok: false, error: 'No rows to import.' };
  }

  const existing = await db
    .select({
      id: categories.id,
      name: categories.name,
      pattern: categories.pattern,
      priority: categories.priority,
      active: categories.active,
      color: categories.color,
    })
    .from(categories);

  const plan = buildCategoryImportPlan(existing, input.rows);

  if (!plan.ok) {
    return { ok: false, error: plan.error };
  }

  const snapshot = await loadCategoryTableSnapshot();
  const inactiveUpdated: { id: string; name: string }[] = [];

  try {
    await saveCategoryImportSnapshot(snapshot);

    let nextPriority = await getNextPriority();
    const usedByActive = new Set(
      existing.filter((row) => row.active).map((row) => row.color),
    );
    const now = new Date();

    for (const row of plan.rowsToApply) {
      if (row.action === 'update' && row.targetCategoryId) {
        await db
          .update(categories)
          .set({
            pattern: row.normalizedPattern,
            updatedAt: now,
          })
          .where(eq(categories.id, row.targetCategoryId));

        if (row.wasInactive) {
          const target = existing.find(
            (category) => category.id === row.targetCategoryId,
          );

          if (target) {
            inactiveUpdated.push({ id: target.id, name: target.name });
          }
        }

        continue;
      }

      const color: CategoryColorToken = pickCategoryImportColor(usedByActive);
      usedByActive.add(color);

      await db.insert(categories).values({
        id: crypto.randomUUID(),
        name: row.csvName.trim(),
        description: null,
        color: isCategoryColorToken(color) ? color : 'blue-200',
        pattern: row.normalizedPattern,
        priority: nextPriority,
        active: true,
        updatedAt: now,
      });

      nextPriority += 1;
    }
  } catch (error) {
    console.error('[importCategories]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not import categories'),
    };
  }

  revalidateCategoryPaths();

  const uniqueInactive = [
    ...new Map(inactiveUpdated.map((row) => [row.id, row])).values(),
  ];

  return {
    ok: true,
    skippedDuplicateCount: plan.skippedDuplicateCount,
    inactiveUpdated: uniqueInactive,
  };
}

export type ActivateImportedCategoriesInput = {
  categoryIds: string[];
};

export async function activateImportedCategories(
  input: ActivateImportedCategoriesInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const ids = [...new Set(input.categoryIds.filter(Boolean))];

  if (ids.length === 0) {
    return { ok: true };
  }

  try {
    await db
      .update(categories)
      .set({ active: true, updatedAt: new Date() })
      .where(inArray(categories.id, ids));
  } catch (error) {
    console.error('[activateImportedCategories]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not activate categories'),
    };
  }

  revalidateCategoryPaths();
  return { ok: true };
}

export async function undoCategoryImport(): Promise<
  { ok: true } | { ok: false; error: string; blockingCategories?: string[] }
> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const snapshot = await loadSavedCategoryImportSnapshot();

  if (!snapshot) {
    return { ok: false, error: 'Nothing to undo.' };
  }

  const snapshotIds = new Set(snapshot.map((row) => row.id));
  const live = await db.select({ id: categories.id }).from(categories);
  const toDelete = live
    .filter((row) => !snapshotIds.has(row.id))
    .map((row) => row.id);

  if (toDelete.length > 0) {
    const blocking = await db
      .select({
        id: categories.id,
        name: categories.name,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(inArray(transactions.categoryId, toDelete));

    const blockingNames = [
      ...new Set(blocking.map((row) => row.name)),
    ].sort((a, b) => a.localeCompare(b));

    if (blockingNames.length > 0) {
      return {
        ok: false,
        error:
          'Cannot undo: categories created by the import are used by transactions.',
        blockingCategories: blockingNames,
      };
    }
  }

  const now = new Date();

  try {
    if (toDelete.length > 0) {
      await db.delete(categories).where(inArray(categories.id, toDelete));
    }

    for (const row of snapshot) {
      await db
        .insert(categories)
        .values({
          id: row.id,
          name: row.name,
          description: row.description,
          color: row.color,
          pattern: row.pattern,
          priority: row.priority,
          active: row.active,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: categories.id,
          set: {
            name: row.name,
            description: row.description,
            color: row.color,
            pattern: row.pattern,
            priority: row.priority,
            active: row.active,
            updatedAt: now,
          },
        });
    }

    await clearCategoryImportSnapshot();
  } catch (error) {
    console.error('[undoCategoryImport]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not undo category import'),
    };
  }

  revalidateCategoryPaths();
  return { ok: true };
}
