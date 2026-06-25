import Link from 'next/link';

import { SetPageHeader } from '@/app/(protected)/components/protected-page-context';
import { ApiImport } from '@/app/(protected)/imports/components/api-import';
import { FileImport } from '@/app/(protected)/imports/components/file-import';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getBankAccounts } from '@/lib/bank-accounts/get-bank-accounts';
import { isBankAggregatorConfigured } from '@/lib/bank/config';
import { getApiLinksForHousehold } from '@/lib/bank-connections/get-api-links';
import { requireActiveHouseholdId } from '@/lib/household/active-household';

export default async function NewImportPage() {
  const [bankAccounts, householdId] = await Promise.all([
    getBankAccounts(),
    requireActiveHouseholdId(),
  ]);
  const bankApiEnabled = isBankAggregatorConfigured();
  const apiLinks = bankApiEnabled
    ? await getApiLinksForHousehold(householdId)
    : [];
  const linkedBankAccountIds = new Set(apiLinks.map((link) => link.bankAccountId));
  const linkedBankAccounts = bankAccounts
    .filter((account) => linkedBankAccountIds.has(account.id))
    .map((account) => ({ id: account.id, label: account.label }));

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <SetPageHeader
        description="Upload a file or pull transactions from a linked bank account."
        actions={
          <Button variant="outline" asChild>
            <Link href="/imports">Back to import jobs</Link>
          </Button>
        }
      />

      {bankApiEnabled ? (
        <Tabs defaultValue="file" className="flex flex-col gap-6">
          <TabsList>
            <TabsTrigger value="file">File upload</TabsTrigger>
            <TabsTrigger value="api">Bank API</TabsTrigger>
          </TabsList>
          <TabsContent value="file">
            <FileImport
              bankAccounts={bankAccounts.map((account) => ({
                id: account.id,
                label: account.label,
              }))}
            />
          </TabsContent>
          <TabsContent value="api">
            <ApiImport linkedBankAccounts={linkedBankAccounts} />
          </TabsContent>
        </Tabs>
      ) : (
        <FileImport
          bankAccounts={bankAccounts.map((account) => ({
            id: account.id,
            label: account.label,
          }))}
        />
      )}
    </div>
  );
}
