import { desc, eq, sql } from 'drizzle-orm';

import { DEFAULT_TRANSACTION_FILTERS } from '@/app/(protected)/transactions/lib/filter-transactions';
import { db } from '@/db';
import { categories, transactions } from '@/db/schema';
import { buildTransactionWhere } from '@/lib/transactions/build-transaction-where';

export type MonthReportCategoryTotal = {
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  total: string;
};

export async function getMonthReportCategoryTotals(
  dateFrom: string,
  dateTo: string,
): Promise<MonthReportCategoryTotal[]> {
  const where = buildTransactionWhere({
    ...DEFAULT_TRANSACTION_FILTERS,
    dateFrom,
    dateTo,
  });

  const rows = await db
    .select({
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      total: sql<string>`sum(${transactions.value})::text`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(where)
    .groupBy(
      transactions.categoryId,
      categories.name,
      categories.color,
    )
    .orderBy(desc(sql`sum(${transactions.value})`));

  return rows;
}
