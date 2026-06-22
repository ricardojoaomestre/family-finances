import { AccountsManager } from '@/app/(protected)/settings/accounts/components/accounts-manager';
import { getBankAccounts } from '@/lib/bank-accounts/get-bank-accounts';

export default async function AccountsSettingsPage() {
  const accounts = await getBankAccounts();

  return <AccountsManager accounts={accounts} />;
}
