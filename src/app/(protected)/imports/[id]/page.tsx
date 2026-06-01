import { asc, desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

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
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/transactions"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to transactions
        </Link>
        <h1 className="text-2xl font-semibold">{importRecord.filename}</h1>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Imported at</dt>
          <dd className="font-medium">
            {formatDisplayDate(importRecord.importedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Rows imported</dt>
          <dd className="font-medium">{importRecord.rowCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Rows skipped</dt>
          <dd className="font-medium">
            {importRecord.skippedCount != null
              ? importRecord.skippedCount
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <Badge variant={importStatusBadgeVariant(importRecord.status)}>
              {formatImportStatus(importRecord.status)}
            </Badge>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Merchant</dt>
          <dd className="font-medium">
            {getMerchantLabelOrSlug(importRecord.merchant)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Imported by</dt>
          <dd className="font-medium">{importedBy}</dd>
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
