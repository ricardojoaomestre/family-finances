import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { transactions } from '@/db/schema';
import { requireActiveHouseholdId } from '@/lib/household/active-household';

import { buildDuplicateKey } from './duplicate-key';

export async function getExistingDuplicateKeys(
  bankAccountId: string,
): Promise<Set<string>> {
  const householdId = await requireActiveHouseholdId();
  const rows = await db
    .select({
      date: transactions.date,
      value: transactions.value,
      bankAccountId: transactions.bankAccountId,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.householdId, householdId),
        eq(transactions.bankAccountId, bankAccountId),
      ),
    );

  const keys = new Set<string>();

  for (const row of rows) {
    keys.add(
      buildDuplicateKey(row.date, Number(row.value), row.bankAccountId),
    );
  }

  return keys;
}
