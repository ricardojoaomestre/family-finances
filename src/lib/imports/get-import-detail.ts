import { and, asc, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  categories,
  importSkippedRows,
  imports,
  type ImportSkippedRowReason,
  type ImportStatus,
  transactions,
  users,
} from '@/db/schema';
import { requireActiveHouseholdId } from '@/lib/household/active-household';

export type ImportDetailRecord = {
  id: string;
  filename: string;
  importedAt: Date;
  rowCount: number;
  skippedCount: number | null;
  status: ImportStatus;
  merchant: string;
  importerName: string | null;
  importerEmail: string | null;
};

export type ImportDetailTransaction = {
  id: string;
  date: Date;
  description: string;
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  value: string;
  balance: string | null;
};

export type ImportDetailSkippedRow = {
  id: string;
  rowIndex: number;
  date: Date | null;
  description: string;
  value: string | null;
  balance: string | null;
  reason: ImportSkippedRowReason;
  errors: string[] | null;
};

export type ImportDetail = {
  record: ImportDetailRecord;
  transactions: ImportDetailTransaction[];
  skippedRows: ImportDetailSkippedRow[];
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

export async function getImportDetail(id: string): Promise<ImportDetail | null> {
  const householdId = await requireActiveHouseholdId();
  const [record] = await db
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
    .where(and(eq(imports.id, id), eq(imports.householdId, householdId)))
    .limit(1);

  if (!record) {
    return null;
  }

  const [importTransactions, skippedRowRecords] = await Promise.all([
    db
      .select({
        id: transactions.id,
        date: transactions.date,
        description: transactions.description,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
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

  return {
    record,
    transactions: importTransactions,
    skippedRows: skippedRowRecords.map((row) => ({
      ...row,
      errors: parseSkippedRowErrors(row.errors),
    })),
  };
}
