import Link from 'next/link';

import { ReportsTable } from '@/app/(protected)/reports/components/reports-table';
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
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Saved monthly spending reports
          </p>
        </div>
        <Button asChild>
          <Link href="/report/new">Create report</Link>
        </Button>
      </div>

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
