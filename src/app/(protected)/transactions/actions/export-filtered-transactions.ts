'use server';

import { auth } from '@/auth';
import type { TransactionFilters } from '@/app/(protected)/transactions/lib/filter-transactions';
import { buildFilteredTransactionsCsv } from '@/lib/transactions/build-filtered-transactions-csv';
import { getFilteredTransactions } from '@/lib/transactions/get-filtered-transactions';

export type ExportFilteredTransactionsResult =
  | { ok: true; csv: string }
  | { ok: false; error: string };

export async function exportFilteredTransactionsAction(
  filters: TransactionFilters,
): Promise<ExportFilteredTransactionsResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const rows = await getFilteredTransactions(filters);
  const csv = buildFilteredTransactionsCsv(rows);

  return { ok: true, csv };
}
