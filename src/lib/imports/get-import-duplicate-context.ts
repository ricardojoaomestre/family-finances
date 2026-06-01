import { and, eq, ne } from 'drizzle-orm';

import { db } from '@/db';
import { importSkippedRows, transactions } from '@/db/schema';
import { buildDuplicateKey } from '@/lib/file-import';
import type { MerchantSlug } from '@/lib/merchants';

export async function getImportDuplicateContext(
  importId: string,
  merchant: MerchantSlug,
  options?: { excludeSkippedRowId?: string },
): Promise<{
  importedKeys: Set<string>;
  siblingKeys: Set<string>;
}> {
  const [importedRows, skippedRows] = await Promise.all([
    db
      .select({
        date: transactions.date,
        value: transactions.value,
      })
      .from(transactions)
      .where(eq(transactions.importId, importId)),
    db
      .select({
        id: importSkippedRows.id,
        date: importSkippedRows.date,
        value: importSkippedRows.value,
      })
      .from(importSkippedRows)
      .where(
        options?.excludeSkippedRowId
          ? and(
              eq(importSkippedRows.importId, importId),
              ne(importSkippedRows.id, options.excludeSkippedRowId),
            )
          : eq(importSkippedRows.importId, importId),
      ),
  ]);

  const importedKeys = new Set<string>();
  const siblingKeys = new Set<string>();

  for (const row of importedRows) {
    if (row.value === null) {
      continue;
    }

    const key = buildDuplicateKey(row.date, Number(row.value), merchant);
    importedKeys.add(key);
    siblingKeys.add(key);
  }

  for (const row of skippedRows) {
    if (row.date === null || row.value === null) {
      continue;
    }

    siblingKeys.add(
      buildDuplicateKey(row.date, Number(row.value), merchant),
    );
  }

  return { importedKeys, siblingKeys };
}
