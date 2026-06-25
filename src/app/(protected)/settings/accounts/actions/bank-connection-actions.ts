'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { getBankAggregatorRedirectUrl } from '@/lib/bank/config';
import { getBankAggregatorProvider } from '@/lib/bank/get-bank-aggregator';
import { isBankAggregatorConfigured } from '@/lib/bank/config';
import {
  deleteBankAccountApiLink,
  getBankConnectionById,
  saveBankAccountApiLink,
} from '@/lib/bank-connections/connection-repository';
import { createOAuthState } from '@/lib/bank-connections/oauth-state';
import { getApiLinkForBankAccount } from '@/lib/bank-connections/get-api-links';
import { getBankAccountForActiveHousehold } from '@/lib/bank-accounts/get-bank-account';
import { getActiveHouseholdId } from '@/lib/household/active-household';
import { maybeSyncLinkedAccounts } from '@/lib/bank-connections/maybe-sync-linked-accounts';
import { syncBankAccount } from '@/lib/bank-connections/sync-bank-account';
import { readPsuHeadersFromRequest } from '@/lib/bank/psu-headers';

export type BankInstitutionOption = {
  id: string;
  name: string;
  countryCode: string;
};

export type ConnectionAccountOption = {
  id: string;
  label: string;
  iban: string | null;
};

export type StartBankConnectionResult =
  | { ok: true; authUrl: string }
  | { ok: false; error: string };

export type ListBankInstitutionsResult =
  | { ok: true; institutions: BankInstitutionOption[] }
  | { ok: false; error: string; institutions: [] };

