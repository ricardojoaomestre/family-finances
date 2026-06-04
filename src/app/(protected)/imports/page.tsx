import Link from 'next/link';

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
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Import jobs</h1>
          <p className="text-sm text-muted-foreground">
            All spreadsheet imports
          </p>
        </div>
        <Button variant="outline" className="shrink-0" asChild>
          <Link href="/imports/new">Import file</Link>
        </Button>
      </div>

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
