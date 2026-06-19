import { desc } from 'drizzle-orm';

import {
  ALL_FILTER_VALUE,
  UNCATEGORIZED_FILTER_VALUE,
} from '@/app/(protected)/transactions/lib/filter-transactions';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { requireActiveHouseholdId } from '@/lib/household/active-household';
import type { MonthReportCategoryTransactionRow } from '@/lib/reports/month-report-category-transaction-row';
import { buildTransactionWhere } from '@/lib/transactions/build-transaction-where';

export async function getMonthReportCategoryTransactions(
  dateFrom: string,
  dateTo: string,
  categoryId: string | null,
): Promise<MonthReportCategoryTransactionRow[]> {
  const householdId = await requireActiveHouseholdId();
  const where = buildTransactionWhere(
    {
      description: '',
      merchant: ALL_FILTER_VALUE,
      dateFrom,
      dateTo,
      categoryId:
        categoryId === null ? UNCATEGORIZED_FILTER_VALUE : categoryId,
    },
    householdId,
  );

  const rows = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
      value: transactions.value,
      balance: transactions.balance,
    })
    .from(transactions)
    .where(where)
    .orderBy(desc(transactions.date));

  return rows.map((row) => ({
    id: row.id,
    date: row.date.toISOString(),
    description: row.description,
    value: row.value,
    balance: row.balance,
  }));
}
