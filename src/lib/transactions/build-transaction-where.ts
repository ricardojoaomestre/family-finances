import { and, eq, ilike, isNull, sql, type SQL } from 'drizzle-orm';

import {
  ALL_FILTER_VALUE,
  UNCATEGORIZED_FILTER_VALUE,
  type TransactionFilters,
} from '@/app/(protected)/transactions/lib/filter-transactions';
import { transactions } from '@/db/schema';

export function buildTransactionWhere(
  filters: TransactionFilters,
): SQL | undefined {
  const conditions: SQL[] = [];
  const descriptionQuery = filters.description.trim();

  if (descriptionQuery) {
    conditions.push(ilike(transactions.description, `%${descriptionQuery}%`));
  }

  if (filters.categoryId !== ALL_FILTER_VALUE) {
    if (filters.categoryId === UNCATEGORIZED_FILTER_VALUE) {
      conditions.push(isNull(transactions.categoryId));
    } else {
      conditions.push(eq(transactions.categoryId, filters.categoryId));
    }
  }

  if (filters.merchant !== ALL_FILTER_VALUE) {
    conditions.push(eq(transactions.merchant, filters.merchant));
  }

  if (filters.dateFrom) {
    conditions.push(
      sql`to_char(${transactions.date} AT TIME ZONE 'UTC', 'YYYY-MM-DD') >= ${filters.dateFrom}`,
    );
  }

  if (filters.dateTo) {
    conditions.push(
      sql`to_char(${transactions.date} AT TIME ZONE 'UTC', 'YYYY-MM-DD') <= ${filters.dateTo}`,
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
