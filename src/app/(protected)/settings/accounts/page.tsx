import { AccountsManager } from '@/app/(protected)/settings/accounts/components/accounts-manager';
import { getBankAccounts } from '@/lib/bank-accounts/get-bank-accounts';
import { isBankAggregatorConfigured } from '@/lib/bank/config';
import { getApiLinksForHousehold } from '@/lib/bank-connections/get-api-links';
import { requireActiveHouseholdId } from '@/lib/household/active-household';

type AccountsSettingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const value = params[key];
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return null;
}

export default async function AccountsSettingsPage({
  searchParams,
}: AccountsSettingsPageProps) {
  const resolvedSearchParams = await searchParams;
  const [accounts, householdId] = await Promise.all([
    getBankAccounts(),
    requireActiveHouseholdId(),
  ]);
  const bankApiEnabled = isBankAggregatorConfigured();
  const apiLinks = bankApiEnabled
    ? await getApiLinksForHousehold(householdId)
    : [];

  return (
    <AccountsManager
      accounts={accounts}
      apiLinks={apiLinks}
      bankApiEnabled={bankApiEnabled}
      pendingBankAccountId={readSearchParam(
        resolvedSearchParams,
        'pendingBankAccountId',
      )}
      pendingConnectionId={readSearchParam(
        resolvedSearchParams,
        'pendingConnectionId',
      )}
    />
  );
}
