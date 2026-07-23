import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm';

import { db } from '@/db';
import {
  bankAccounts,
  imports,
  importSkippedRows,
  transactions,
  type ImportSource,
  type ImportStatus,
} from '@/db/schema';
import { formatImportJobLabel } from '@/lib/imports/format-import-job-label';
import { requireActiveHouseholdId } from '@/lib/household/active-household';

export type ImportJobRow = {
  id: string;
  label: string;
  filename: string | null;
  source: ImportSource;
  importedAt: Date;
  rowCount: number;
  duplicateCount: number;
  uncategorizedCount: number;
  status: ImportStatus;
  bankAccountId: string;
  bankAccountLabel: string;
};

export async function getImports(limit?: number): Promise<ImportJobRow[]> {
  const householdId = await requireActiveHouseholdId();

  const importsQuery = db
    .select({
      id: imports.id,
      filename: imports.filename,
      source: imports.source,
      periodFrom: imports.periodFrom,
      periodTo: imports.periodTo,
      importedAt: imports.importedAt,
      rowCount: imports.rowCount,
      status: imports.status,
      bankAccountId: imports.bankAccountId,
      bankAccountLabel: bankAccounts.label,
    })
    .from(imports)
    .innerJoin(bankAccounts, eq(imports.bankAccountId, bankAccounts.id))
    .where(eq(imports.householdId, householdId))
    .orderBy(desc(imports.importedAt));

  const [rows, duplicateRows, uncategorizedRows] = await Promise.all([
    limit !== undefined ? importsQuery.limit(limit) : importsQuery,
    db
      .select({
        importId: importSkippedRows.importId,
        count: count(),
      })
      .from(importSkippedRows)
      .innerJoin(imports, eq(importSkippedRows.importId, imports.id))
      .where(
        and(
          eq(imports.householdId, householdId),
          inArray(importSkippedRows.reason, [
            'duplicate_in_file',
            'duplicate_existing',
          ]),
        ),
      )
      .groupBy(importSkippedRows.importId),
    db
      .select({
        importId: transactions.importId,
        count: count(),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.householdId, householdId),
          isNull(transactions.categoryId),
        ),
      )
      .groupBy(transactions.importId),
  ]);

  const duplicateCountByImportId = new Map(
    duplicateRows.map((row) => [row.importId, Number(row.count)]),
  );
  const uncategorizedCountByImportId = new Map(
    uncategorizedRows.map((row) => [row.importId, Number(row.count)]),
  );

  return rows.map((row) => ({
    id: row.id,
    label: formatImportJobLabel({
      source: row.source,
      filename: row.filename,
      periodFrom: row.periodFrom,
      periodTo: row.periodTo,
    }),
    filename: row.filename,
    source: row.source,
    importedAt: row.importedAt,
    rowCount: row.rowCount,
    duplicateCount: duplicateCountByImportId.get(row.id) ?? 0,
    uncategorizedCount: uncategorizedCountByImportId.get(row.id) ?? 0,
    status: row.status,
    bankAccountId: row.bankAccountId,
    bankAccountLabel: row.bankAccountLabel,
  }));
}