export async function listBankInstitutions(
  countryCode = 'PT',
): Promise<ListBankInstitutionsResult> {
  if (!isBankAggregatorConfigured()) {
    return {
      ok: false,
      error:
        'Bank API is not configured. Set BANK_AGGREGATOR_PROVIDER in .env.local.',
      institutions: [],
    };
  }

  try {
    const provider = getBankAggregatorProvider();
    const institutions = await provider.listInstitutions(countryCode);
    return {
      ok: true,
      institutions: institutions
        .map(({ id, name, countryCode: code }) => ({
          id,
          name,
          countryCode: code,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not load banks.';
    console.error('[listBankInstitutions]', error);
    return { ok: false, error: message, institutions: [] };
  }
}

export async function startBankConnection(input: {
  bankAccountId: string;
  institutionId: string;
}): Promise<StartBankConnectionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  if (!isBankAggregatorConfigured()) {
    return { ok: false, error: 'Bank API is not configured.' };
  }

  const householdId = await getActiveHouseholdId();
  if (!householdId) {
    return { ok: false, error: 'No active household selected.' };
  }

  const bankAccount = await getBankAccountForActiveHousehold(input.bankAccountId);
  if (!bankAccount) {
    return { ok: false, error: 'Bank account not found.' };
  }

  try {
    const provider = getBankAggregatorProvider();
    const result = await provider.startConnection({
      institutionId: input.institutionId,
      redirectUrl: getBankAggregatorRedirectUrl(),
      reference: createOAuthState({
        bankAccountId: input.bankAccountId,
        householdId,
      }),
    });

    return { ok: true, authUrl: result.authUrl };
  } catch (error) {
    console.error('[startBankConnection]', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not start bank connection.',
    };
  }
}

export async function listConnectionAccounts(
  connectionId: string,
): Promise<
  | { ok: true; accounts: ConnectionAccountOption[] }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const connection = await getBankConnectionById(connectionId);
  if (!connection) {
    return { ok: false, error: 'Connection not found.' };
  }

  const householdId = await getActiveHouseholdId();
  if (!householdId || connection.householdId !== householdId) {
    return { ok: false, error: 'Connection not found.' };
  }

  try {
    const provider = getBankAggregatorProvider();
    const remote = await provider.getConnection(connection.externalSessionId);

    if (remote.accountIds.length === 0) {
      return { ok: false, error: 'No accounts are linked to this connection.' };
    }

    const accounts = await Promise.all(
      remote.accountIds.map(async (accountId) => {
        const account = await provider.getAccount(accountId);
        const typeLabel =
          account.cashAccountType === 'CARD'
            ? 'Credit card'
            : account.cashAccountType === 'CACC'
              ? 'Current account'
              : account.cashAccountType ?? 'Account';
        const ownerLabel =
          account.name ?? account.iban ?? account.ownerName ?? accountId;

        return {
          id: account.id,
          label: [typeLabel, account.product, ownerLabel].filter(Boolean).join(' · '),
          iban: account.iban ?? null,
        };
      }),
    );

    return { ok: true, accounts };
  } catch (error) {
    console.error('[listConnectionAccounts]', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not load accounts.',
    };
  }
}

export async function completeBankAccountLink(input: {
  bankAccountId: string;
  connectionId: string;
  externalAccountId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const bankAccount = await getBankAccountForActiveHousehold(input.bankAccountId);
  if (!bankAccount) {
    return { ok: false, error: 'Bank account not found.' };
  }

  const connection = await getBankConnectionById(input.connectionId);
  const householdId = await getActiveHouseholdId();
  if (!connection || !householdId || connection.householdId !== householdId) {
    return { ok: false, error: 'Connection not found.' };
  }

  try {
    const provider = getBankAggregatorProvider();
    const account = await provider.getAccount(input.externalAccountId);

    await saveBankAccountApiLink({
      bankAccountId: input.bankAccountId,
      connectionId: input.connectionId,
      externalAccountId: input.externalAccountId,
      accountIban: account.iban ?? null,
      accountName: account.name ?? null,
    });

    revalidatePath('/settings/accounts');
    revalidatePath('/imports/new');

    const psuHeaders = await readPsuHeadersFromRequest();
    await syncBankAccount({
      bankAccountId: input.bankAccountId,
      householdId,
      userId: session.user.id,
      psuHeaders,
      force: true,
    });

    revalidatePath('/settings/accounts');
    revalidatePath('/imports');
    revalidatePath('/transactions');

    return { ok: true };
  } catch (error) {
    console.error('[completeBankAccountLink]', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not save bank link.',
    };
  }
}

export async function unlinkBankAccountApi(
  bankAccountId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const bankAccount = await getBankAccountForActiveHousehold(bankAccountId);
  if (!bankAccount) {
    return { ok: false, error: 'Bank account not found.' };
  }

  await deleteBankAccountApiLink(bankAccountId);
  revalidatePath('/settings/accounts');
  revalidatePath('/imports/new');
  return { ok: true };
}

export async function syncBankAccountNow(
  bankAccountId: string,
): Promise<
  | { ok: true; importedCount: number; skippedCount: number }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const householdId = await getActiveHouseholdId();
  if (!householdId) {
    return { ok: false, error: 'No active household selected.' };
  }

  const psuHeaders = await readPsuHeadersFromRequest();
  const result = await syncBankAccount({
    bankAccountId,
    householdId,
    userId: session.user.id,
    psuHeaders,
  });

  if (result.ok && result.skipped) {
    return { ok: false, error: result.reason };
  }

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath('/settings/accounts');
  revalidatePath('/imports');
  revalidatePath('/transactions');

  return {
    ok: true,
    importedCount: result.importedCount,
    skippedCount: result.skippedCount,
  };
}

export async function triggerLinkedAccountSync(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id || !isBankAggregatorConfigured()) {
    return;
  }

  const householdId = await getActiveHouseholdId();
  if (!householdId) {
    return;
  }

  const psuHeaders = await readPsuHeadersFromRequest();
  await maybeSyncLinkedAccounts({
    householdId,
    userId: session.user.id,
    psuHeaders,
  });

  revalidatePath('/settings/accounts');
  revalidatePath('/imports');
  revalidatePath('/transactions');
}

export async function getBankAccountApiLinkStatus(bankAccountId: string) {
  return getApiLinkForBankAccount(bankAccountId);
}
