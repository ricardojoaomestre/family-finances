import { and, asc, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { categories, transactions } from '@/db/schema';
import { requireActiveHouseholdId } from '@/lib/household/active-household';
import { getPrimaryAccountMerchant } from '@/lib/household/primary-account';
import { getCalendarDayKey } from '@/lib/file-import/duplicate-key';

function transactionDateInRange(dateFrom: string, dateTo: string) {
  return and(
    sql`to_char(${transactions.date} AT TIME ZONE 'UTC', 'YYYY-MM-DD') >= ${dateFrom}`,
    sql`to_char(${transactions.date} AT TIME ZONE 'UTC', 'YYYY-MM-DD') <= ${dateTo}`,
  );
}

export async function getMonthReportPrimaryAccountBalanceBeforeIncome(
  dateFrom: string,
  dateTo: string,
): Promise<string | null> {
  const householdId = await requireActiveHouseholdId();
  const primaryAccountMerchant = await getPrimaryAccountMerchant(householdId);

  if (!primaryAccountMerchant) {
    return null;
  }

  const [anchor] = await db
    .select({
      date: transactions.date,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.householdId, householdId),
        eq(transactions.merchant, primaryAccountMerchant),
        eq(categories.type, 'income'),
        transactionDateInRange(dateFrom, dateTo),
      ),
    )
    .orderBy(asc(transactions.date), asc(transactions.insertedAt))
    .limit(1);

  if (!anchor) {
    return null;
  }

  const anchorDate = getCalendarDayKey(anchor.date);

  const [previous] = await db
    .select({
      balance: transactions.balance,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.householdId, householdId),
        eq(transactions.merchant, primaryAccountMerchant),
        sql`to_char(${transactions.date} AT TIME ZONE 'UTC', 'YYYY-MM-DD') < ${anchorDate}`,
      ),
    )
    .orderBy(desc(transactions.date), desc(transactions.insertedAt))
    .limit(1);

  return previous?.balance ?? null;
}
