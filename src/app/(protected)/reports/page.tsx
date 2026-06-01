import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';

export default function ReportsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Analyze transactions over a date range
          </p>
        </div>
        <Button asChild>
          <Link href="/report/new">Create report</Link>
        </Button>
      </div>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No saved reports</EmptyTitle>
          <EmptyDescription>
            Reports are not saved yet. Create a month processing report to
            explore transactions in a date range.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
