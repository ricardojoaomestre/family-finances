'use server';

import { and, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { db } from '@/db';
import { imports, type ImportStatus, transactions } from '@/db/schema';
import { getActiveHouseholdId } from '@/lib/household/active-household';
import { formatDbError } from '@/lib/db/format-db-error';
import { isMerchantSlug } from '@/lib/merchants';

export type DeleteImportTransactionsResult =
  | {
      ok: true;
      deletedCount: number;
      rowCount: number;
      status: ImportStatus;
    }
  | { ok: false; error: string };

export async function deleteImportTransactions(input: {
  importId: string;
  transactionIds: string[];
}): Promise<DeleteImportTransactionsResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const householdId = await getActiveHouseholdId();

  if (!householdId) {
    return { ok: false, error: 'No active household selected.' };
  }

  const uniqueIds = [...new Set(input.transactionIds)];

  if (uniqueIds.length === 0) {
    return { ok: false, error: 'Select at least one transaction.' };
  }

  const [importRecord] = await db
    .select({
      id: imports.id,
      merchant: imports.merchant,
      rowCount: imports.rowCount,
      skippedCount: imports.skippedCount,
    })
    .from(imports)
    .where(and(eq(imports.id, input.importId), eq(imports.householdId, householdId)))
    .limit(1);

  if (!importRecord || !isMerchantSlug(importRecord.merchant)) {
    return { ok: false, error: 'Import not found.' };
  }

  try {
    const deleted = await db
      .delete(transactions)
      .where(
        and(
          eq(transactions.householdId, householdId),
          eq(transactions.importId, input.importId),
          inArray(transactions.id, uniqueIds),
        ),
      )
      .returning({ id: transactions.id });

    const deletedCount = deleted.length;
    const nextRowCount = Math.max(0, importRecord.rowCount - deletedCount);
    const nextSkippedCount = importRecord.skippedCount ?? 0;
    const nextStatus: ImportStatus =
      nextSkippedCount === 0 ? 'completed' : 'partial';

    await db
      .update(imports)
      .set({
        rowCount: nextRowCount,
        status: nextStatus,
      })
      .where(and(eq(imports.id, input.importId), eq(imports.householdId, householdId)));

    revalidatePath(`/imports/${input.importId}`);
    revalidatePath('/transactions');
    revalidatePath('/imports');
    revalidatePath('/report/new');
    revalidatePath('/reports');
    revalidatePath('/dashboard');

    return {
      ok: true,
      deletedCount,
      rowCount: nextRowCount,
      status: nextStatus,
    };
  } catch (error) {
    console.error('[deleteImportTransactions]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not delete transactions'),
    };
  }
}
