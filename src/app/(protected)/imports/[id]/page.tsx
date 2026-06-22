import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SetPageTitle } from '@/app/(protected)/components/protected-page-context';
import { ImportDetailTabs } from '@/app/(protected)/imports/[id]/components/import-detail-tabs';
import { Badge } from '@/components/ui/badge';
import { getImportDetail } from '@/lib/imports/get-import-detail';
import { formatDisplayDate, formatImportStatus } from '@/lib/formatters';
import { importStatusBadgeVariant } from '@/lib/status-badge';

type ImportDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ImportDetailPage({ params }: ImportDetailPageProps) {
  const { id } = await params;

  const detail = await getImportDetail(id);

  if (!detail) {
    notFound();
  }

  const {
    record: importRecord,
    transactions: importTransactions,
    skippedRows,
  } = detail;

  const importedBy =
    importRecord.importerName ?? importRecord.importerEmail ?? 'Unknown';

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <SetPageTitle title={importRecord.filename} />
      <Link
        href="/imports"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to imports
      </Link>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-xl border bg-card p-4 text-sm sm:grid-cols-3 sm:p-5 lg:grid-cols-6">
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Imported at
          </dt>
          <dd className="font-medium">
            {formatDisplayDate(importRecord.importedAt)}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Rows imported
          </dt>
          <dd className="font-medium tabular-nums">{importRecord.rowCount}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Rows skipped
          </dt>
          <dd className="font-medium tabular-nums">
            {importRecord.skippedCount != null
              ? importRecord.skippedCount
              : '—'}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </dt>
          <dd>
            <Badge variant={importStatusBadgeVariant(importRecord.status)}>
              {formatImportStatus(importRecord.status)}
            </Badge>
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Account
          </dt>
          <dd className="font-medium">{importRecord.bankAccountLabel}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Imported by
          </dt>
          <dd className="truncate font-medium" title={importedBy}>
            {importedBy}
          </dd>
        </div>
      </dl>

      <ImportDetailTabs
        importId={importRecord.id}
        skippedRows={skippedRows}
        transactions={importTransactions}
        skippedCount={importRecord.skippedCount}
        importStatus={importRecord.status}
      />
    </div>
  );
}
