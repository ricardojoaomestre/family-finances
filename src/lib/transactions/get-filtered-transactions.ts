import { desc, eq } from 'drizzle-orm';

import type { TransactionFilters } from '@/app/(protected)/transactions/lib/filter-transactions';
import { db } from '@/db';
import { categories, bankAccounts, transactions } from '@/db/schema';
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
      bankAccountId: transactions.bankAccountId,
      bankAccountLabel: bankAccounts.label,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .innerJoin(bankAccounts, eq(transactions.bankAccountId, bankAccounts.id))
    .where(where)
    .orderBy(desc(transactions.date));
}
