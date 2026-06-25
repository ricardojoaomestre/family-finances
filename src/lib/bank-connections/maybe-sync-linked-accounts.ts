import { getApiLinksForHousehold } from '@/lib/bank-connections/get-api-links';
import { syncBankAccount } from '@/lib/bank-connections/sync-bank-account';
import type { PsuHeaders } from '@/lib/bank/psu-headers';

export type MaybeSyncLinkedAccountsResult = {
  synced: Array<{
    bankAccountId: string;
    importedCount: number;
    skippedCount: number;
  }>;
  skipped: Array<{ bankAccountId: string; reason: string }>;
  failed: Array<{ bankAccountId: string; error: string }>;
};

export async function maybeSyncLinkedAccounts(input: {
  householdId: string;
  userId: string;
  psuHeaders?: PsuHeaders;
}): Promise<MaybeSyncLinkedAccountsResult> {
  const links = await getApiLinksForHousehold(input.householdId);
  const result: MaybeSyncLinkedAccountsResult = {
    synced: [],
    skipped: [],
    failed: [],
  };

  for (const link of links) {
    const syncResult = await syncBankAccount({
      bankAccountId: link.bankAccountId,
      householdId: input.householdId,
      userId: input.userId,
      psuHeaders: input.psuHeaders,
    });

    if (syncResult.ok && syncResult.skipped) {
      result.skipped.push({
        bankAccountId: link.bankAccountId,
        reason: syncResult.reason,
      });
      continue;
    }

    if (!syncResult.ok) {
      result.failed.push({
        bankAccountId: link.bankAccountId,
        error: syncResult.error,
      });
      continue;
    }

    result.synced.push({
      bankAccountId: link.bankAccountId,
      importedCount: syncResult.importedCount,
      skippedCount: syncResult.skippedCount,
    });
  }

  return result;
}
