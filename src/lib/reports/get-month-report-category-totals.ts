import { desc, eq, sql } from 'drizzle-orm';

import { DEFAULT_TRANSACTION_FILTERS } from '@/app/(protected)/transactions/lib/filter-transactions';
import { db } from '@/db';
import { categories, transactions } from '@/db/schema';
import {
  resolveCategoryType,
  type CategoryType,
} from '@/lib/categories/category-type';
import { buildTransactionWhere } from '@/lib/transactions/build-transaction-where';

export type MonthReportCategoryTotal = {
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  type: CategoryType;
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
      type: categories.type,
      total: sql<string>`sum(${transactions.value})::text`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(where)
    .groupBy(
      transactions.categoryId,
      categories.name,
      categories.color,
      categories.type,
    )
    .orderBy(desc(sql`sum(${transactions.value})`));

  return rows.map((row) => ({
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    categoryColor: row.categoryColor,
    type: resolveCategoryType(row.type),
    total: row.total,
  }));
}
