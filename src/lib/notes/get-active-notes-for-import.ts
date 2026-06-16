import { and, asc, eq, isNull } from 'drizzle-orm';

import { db } from '@/db';
import { categories, notes } from '@/db/schema';
import type { MerchantSlug } from '@/lib/merchants';

import type { NoteForImportMatch } from './types';

export async function getActiveNotesForImport(
  merchant: MerchantSlug,
): Promise<NoteForImportMatch[]> {
  return db
    .select({
      id: notes.id,
      merchant: notes.merchant,
      date: notes.date,
      value: notes.value,
      categoryId: notes.categoryId,
      context: notes.context,
    })
    .from(notes)
    .where(and(eq(notes.merchant, merchant), isNull(notes.archivedAt)))
    .orderBy(asc(notes.createdAt));
}

export async function getNoteCategoryTypesById(): Promise<
  Map<string, 'spending' | 'income'>
> {
  const rows = await db
    .select({
      id: categories.id,
      type: categories.type,
    })
    .from(categories);

  const map = new Map<string, 'spending' | 'income'>();

  for (const row of rows) {
    if (row.type === 'spending' || row.type === 'income') {
      map.set(row.id, row.type);
    }
  }

  return map;
}
