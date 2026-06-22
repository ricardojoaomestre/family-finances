import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { bankAccounts, households } from '@/db/schema';
import { requireActiveHouseholdId } from '@/lib/household/active-household';

export async function getPrimaryBankAccountId(
  householdId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ primaryBankAccountId: households.primaryBankAccountId })
    .from(households)
    .where(eq(households.id, householdId))
    .limit(1);

  return row?.primaryBankAccountId ?? null;
}

export async function getPrimaryBankAccountIdForActiveHousehold(): Promise<string | null> {
  const householdId = await requireActiveHouseholdId();
  return getPrimaryBankAccountId(householdId);
}

export async function getPrimaryBankAccountForHousehold(
  householdId: string,
): Promise<{ id: string; label: string } | null> {
  const primaryBankAccountId = await getPrimaryBankAccountId(householdId);

  if (!primaryBankAccountId) {
    return null;
  }

  const [account] = await db
    .select({ id: bankAccounts.id, label: bankAccounts.label })
    .from(bankAccounts)
    .where(eq(bankAccounts.id, primaryBankAccountId))
    .limit(1);

  return account ?? null;
}
