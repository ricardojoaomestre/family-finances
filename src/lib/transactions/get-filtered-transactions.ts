import { desc, eq } from 'drizzle-orm';

import type { TransactionFilters } from '@/app/(protected)/transactions/lib/filter-transactions';
import { db } from '@/db';
import { categories, transactions } from '@/db/schema';
import { requireActiveHouseholdId } from '@/lib/household/active-household';
import type { TransactionRow } from '@/lib/transactions/transaction-row';

import { buildTransactionWhere } from './build-transaction-where';

export async function getFilteredTransactions(
  filters: TransactionFilters,
): Promise<TransactionRow[]> {
  const householdId = await requireActiveHouseholdId();
  const where = buildTransactionWhere(filters, householdId);

  return db
    .select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
      value: transactions.value,
      importId: transactions.importId,
      merchant: transactions.merchant,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(where)
    .orderBy(desc(transactions.date));
}
