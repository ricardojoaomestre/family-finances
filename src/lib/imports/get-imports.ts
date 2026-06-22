import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { bankAccounts, imports, type ImportStatus } from '@/db/schema';
import { requireActiveHouseholdId } from '@/lib/household/active-household';

export type ImportJobRow = {
  id: string;
  filename: string;
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

  if (limit !== undefined) {
    return query.limit(limit);
  }

  return query;
}
