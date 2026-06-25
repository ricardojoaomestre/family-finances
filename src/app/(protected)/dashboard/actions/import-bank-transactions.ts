'use server';

import { auth } from '@/auth';
import type { ParsedImportRow } from '@/app/(protected)/dashboard/actions/import-file';
import { rematchImportCategories } from '@/app/(protected)/dashboard/actions/import-file';
import { fetchBankTransactionsForConnection } from '@/lib/bank/fetch-bank-transactions-for-connection';
import { getBankAggregatorProvider } from '@/lib/bank/get-bank-aggregator';
import { mapBankTransactionsToImportRows } from '@/lib/bank/map-bank-transaction-to-import-row';
import { readPsuHeadersFromRequest } from '@/lib/bank/psu-headers';
import { getApiLinkForBankAccount } from '@/lib/bank-connections/get-api-links';
import { getBankAccountForActiveHousehold } from '@/lib/bank-accounts/get-bank-account';
import {
  detectDuplicateStatuses,
  type ImportedSpreadsheetRow,
} from '@/lib/file-import';
import { getExistingDuplicateKeys } from '@/lib/file-import/get-existing-duplicate-keys';
import { validateImportPeriod } from '@/lib/imports/validate-import-period';

export type ImportBankTransactionsInput = {
  bankAccountId: string;
  dateFrom: string;
  dateTo: string;
};

export type ImportBankTransactionsResult =
  | {
      ok: true;
      data: ParsedImportRow[];
      categories: Awaited<ReturnType<typeof rematchImportCategories>>['categories'];
      dateFrom: string;
      dateTo: string;
      previewLabel: string;
    }
  | { ok: false; error: string };

export async function importBankTransactions(
  input: ImportBankTransactionsInput,
): Promise<ImportBankTransactionsResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in to import data.' };
  }

  const period = validateImportPeriod({
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
  });

  if (!period.ok) {
    return { ok: false, error: period.error };
  }

  const bankAccount = await getBankAccountForActiveHousehold(input.bankAccountId);
  if (!bankAccount) {
    return { ok: false, error: 'Bank account not found.' };
  }

  const link = await getApiLinkForBankAccount(input.bankAccountId);
  if (!link) {
    return {
      ok: false,
      error:
        'No bank API link for this account. Connect it in Settings → Accounts.',
    };
  }

  try {
    const provider = getBankAggregatorProvider();

    if (provider.id !== link.providerId) {
      return {
        ok: false,
        error: 'Configured bank provider does not match the saved link.',
      };
    }

    const psuHeaders = await readPsuHeadersFromRequest();
    const fetched = await fetchBankTransactionsForConnection(provider, {
      connectionId: link.externalSessionId,
      accountIds: [link.externalAccountId],
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
      psuHeaders,
    });

    const spreadsheetRows: ImportedSpreadsheetRow[] = fetched.accounts.flatMap(
      ({ transactions }) => mapBankTransactionsToImportRows(transactions),
    );

    if (spreadsheetRows.length === 0) {
      return {
        ok: false,
        error: 'No transactions were returned for the selected period.',
      };
    }

    const existingKeys = await getExistingDuplicateKeys(input.bankAccountId);
    const duplicateStatuses = detectDuplicateStatuses(
      spreadsheetRows,
      existingKeys,
      input.bankAccountId,
    );

    const rowsWithDuplicates: ParsedImportRow[] = spreadsheetRows.map(
      (row, index) => ({
        ...row,
        duplicate: duplicateStatuses[index]!,
        noteMatch: null,
      }),
    );

    const matched = await rematchImportCategories(
      rowsWithDuplicates,
      input.bankAccountId,
    );

    return {
      ok: true,
      data: matched.data,
      categories: matched.categories,
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
      previewLabel: `${bankAccount.label} · ${period.dateFrom} → ${period.dateTo}`,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch transactions from the bank.',
    };
  }
}
