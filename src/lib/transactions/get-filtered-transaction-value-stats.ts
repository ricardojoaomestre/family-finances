import { count, sql } from 'drizzle-orm';

import type { TransactionFilters } from '@/app/(protected)/transactions/lib/filter-transactions';
import { db } from '@/db';
import { transactions } from '@/db/schema';

import { buildTransactionWhere } from './build-transaction-where';

export type FilteredTransactionValueStats = {
  sum: string;
  avg: string;
  min: string | null;
  max: string | null;
  count: number;
};

export async function getFilteredTransactionValueStats(
  filters: TransactionFilters,
): Promise<FilteredTransactionValueStats> {
  const where = buildTransactionWhere(filters);

  const [row] = await db
    .select({
      sum: sql<string>`coalesce(sum(${transactions.value}), 0)::text`,
      avg: sql<string>`coalesce(avg(${transactions.value}), 0)::text`,
      min: sql<string | null>`min(${transactions.value})::text`,
      max: sql<string | null>`max(${transactions.value})::text`,
      count: count(),
    })
    .from(transactions)
    .where(where);

  return {
    sum: row?.sum ?? '0',
    avg: row?.avg ?? '0',
    min: row?.min ?? null,
    max: row?.max ?? null,
    count: Number(row?.count ?? 0),
  };
}
