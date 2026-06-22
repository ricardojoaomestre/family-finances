import Link from 'next/link';

import { SetPageHeader } from '@/app/(protected)/components/protected-page-context';
import { FileImport } from '@/app/(protected)/imports/components/file-import';
import { Button } from '@/components/ui/button';
import { getBankAccounts } from '@/lib/bank-accounts/get-bank-accounts';

export default async function NewImportPage() {
  const bankAccounts = await getBankAccounts();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <SetPageHeader
        description="Upload a CSV or Excel export, review rows, then confirm."
        actions={
          <Button variant="outline" asChild>
            <Link href="/imports">Back to import jobs</Link>
          </Button>
        }
      />
      <FileImport
        bankAccounts={bankAccounts.map((account) => ({
          id: account.id,
          label: account.label,
        }))}
      />
    </div>
  );
}
