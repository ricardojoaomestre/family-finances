import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { transactions } from '@/db/schema';
import { requireActiveHouseholdId } from '@/lib/household/active-household';
import type { MerchantSlug } from '@/lib/merchants';

import { buildDuplicateKey } from './duplicate-key';

export async function getExistingDuplicateKeys(
  merchant: MerchantSlug,
): Promise<Set<string>> {
  const householdId = await requireActiveHouseholdId();
  const rows = await db
    .select({
      date: transactions.date,
      value: transactions.value,
      merchant: transactions.merchant,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.householdId, householdId),
        eq(transactions.merchant, merchant),
      ),
    );

  const keys = new Set<string>();

  for (const row of rows) {
    keys.add(buildDuplicateKey(row.date, Number(row.value), row.merchant));
  }

  return keys;
}
