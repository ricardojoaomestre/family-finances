import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { categoryImportSnapshots } from '@/db/schema';
import { requireActiveHouseholdId } from '@/lib/household/active-household';
import { isMissingRelationError } from '@/lib/db/format-db-error';

export type CategoryImportSnapshotMeta = {
  canUndo: boolean;
  createdAt: Date | null;
};

export async function getCategoryImportSnapshotMeta(): Promise<CategoryImportSnapshotMeta> {
  try {
    const householdId = await requireActiveHouseholdId();
    const [row] = await db
      .select({ createdAt: categoryImportSnapshots.createdAt })
      .from(categoryImportSnapshots)
      .where(eq(categoryImportSnapshots.householdId, householdId))
      .limit(1);

    if (!row) {
      return { canUndo: false, createdAt: null };
    }

    return { canUndo: true, createdAt: row.createdAt };
  } catch (error) {
    if (isMissingRelationError(error, 'category_import_snapshot')) {
      return { canUndo: false, createdAt: null };
    }

    throw error;
  }
}
