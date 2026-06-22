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
import { getActiveHouseholdId } from '@/lib/household/active-household';
import { formatDbError } from '@/lib/db/format-db-error';
import {
  buildDuplicateKey,
  formatTransactionValueForKey,
  validateImportRow,
} from '@/lib/file-import';
import { DUPLICATE_IN_FILE_MESSAGE } from '@/lib/imports/duplicate-in-file-message';
import { getImportDuplicateContext } from '@/lib/imports/get-import-duplicate-context';
import { skippedRowToSpreadsheetRow } from '@/lib/imports/skipped-row-to-spreadsheet';
export type ImportedSkippedTransaction = {
  id: string;
  date: Date;
  description: string;
  categoryName: null;
  categoryColor: null;
  categoryIcon: null;
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

  const householdId = await getActiveHouseholdId();

  if (!householdId) {
    return { ok: false, error: 'No active household selected.' };
  }

  const [importRecord] = await db
    .select({
      id: imports.id,
      bankAccountId: imports.bankAccountId,
      rowCount: imports.rowCount,
      skippedCount: imports.skippedCount,
      status: imports.status,
    })
    .from(imports)
    .where(and(eq(imports.id, input.importId), eq(imports.householdId, householdId)))
    .limit(1);

  if (!importRecord?.bankAccountId) {
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

  const bankAccountId = importRecord.bankAccountId;
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
    bankAccountId,
  );

  const { importedKeys } = await getImportDuplicateContext(
    input.importId,
    bankAccountId,
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
        householdId,
        date,
        description,
        categoryId: null,
        value,
        balance: skippedRow.balance,
        importId: input.importId,
        bankAccountId,
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
      .where(and(eq(imports.id, input.importId), eq(imports.householdId, householdId)));

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
        categoryColor: null,
        categoryIcon: null,
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
