import {
  detectDuplicateStatuses,
  type ImportedSpreadsheetRow,
} from '@/lib/file-import';
import { getExistingDuplicateKeys } from '@/lib/file-import/get-existing-duplicate-keys';
import type { ParsedImportRow } from '@/app/(protected)/dashboard/actions/import-file';
import { rematchImportCategories } from '@/app/(protected)/dashboard/actions/import-file';
import { fetchBankTransactionsForConnection } from '@/lib/bank/fetch-bank-transactions-for-connection';
import { getBankAggregatorProvider } from '@/lib/bank/get-bank-aggregator';
import { mapBankTransactionsToImportRows } from '@/lib/bank/map-bank-transaction-to-import-row';
import { EnableBankingRequestError } from '@/lib/bank/providers/enable-banking/client';
import type { PsuHeaders } from '@/lib/bank/psu-headers';
import {
  getApiLinkForBankAccount,
  updateApiLinkSyncState,
} from '@/lib/bank-connections/get-api-links';
import {
  INITIAL_SYNC_DAYS,
  RATE_LIMIT_RETRY_MS,
  SYNC_OVERLAP_DAYS,
  canSyncNow,
  nextSyncCount,
  subtractCalendarDays,
  getUtcDateKey,
} from '@/lib/bank-connections/sync-quota';
import { formatCalendarDayKey } from '@/lib/dates/calendar-day-key';
import { persistImportRows } from '@/lib/imports/persist-import-rows';
import { getBankAccountForActiveHousehold } from '@/lib/bank-accounts/get-bank-account';

export type SyncBankAccountInput = {
  bankAccountId: string;
  householdId: string;
  userId: string;
  psuHeaders?: PsuHeaders;
  force?: boolean;
};

export type SyncBankAccountResult =
  | {
      ok: true;
      importedCount: number;
      skippedCount: number;
      importId: string | null;
      skipped: false;
    }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string; status?: 'session_expired' | 'rate_limited' | 'failed' };

function isSessionExpired(accessValidUntil: Date | null): boolean {
  if (!accessValidUntil) {
    return false;
  }
  return accessValidUntil.getTime() <= Date.now();
}

function buildSyncDateRange(lastSyncedAt: Date | null): {
  dateFrom: string;
  dateTo: string;
} {
  const dateTo = getUtcDateKey();
  if (!lastSyncedAt) {
    return {
      dateFrom: subtractCalendarDays(dateTo, INITIAL_SYNC_DAYS),
      dateTo,
    };
  }

  const lastKey = formatCalendarDayKey(lastSyncedAt);
  return {
    dateFrom: subtractCalendarDays(lastKey, SYNC_OVERLAP_DAYS),
    dateTo,
  };
}

