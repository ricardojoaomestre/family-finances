import { desc, eq, sql } from 'drizzle-orm';

import { DEFAULT_TRANSACTION_FILTERS } from '@/app/(protected)/transactions/lib/filter-transactions';
import { db } from '@/db';
import { categories, transactions } from '@/db/schema';
import {
  resolveCategoryType,
  type CategoryType,
} from '@/lib/categories/category-type';
import { requireActiveHouseholdId } from '@/lib/household/active-household';
import { buildTransactionWhere } from '@/lib/transactions/build-transaction-where';

export type MonthReportCategoryTotal = {
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  type: CategoryType;
  total: string;
};

export async function getMonthReportCategoryTotals(
  dateFrom: string,
  dateTo: string,
): Promise<MonthReportCategoryTotal[]> {
  const householdId = await requireActiveHouseholdId();
  const where = buildTransactionWhere(
    {
      ...DEFAULT_TRANSACTION_FILTERS,
      dateFrom,
      dateTo,
    },
    householdId,
  );

  const rows = await db
    .select({
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
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
      categories.icon,
      categories.type,
    )
    .orderBy(desc(sql`sum(${transactions.value})`));

  return rows.map((row) => ({
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    categoryColor: row.categoryColor,
    categoryIcon: row.categoryIcon,
    type: resolveCategoryType(row.type),
    total: row.total,
  }));
}
