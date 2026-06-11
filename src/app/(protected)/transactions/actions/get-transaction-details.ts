'use server';

import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { categories, imports, transactions } from '@/db/schema';
import {
  getDefaultCategoryColor,
  isCategoryColorToken,
} from '@/lib/categories/category-colors';
import { resolveCategoryIcon } from '@/lib/categories/category-icons';
import { isTransactionId } from '@/lib/transactions/validate-transaction-form';
import type { TransactionDetails } from '@/lib/transactions/transaction-details';

export type GetTransactionDetailsResult =
  | { ok: true; data: TransactionDetails }
  | { ok: false; error: string };

function toIsoString(value: Date | null): string | null {
  if (!value) {
    return null;
  }

  return value.toISOString();
}

export async function getTransactionDetails(
  id: string,
): Promise<GetTransactionDetailsResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  if (!isTransactionId(id)) {
    return { ok: false, error: 'Transaction not found.' };
  }

  const [row] = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
      value: transactions.value,
      balance: transactions.balance,
      merchant: transactions.merchant,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
      importId: transactions.importId,
      importFilename: imports.filename,
      importStatus: imports.status,
      importImportedAt: imports.importedAt,
      insertedAt: transactions.insertedAt,
      updatedAt: transactions.updatedAt,
    })
    .from(transactions)
    .innerJoin(imports, eq(transactions.importId, imports.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.id, id))
    .limit(1);

  if (!row) {
    return { ok: false, error: 'Transaction not found.' };
  }

  const categoryColor =
    row.categoryColor && isCategoryColorToken(row.categoryColor)
      ? row.categoryColor
      : row.categoryId
        ? getDefaultCategoryColor(row.categoryId)
        : null;

  return {
    ok: true,
    data: {
      id: row.id,
      date: row.date.toISOString(),
      description: row.description,
      value: row.value,
      balance: row.balance,
      merchant: row.merchant,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      categoryColor,
      categoryIcon: row.categoryIcon
        ? resolveCategoryIcon(row.categoryIcon)
        : null,
      importId: row.importId,
      importFilename: row.importFilename,
      importStatus: row.importStatus,
      importImportedAt: row.importImportedAt.toISOString(),
      insertedAt: toIsoString(row.insertedAt),
      updatedAt: toIsoString(row.updatedAt),
    },
  };
}
