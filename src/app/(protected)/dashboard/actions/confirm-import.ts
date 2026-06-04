'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { db } from '@/db';
import { importSkippedRows, imports, type ImportStatus, transactions } from '@/db/schema';
import type { ParsedImportRow } from '@/app/(protected)/dashboard/actions/import-file';
import { getActiveCategoriesForImport } from '@/lib/categories/get-active-categories-for-import';
import { formatDbError } from '@/lib/db/format-db-error';
import {
  classifyImportRows,
  formatTransactionValueForKey,
  getSkippedRowReason,
  isImportableWithOverride,
} from '@/lib/file-import';
import { getExistingDuplicateKeys } from '@/lib/file-import/get-existing-duplicate-keys';
import { isMerchantSlug, type MerchantSlug } from '@/lib/merchants';

export type ConfirmImportInput = {
  filename: string;
  merchant: MerchantSlug;
  rows: ParsedImportRow[];
};

export type ConfirmImportResult =
  | {
      ok: true;
      importId: string;
      status: ImportStatus;
      importedCount: number;
      skippedCount: number;
    }
  | { ok: false; error: string };

export async function confirmImport(
  input: ConfirmImportInput,
): Promise<ConfirmImportResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in to import data.' };
  }

  const filename = input.filename?.trim();
  if (!filename) {
    return { ok: false, error: 'Filename is required.' };
  }

  if (!Array.isArray(input.rows) || input.rows.length === 0) {
    return { ok: false, error: 'No rows to import.' };
  }

  if (!isMerchantSlug(input.merchant)) {
    return { ok: false, error: 'A valid merchant is required.' };
  }

  const merchant = input.merchant;
  const existingKeys = await getExistingDuplicateKeys(merchant);
  const classifiedRows = classifyImportRows(input.rows, existingKeys, merchant);
  const importableRows = classifiedRows
    .map((classified, index) => ({
      classified,
      clientRow: input.rows[index]!,
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

  for (const { classified } of importableRows) {
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
      filename,
      rowCount: importableRows.length,
      skippedCount,
      userId: session.user.id,
      status,
      merchant,
    });

    if (importableRows.length > 0) {
      await db.insert(transactions).values(
        importableRows.map(({ classified }) => {
          const { row } = classified;
          const description = row.description.trim();

          return {
            date: new Date(row.date!),
            description,
            categoryId: row.categoryId,
            value: formatTransactionValueForKey(row.value!),
            balance:
              row.balance != null && Number.isFinite(row.balance)
                ? formatTransactionValueForKey(row.balance)
                : null,
            importId,
            merchant,
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
  } catch (error) {
    try {
      await db.delete(imports).where(eq(imports.id, importId));
    } catch {
      // Best-effort rollback if import row was created before transactions failed.
    }

    console.error('[confirmImport]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not save import'),
    };
  }

  revalidatePath('/imports');
  revalidatePath('/report/new');
  revalidatePath('/reports');

  return {
    ok: true,
    importId,
    status,
    importedCount: importableRows.length,
    skippedCount,
  };
}
