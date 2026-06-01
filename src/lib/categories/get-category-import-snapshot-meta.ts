import { eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  CATEGORY_IMPORT_SNAPSHOT_ID,
  categoryImportSnapshots,
} from '@/db/schema';
import { isMissingRelationError } from '@/lib/db/format-db-error';

export type CategoryImportSnapshotMeta = {
  canUndo: boolean;
  createdAt: Date | null;
};

export async function getCategoryImportSnapshotMeta(): Promise<CategoryImportSnapshotMeta> {
  try {
    const [row] = await db
      .select({ createdAt: categoryImportSnapshots.createdAt })
      .from(categoryImportSnapshots)
      .where(eq(categoryImportSnapshots.id, CATEGORY_IMPORT_SNAPSHOT_ID))
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
