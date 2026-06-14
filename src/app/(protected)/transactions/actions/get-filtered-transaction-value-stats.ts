'use server';

import { auth } from '@/auth';
import type { TransactionFilters } from '@/app/(protected)/transactions/lib/filter-transactions';
import {
  getFilteredTransactionValueStats,
  type FilteredTransactionValueStats,
} from '@/lib/transactions/get-filtered-transaction-value-stats';

export type GetFilteredTransactionValueStatsResult =
  | { ok: true; data: FilteredTransactionValueStats }
  | { ok: false; error: string };

export async function getFilteredTransactionValueStatsAction(
  filters: TransactionFilters,
): Promise<GetFilteredTransactionValueStatsResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const data = await getFilteredTransactionValueStats(filters);
  return { ok: true, data };
}
