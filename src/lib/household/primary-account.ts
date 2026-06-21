import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { households } from '@/db/schema';
import { requireActiveHouseholdId } from '@/lib/household/active-household';
import { isMerchantSlug, type MerchantSlug } from '@/lib/merchants';

export async function getPrimaryAccountMerchant(
  householdId: string,
): Promise<MerchantSlug | null> {
  const [row] = await db
    .select({ primaryAccountMerchant: households.primaryAccountMerchant })
    .from(households)
    .where(eq(households.id, householdId))
    .limit(1);

  const merchant = row?.primaryAccountMerchant;

  if (!merchant || !isMerchantSlug(merchant)) {
    return null;
  }

  return merchant;
}

export async function getPrimaryAccountMerchantForActiveHousehold(): Promise<MerchantSlug | null> {
  const householdId = await requireActiveHouseholdId();
  return getPrimaryAccountMerchant(householdId);
}
