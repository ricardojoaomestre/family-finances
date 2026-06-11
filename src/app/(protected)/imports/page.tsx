import Link from 'next/link';

import { SetPageHeader } from '@/app/(protected)/components/protected-page-context';
import { ImportJobsTable } from '@/app/(protected)/imports/components/import-jobs-table';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { getImports } from '@/lib/imports/get-imports';

export default async function ImportJobsPage() {
  const importJobs = await getImports();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <SetPageHeader
        description="All spreadsheet imports"
        actions={
          <Button asChild>
            <Link href="/imports/new">Import file</Link>
          </Button>
        }
      />

      {importJobs.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No imports yet</EmptyTitle>
            <EmptyDescription>
              Upload a bank or card export to create your first import job.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" asChild>
              <Link href="/imports/new">Import file</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ImportJobsTable data={importJobs} />
      )}
    </div>
  );
}
