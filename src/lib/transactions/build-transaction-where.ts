import { and, eq, ilike, isNull, sql, type SQL } from 'drizzle-orm';

import {
  ALL_FILTER_VALUE,
  UNCATEGORIZED_FILTER_VALUE,
  type TransactionFilters,
} from '@/app/(protected)/transactions/lib/filter-transactions';
import { transactions } from '@/db/schema';

export function createTransactionWhereConditions(
  filters: TransactionFilters,
  householdId: string,
): SQL[] {
  const conditions: SQL[] = [eq(transactions.householdId, householdId)];
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

  if (filters.bankAccountId !== ALL_FILTER_VALUE) {
    conditions.push(eq(transactions.bankAccountId, filters.bankAccountId));
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

  return conditions;
}

export function buildTransactionWhere(
  filters: TransactionFilters,
  householdId: string,
): SQL | undefined {
  const conditions = createTransactionWhereConditions(filters, householdId);
  return conditions.length > 0 ? and(...conditions) : undefined;
}
