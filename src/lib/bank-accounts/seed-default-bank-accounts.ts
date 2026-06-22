import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { bankAccounts, households } from '@/db/schema';
import {
  DEFAULT_PRIMARY_BANK_ACCOUNT_SLUG,
  getDefaultBankAccountSeeds,
} from '@/lib/bank-accounts/default-bank-accounts';

export async function seedDefaultBankAccountsForHousehold(
  householdId: string,
): Promise<string | null> {
  const seeds = getDefaultBankAccountSeeds();
  const now = new Date();
  let primaryBankAccountId: string | null = null;

  for (const seed of seeds) {
    const id = crypto.randomUUID();

    await db.insert(bankAccounts).values({
      id,
      householdId,
      slug: seed.slug,
      label: seed.label,
      importProfile: seed.importProfile,
      createdAt: now,
      updatedAt: now,
    });

    if (seed.slug === DEFAULT_PRIMARY_BANK_ACCOUNT_SLUG) {
      primaryBankAccountId = id;
    }
  }

  if (primaryBankAccountId) {
    await db
      .update(households)
      .set({
        primaryBankAccountId,
        updatedAt: now,
      })
      .where(eq(households.id, householdId));
  }

  return primaryBankAccountId;
}
