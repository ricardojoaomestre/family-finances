import { asc, desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SetPageTitle } from '@/app/(protected)/components/protected-page-context';
import { ImportDetailTabs } from '@/app/(protected)/imports/[id]/components/import-detail-tabs';
import type { ImportSkippedRow } from '@/app/(protected)/imports/[id]/components/import-skipped-rows-table';
import { Badge } from '@/components/ui/badge';
import { db } from '@/db';
import {
  categories,
  importSkippedRows,
  imports,
  transactions,
  users,
} from '@/db/schema';
import { formatDisplayDate, formatImportStatus } from '@/lib/formatters';
import { getMerchantLabelOrSlug } from '@/lib/merchants';
import { importStatusBadgeVariant } from '@/lib/status-badge';

type ImportDetailPageProps = {
  params: Promise<{ id: string }>;
};

function parseSkippedRowErrors(errors: string | null): string[] | null {
  if (!errors) return null;

  try {
    const parsed: unknown = JSON.parse(errors);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : null;
  } catch {
    return null;
  }
}

export default async function ImportDetailPage({ params }: ImportDetailPageProps) {
  const { id } = await params;

  const [importRecord] = await db
    .select({
      id: imports.id,
      filename: imports.filename,
      importedAt: imports.importedAt,
      rowCount: imports.rowCount,
      skippedCount: imports.skippedCount,
      status: imports.status,
      merchant: imports.merchant,
      importerName: users.name,
      importerEmail: users.email,
    })
    .from(imports)
    .innerJoin(users, eq(imports.userId, users.id))
    .where(eq(imports.id, id))
    .limit(1);

  if (!importRecord) {
    notFound();
  }

  const [importTransactions, skippedRowRecords] = await Promise.all([
    db
      .select({
        id: transactions.id,
        date: transactions.date,
        description: transactions.description,
        categoryName: categories.name,
        value: transactions.value,
        balance: transactions.balance,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.importId, id))
      .orderBy(desc(transactions.date)),
    db
      .select({
        id: importSkippedRows.id,
        rowIndex: importSkippedRows.rowIndex,
        date: importSkippedRows.date,
        description: importSkippedRows.description,
        value: importSkippedRows.value,
        balance: importSkippedRows.balance,
        reason: importSkippedRows.reason,
        errors: importSkippedRows.errors,
      })
      .from(importSkippedRows)
      .where(eq(importSkippedRows.importId, id))
      .orderBy(asc(importSkippedRows.rowIndex)),
  ]);

  const skippedRows: ImportSkippedRow[] = skippedRowRecords.map((row) => ({
    ...row,
    errors: parseSkippedRowErrors(row.errors),
  }));

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
            Merchant
          </dt>
          <dd className="font-medium">
            {getMerchantLabelOrSlug(importRecord.merchant)}
          </dd>
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
