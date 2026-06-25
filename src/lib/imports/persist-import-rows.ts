import { and, eq, inArray, isNull } from 'drizzle-orm';

import { db } from '@/db';
import {
  importSkippedRows,
  imports,
  notes,
  type ImportSource,
  type ImportStatus,
  transactions,
} from '@/db/schema';
import type { ParsedImportRow } from '@/app/(protected)/dashboard/actions/import-file';
import { matchImportRowsForConfirm } from '@/app/(protected)/dashboard/actions/match-import-rows-for-confirm';
import {
  classifyImportRows,
  formatTransactionValueForKey,
  getSkippedRowReason,
  isImportableWithOverride,
} from '@/lib/file-import';
import { getExistingDuplicateKeys } from '@/lib/file-import/get-existing-duplicate-keys';
import { resolveImportRowCategory } from '@/lib/notes/resolve-import-row-category';
import { getActiveCategoriesForImport } from '@/lib/categories/get-active-categories-for-import';

export type PersistImportRowsInput = {
  householdId: string;
  userId: string;
  bankAccountId: string;
  rows: ParsedImportRow[];
  filename: string | null;
  source: ImportSource;
  periodFrom?: string | null;
  periodTo?: string | null;
};

export type PersistImportRowsResult =
  | {
      ok: true;
      importId: string;
      status: ImportStatus;
      importedCount: number;
      skippedCount: number;
    }
  | { ok: false; error: string };

export async function persistImportRows(
  input: PersistImportRowsInput,
): Promise<PersistImportRowsResult> {
  if (!Array.isArray(input.rows) || input.rows.length === 0) {
    return { ok: false, error: 'No rows to import.' };
  }

  const existingKeys = await getExistingDuplicateKeys(input.bankAccountId);
  const serverRows = await matchImportRowsForConfirm(
    input.rows,
    input.bankAccountId,
  );
  const classifiedRows = classifyImportRows(
    input.rows,
    existingKeys,
    input.bankAccountId,
  );
  const importableRows = classifiedRows
    .map((classified, index) => ({
      classified,
      clientRow: input.rows[index]!,
      serverRow: serverRows[index]!,
    }))
    .filter(({ classified, clientRow }) =>
      isImportableWithOverride(classified, clientRow.duplicate),
    );
  const skippedRows = classifiedRows
    .map((classified, rowIndex) => ({
      classified,
      rowIndex,
      clientRow: input.rows[rowIndex]!,
    }))
    .filter(
      ({ classified, clientRow }) =>
        !isImportableWithOverride(classified, clientRow.duplicate),
    );

  const skippedCount = skippedRows.length;
  const status: ImportStatus =
    skippedCount === 0 ? 'completed' : 'partial';

  const importId = crypto.randomUUID();
  const activeCategories = await getActiveCategoriesForImport();
  const activeCategoryIds = new Set(activeCategories.map((category) => category.id));
  const noteIdsToArchive = new Set<string>();

  const resolvedImportableRows = importableRows.map(
    ({ classified, clientRow, serverRow }) => {
      const resolved = resolveImportRowCategory(clientRow, serverRow);

      if (resolved.archiveNoteId) {
        noteIdsToArchive.add(resolved.archiveNoteId);
      }

      return {
        classified: {
          ...classified,
          row: {
            ...classified.row,
            categoryId: resolved.categoryId,
          },
        },
      };
    },
  );

  for (const { classified } of resolvedImportableRows) {
    const { row } = classified;
    if (row.categoryId !== null && !activeCategoryIds.has(row.categoryId)) {
      return {
        ok: false,
        error:
          'One or more selected categories are no longer available. Review categories and try again.',
      };
    }
  }

  try {
    await db.insert(imports).values({
      id: importId,
      householdId: input.householdId,
      filename: input.filename,
      source: input.source,
      periodFrom: input.periodFrom ?? null,
      periodTo: input.periodTo ?? null,
      rowCount: resolvedImportableRows.length,
      skippedCount,
      userId: input.userId,
      status,
      bankAccountId: input.bankAccountId,
    });

    if (resolvedImportableRows.length > 0) {
      await db.insert(transactions).values(
        resolvedImportableRows.map(({ classified }) => {
          const { row } = classified;
          const description = row.description.trim();

          return {
            householdId: input.householdId,
            date: new Date(row.date!),
            description,
            categoryId: row.categoryId,
            value: formatTransactionValueForKey(row.value!),
            balance:
              row.balance != null && Number.isFinite(row.balance)
                ? formatTransactionValueForKey(row.balance)
                : null,
            importId,
            bankAccountId: input.bankAccountId,
          };
        }),
      );
    }

    if (skippedRows.length > 0) {
      await db.insert(importSkippedRows).values(
        skippedRows.map(({ classified, rowIndex }) => {
          const { row, validation } = classified;
          const reason = getSkippedRowReason(classified);

          return {
            importId,
            rowIndex,
            date: row.date ? new Date(row.date) : null,
            description: row.description,
            value:
              row.value !== null && Number.isFinite(row.value)
                ? formatTransactionValueForKey(row.value)
                : null,
            balance:
              row.balance != null && Number.isFinite(row.balance)
                ? formatTransactionValueForKey(row.balance)
                : null,
            reason,
            errors: !validation.valid
              ? JSON.stringify(validation.errors)
              : null,
          };
        }),
      );
    }

    if (noteIdsToArchive.size > 0) {
      const now = new Date();
      await db
        .update(notes)
        .set({ archivedAt: now, updatedAt: now })
        .where(
          and(
            eq(notes.householdId, input.householdId),
            inArray(notes.id, [...noteIdsToArchive]),
            isNull(notes.archivedAt),
          ),
        );
    }
  } catch (error) {
    try {
      await db.delete(imports).where(eq(imports.id, importId));
    } catch {
      // Best-effort rollback.
    }

    console.error('[persistImportRows]', error);

    return {
      ok: false,
      error: 'Could not save import.',
    };
  }

  return {
    ok: true,
    importId,
    status,
    importedCount: resolvedImportableRows.length,
    skippedCount,
  };
}