export async function syncBankAccount(
  input: SyncBankAccountInput,
): Promise<SyncBankAccountResult> {
  const bankAccount = await getBankAccountForActiveHousehold(input.bankAccountId);

  if (!bankAccount) {
    return { ok: false, error: 'Bank account not found.', status: 'failed' };
  }

  const apiLink = await getApiLinkForBankAccount(input.bankAccountId);

  if (!apiLink) {
    return { ok: false, error: 'No bank API link for this account.', status: 'failed' };
  }

  if (isSessionExpired(apiLink.accessValidUntil)) {
    await updateApiLinkSyncState(apiLink.id, {
      lastSyncStatus: 'session_expired',
      lastSyncError: 'Bank connection expired. Reconnect to continue syncing.',
      syncInProgressAt: null,
    });
    return {
      ok: false,
      error: 'Bank connection expired. Reconnect to continue syncing.',
      status: 'session_expired',
    };
  }

  if (!input.force) {
    const quota = canSyncNow({
      syncsTodayCount: apiLink.syncsTodayCount,
      syncsTodayDate: apiLink.syncsTodayDate,
      lastSyncedAt: apiLink.lastSyncedAt,
      syncInProgressAt: apiLink.syncInProgressAt,
    });

    if (!quota.allowed) {
      return { ok: true, skipped: true, reason: quota.reason };
    }
  }

  const lockTime = new Date();
  await updateApiLinkSyncState(apiLink.id, { syncInProgressAt: lockTime });

  const { dateFrom, dateTo } = buildSyncDateRange(apiLink.lastSyncedAt);

  try {
    const provider = getBankAggregatorProvider();

    if (provider.id !== apiLink.providerId) {
      throw new Error('Configured bank provider does not match the saved link.');
    }

    const fetched = await fetchBankTransactionsForConnection(provider, {
      connectionId: apiLink.externalSessionId,
      accountIds: [apiLink.externalAccountId],
      dateFrom,
      dateTo,
      fetchMode: apiLink.lastSyncImportId ? 'recent' : 'initial',
      psuHeaders: input.psuHeaders,
    });

    const accountResult = fetched.accounts[0];
    const spreadsheetRows: ImportedSpreadsheetRow[] = accountResult
      ? mapBankTransactionsToImportRows(accountResult.transactions)
      : [];

    if (spreadsheetRows.length === 0) {
      const counter = nextSyncCount(
        apiLink.syncsTodayCount,
        apiLink.syncsTodayDate,
      );
      await updateApiLinkSyncState(apiLink.id, {
        lastSyncedAt: new Date(),
        lastSyncStatus: 'success',
        lastSyncError: null,
        syncInProgressAt: null,
        ...counter,
      });
      return {
        ok: true,
        skipped: false,
        importedCount: 0,
        skippedCount: 0,
        importId: null,
      };
    }

    const existingKeys = await getExistingDuplicateKeys(input.bankAccountId);
    const duplicateStatuses = detectDuplicateStatuses(
      spreadsheetRows,
      existingKeys,
      input.bankAccountId,
    );

    const parsedRows: ParsedImportRow[] = spreadsheetRows.map((row, index) => ({
      ...row,
      duplicate: duplicateStatuses[index]!,
      noteMatch: null,
    }));

    const matched = await rematchImportCategories(
      parsedRows,
      input.bankAccountId,
    );

    const persistResult = await persistImportRows({
      householdId: input.householdId,
      userId: input.userId,
      bankAccountId: input.bankAccountId,
      rows: matched.data,
      filename: null,
      source: 'api',
      periodFrom: dateFrom,
      periodTo: dateTo,
    });

    if (!persistResult.ok) {
      throw new Error(persistResult.error);
    }

    const counter = nextSyncCount(
      apiLink.syncsTodayCount,
      apiLink.syncsTodayDate,
    );
    await updateApiLinkSyncState(apiLink.id, {
      lastSyncedAt: new Date(),
      lastSyncStatus: 'success',
      lastSyncError: null,
      lastSyncImportId: persistResult.importId,
      syncInProgressAt: null,
      ...counter,
    });

    return {
      ok: true,
      skipped: false,
      importedCount: persistResult.importedCount,
      skippedCount: persistResult.skippedCount,
      importId: persistResult.importId,
    };
  } catch (error) {
    const isRateLimited =
      error instanceof EnableBankingRequestError && error.isRateLimited;
    const isExpired =
      error instanceof Error &&
      /session|expired|authorization/i.test(error.message);

    await updateApiLinkSyncState(apiLink.id, {
      lastSyncStatus: isRateLimited
        ? 'rate_limited'
        : isExpired
          ? 'session_expired'
          : 'failed',
      lastSyncError:
        error instanceof Error ? error.message : 'Unknown sync error.',
      syncInProgressAt: null,
    });

    if (isRateLimited) {
      return {
        ok: false,
        error: `Bank rate limit reached. Try again in about ${RATE_LIMIT_RETRY_MS / (60 * 60 * 1000)} hours.`,
        status: 'rate_limited',
      };
    }

    if (isExpired) {
      return {
        ok: false,
        error: 'Bank connection expired. Reconnect to continue syncing.',
        status: 'session_expired',
      };
    }

    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Sync failed.',
      status: 'failed',
    };
  }
}
