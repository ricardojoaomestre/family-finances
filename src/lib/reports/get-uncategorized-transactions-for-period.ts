import { desc, eq, sql } from 'drizzle-orm';

import {
  DEFAULT_TRANSACTION_FILTERS,
  UNCATEGORIZED_FILTER_VALUE,
} from '@/app/(protected)/transactions/lib/filter-transactions';
import { db } from '@/db';
import { bankAccounts, categories, transactions } from '@/db/schema';
import { requireActiveHouseholdId } from '@/lib/household/active-household';
import type { CategorizeTransactionRow } from '@/lib/transactions/categorize-transaction-row';
import { buildTransactionWhere } from '@/lib/transactions/build-transaction-where';

function buildUncategorizedPeriodWhere(
  dateFrom: string,
  dateTo: string,
  householdId: string,
) {
  return buildTransactionWhere(
    {
      ...DEFAULT_TRANSACTION_FILTERS,
      dateFrom,
      dateTo,
      categoryId: UNCATEGORIZED_FILTER_VALUE,
    },
    householdId,
  );
}

export async function countUncategorizedTransactionsForPeriod(
  dateFrom: string,
  dateTo: string,
): Promise<number> {
  const householdId = await requireActiveHouseholdId();
  const where = buildUncategorizedPeriodWhere(dateFrom, dateTo, householdId);

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactions)
    .where(where);

  return row?.count ?? 0;
}

export async function getUncategorizedTransactionsForPeriod(
  dateFrom: string,
  dateTo: string,
): Promise<CategorizeTransactionRow[]> {
  const householdId = await requireActiveHouseholdId();
  const where = buildUncategorizedPeriodWhere(dateFrom, dateTo, householdId);

  const rows = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
      value: transactions.value,
      balance: transactions.balance,
      bankAccountLabel: bankAccounts.label,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .innerJoin(bankAccounts, eq(transactions.bankAccountId, bankAccounts.id))
    .where(where)
    .orderBy(desc(transactions.date));

  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    description: row.description,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    categoryColor: row.categoryColor,
    categoryIcon: row.categoryIcon,
    value: row.value,
    balance: row.balance,
    bankAccountLabel: row.bankAccountLabel,
  }));
}
