import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { bankAccounts } from '@/db/schema';
import type { BankAccountImportProfile } from '@/lib/bank-accounts/import-profile';
import { requireActiveHouseholdId } from '@/lib/household/active-household';

export type BankAccountDetail = {
  id: string;
  slug: string;
  label: string;
  importProfile: BankAccountImportProfile;
};

export async function getBankAccountForActiveHousehold(
  bankAccountId: string,
): Promise<BankAccountDetail | null> {
  const householdId = await requireActiveHouseholdId();

  const [account] = await db
    .select({
      id: bankAccounts.id,
      slug: bankAccounts.slug,
      label: bankAccounts.label,
      importProfile: bankAccounts.importProfile,
    })
    .from(bankAccounts)
    .where(
      and(
        eq(bankAccounts.id, bankAccountId),
        eq(bankAccounts.householdId, householdId),
      ),
    )
    .limit(1);

  return account ?? null;
}
