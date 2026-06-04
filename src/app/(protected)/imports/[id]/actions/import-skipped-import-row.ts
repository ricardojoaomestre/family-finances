'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { db } from '@/db';
import {
  importSkippedRows,
  imports,
  type ImportStatus,
  transactions,
} from '@/db/schema';
import { formatDbError } from '@/lib/db/format-db-error';
import {
  buildDuplicateKey,
  formatTransactionValueForKey,
  validateImportRow,
} from '@/lib/file-import';
import { DUPLICATE_IN_FILE_MESSAGE } from '@/lib/imports/duplicate-in-file-message';
import { getImportDuplicateContext } from '@/lib/imports/get-import-duplicate-context';
import { skippedRowToSpreadsheetRow } from '@/lib/imports/skipped-row-to-spreadsheet';
import { isMerchantSlug } from '@/lib/merchants';

export type ImportedSkippedTransaction = {
  id: string;
  date: Date;
  description: string;
  categoryName: null;
  value: string;
  balance: string | null;
};

export type ImportSkippedImportRowResult =
  | {
      ok: true;
      transaction: ImportedSkippedTransaction;
      rowCount: number;
      skippedCount: number;
      status: ImportStatus;
    }
  | {
      ok: false;
      error: string;
      requiresDuplicateInFileOverride?: boolean;
    };

export async function importSkippedImportRow(input: {
  importId: string;
  skippedRowId: string;
  allowDuplicateInFile?: boolean;
}): Promise<ImportSkippedImportRowResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const [importRecord] = await db
    .select({
      id: imports.id,
      merchant: imports.merchant,
      rowCount: imports.rowCount,
      skippedCount: imports.skippedCount,
      status: imports.status,
    })
    .from(imports)
    .where(eq(imports.id, input.importId))
    .limit(1);

  if (!importRecord || !isMerchantSlug(importRecord.merchant)) {
    return { ok: false, error: 'Import not found.' };
  }

  const [skippedRow] = await db
    .select({
      id: importSkippedRows.id,
      date: importSkippedRows.date,
      description: importSkippedRows.description,
      value: importSkippedRows.value,
      balance: importSkippedRows.balance,
    })
    .from(importSkippedRows)
    .where(
      and(
        eq(importSkippedRows.id, input.skippedRowId),
        eq(importSkippedRows.importId, input.importId),
      ),
    )
    .limit(1);

  if (!skippedRow) {
    return { ok: false, error: 'Skipped row not found.' };
  }

  const merchant = importRecord.merchant;
  const spreadsheetRow = skippedRowToSpreadsheetRow(skippedRow);
  const validation = validateImportRow(spreadsheetRow);

  if (!validation.valid) {
    return {
      ok: false,
      error: validation.errors[0] ?? 'Row is not valid for import.',
    };
  }

  const duplicateKey = buildDuplicateKey(
    spreadsheetRow.date!,
    spreadsheetRow.value!,
    merchant,
  );

  const { importedKeys } = await getImportDuplicateContext(
    input.importId,
    merchant,
  );

  if (importedKeys.has(duplicateKey) && !input.allowDuplicateInFile) {
    return {
      ok: false,
      error: DUPLICATE_IN_FILE_MESSAGE,
      requiresDuplicateInFileOverride: true,
    };
  }

  const date = new Date(`${spreadsheetRow.date!}T00:00:00.000Z`);
  const description = spreadsheetRow.description.trim();
  const value = formatTransactionValueForKey(spreadsheetRow.value!);

  try {
    const [transaction] = await db
      .insert(transactions)
      .values({
        date,
        description,
        categoryId: null,
        value,
        balance: skippedRow.balance,
        importId: input.importId,
        merchant,
      })
      .returning({
        id: transactions.id,
        date: transactions.date,
        description: transactions.description,
        value: transactions.value,
        balance: transactions.balance,
      });

    if (!transaction) {
      return { ok: false, error: 'Could not import row.' };
    }

    await db
      .delete(importSkippedRows)
      .where(eq(importSkippedRows.id, input.skippedRowId));

    const nextSkippedCount = Math.max(0, (importRecord.skippedCount ?? 1) - 1);
    const nextRowCount = importRecord.rowCount + 1;
    const nextStatus: ImportStatus =
      nextSkippedCount === 0 ? 'completed' : 'partial';

    await db
      .update(imports)
      .set({
        rowCount: nextRowCount,
        skippedCount: nextSkippedCount,
        status: nextStatus,
      })
      .where(eq(imports.id, input.importId));

    revalidatePath(`/imports/${input.importId}`);
    revalidatePath('/transactions');
    revalidatePath('/imports');
    revalidatePath('/report/new');
    revalidatePath('/reports');

    return {
      ok: true,
      transaction: {
        id: transaction.id,
        date: transaction.date,
        description: transaction.description,
        categoryName: null,
        value: transaction.value,
        balance: transaction.balance,
      },
      rowCount: nextRowCount,
      skippedCount: nextSkippedCount,
      status: nextStatus,
    };
  } catch (error) {
    console.error('[importSkippedImportRow]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not import row'),
    };
  }
}
