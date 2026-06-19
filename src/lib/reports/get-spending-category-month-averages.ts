import { and, eq, isNotNull, sql } from 'drizzle-orm';

import { DEFAULT_TRANSACTION_FILTERS } from '@/app/(protected)/transactions/lib/filter-transactions';
import { db } from '@/db';
import { categories, transactions } from '@/db/schema';
import { parseCalendarDayKey } from '@/lib/dates/calendar-day-key';
import { requireActiveHouseholdId } from '@/lib/household/active-household';
import {
  formatPriorMonthLabels,
  getPriorReportMonthRange,
} from '@/lib/reports/report-month';
import { buildTransactionWhere } from '@/lib/transactions/build-transaction-where';

export type SpendingCategoryAverage = {
  average: string;
  monthLabels: string;
};

export async function getSpendingCategoryMonthAverages(
  reportDateFrom: string,
): Promise<Record<string, SpendingCategoryAverage>> {
  const priorRange = getPriorReportMonthRange(reportDateFrom);

  if (!priorRange) {
    return {};
  }

  const householdId = await requireActiveHouseholdId();
  const where = and(
    buildTransactionWhere(
      {
        ...DEFAULT_TRANSACTION_FILTERS,
        dateFrom: priorRange.dateFrom,
        dateTo: priorRange.dateTo,
      },
      householdId,
    ),
    isNotNull(transactions.categoryId),
    eq(categories.type, 'spending'),
  );

  const monthKeySql = sql<string>`to_char(${transactions.date} AT TIME ZONE 'UTC', 'YYYY-MM')`;

  const rows = await db
    .select({
      categoryId: transactions.categoryId,
      monthKey: monthKeySql,
      total: sql<string>`sum(${transactions.value})::text`,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(where)
    .groupBy(transactions.categoryId, monthKeySql);

  const totalsByCategory = new Map<
    string,
    { monthIndex: number; total: number }[]
  >();

  for (const row of rows) {
    if (!row.categoryId) {
      continue;
    }

    const total = Number(row.total);

    if (!Number.isFinite(total) || total === 0) {
      continue;
    }

    const parsedMonth = parseCalendarDayKey(`${row.monthKey}-01`);

    if (!parsedMonth) {
      continue;
    }

    const monthIndex = parsedMonth.getMonth();
    const existing = totalsByCategory.get(row.categoryId) ?? [];

    existing.push({ monthIndex, total });
    totalsByCategory.set(row.categoryId, existing);
  }

  const result: Record<string, SpendingCategoryAverage> = {};

  for (const [categoryId, monthTotals] of totalsByCategory) {
    if (monthTotals.length === 0) {
      continue;
    }

    const sum = monthTotals.reduce((acc, entry) => acc + entry.total, 0);
    const monthIndexes = monthTotals.map((entry) => entry.monthIndex);

    result[categoryId] = {
      average: (sum / monthTotals.length).toFixed(2),
      monthLabels: formatPriorMonthLabels(monthIndexes),
    };
  }

  return result;
}
