import Link from 'next/link';

import { ReportsTable } from '@/app/(protected)/reports/components/reports-table';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { getReports } from '@/lib/reports/get-reports';

export default async function ReportsPage() {
  const reportRows = await getReports();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Reports"
        description="Saved monthly spending reports"
        actions={
          <Button asChild>
            <Link href="/report/new">Create report</Link>
          </Button>
        }
      />

      {reportRows.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No saved reports</EmptyTitle>
            <EmptyDescription>
              Create a report to review spending for a month and save it
              for later.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ReportsTable reports={reportRows} />
      )}
    </div>
  );
}
