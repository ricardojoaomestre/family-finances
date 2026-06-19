import { and, asc, eq, isNull, or, sql } from 'drizzle-orm';

import { DEFAULT_TRANSACTION_FILTERS } from '@/app/(protected)/transactions/lib/filter-transactions';
import { db } from '@/db';
import { categories, transactions } from '@/db/schema';
import {
  type CategoryMonthlySpendingRow,
  getDashboardCategoryChartMonthRanges,
} from '@/lib/dashboard/dashboard-category-chart-months';
import { requireActiveHouseholdId } from '@/lib/household/active-household';
import { buildTransactionWhere } from '@/lib/transactions/build-transaction-where';

export async function getCategoryMonthlySpending(
  reportDateFrom: string,
): Promise<CategoryMonthlySpendingRow[]> {
  const monthRanges = getDashboardCategoryChartMonthRanges(reportDateFrom);

  if (monthRanges.length === 0) {
    return [];
  }

  const dateFrom = monthRanges[0].dateFrom;
  const dateTo = monthRanges[monthRanges.length - 1].dateTo;
  const householdId = await requireActiveHouseholdId();
  const monthKey = sql<string>`to_char(${transactions.date} AT TIME ZONE 'UTC', 'YYYY-MM')`;
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
      monthKey,
      total: sql<string>`sum(${transactions.value})::text`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        where,
        or(isNull(transactions.categoryId), eq(categories.type, 'spending')),
      ),
    )
    .groupBy(transactions.categoryId, monthKey)
    .orderBy(asc(monthKey));

  const monthDateFromByKey = new Map(
    monthRanges.map((range) => [range.monthDateFrom.slice(0, 7), range.monthDateFrom]),
  );

  return rows.map((row) => ({
    categoryId: row.categoryId,
    monthDateFrom:
      monthDateFromByKey.get(row.monthKey) ?? `${row.monthKey}-01`,
    total: row.total,
  }));
}
