import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  bankAccounts,
  imports,
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
  status: ImportStatus;
  bankAccountId: string;
  bankAccountLabel: string;
};

export async function getImports(limit?: number): Promise<ImportJobRow[]> {
  const householdId = await requireActiveHouseholdId();
  const query = db
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

  const rows = limit !== undefined ? await query.limit(limit) : await query;

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
    status: row.status,
    bankAccountId: row.bankAccountId,
    bankAccountLabel: row.bankAccountLabel,
  }));
}
