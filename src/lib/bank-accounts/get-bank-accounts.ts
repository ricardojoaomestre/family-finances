import { asc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { bankAccounts } from '@/db/schema';
import type { BankAccountImportProfile } from '@/lib/bank-accounts/import-profile';
import { requireActiveHouseholdId } from '@/lib/household/active-household';

export type BankAccountRow = {
  id: string;
  slug: string;
  label: string;
  importProfile: BankAccountImportProfile;
};

export async function getBankAccounts(): Promise<BankAccountRow[]> {
  const householdId = await requireActiveHouseholdId();

  return db
    .select({
      id: bankAccounts.id,
      slug: bankAccounts.slug,
      label: bankAccounts.label,
      importProfile: bankAccounts.importProfile,
    })
    .from(bankAccounts)
    .where(eq(bankAccounts.householdId, householdId))
    .orderBy(asc(bankAccounts.label));
}

export async function getBankAccountsForHousehold(
  householdId: string,
): Promise<BankAccountRow[]> {
  return db
    .select({
      id: bankAccounts.id,
      slug: bankAccounts.slug,
      label: bankAccounts.label,
      importProfile: bankAccounts.importProfile,
    })
    .from(bankAccounts)
    .where(eq(bankAccounts.householdId, householdId))
    .orderBy(asc(bankAccounts.label));
}
