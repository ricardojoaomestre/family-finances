'use server';

import type { ParsedImportRow } from '@/app/(protected)/dashboard/actions/import-file';
import {
  getActiveCategoriesForImport,
} from '@/lib/categories/get-active-categories-for-import';
import {
  compileCategoryRules,
  matchCategoryIdWithCompiledRules,
} from '@/lib/categories/match-category';
import { applyNoteMatchesToImportRows } from '@/lib/notes/apply-note-matches-to-import-rows';
import { getActiveNotesForImport } from '@/lib/notes/get-active-notes-for-import';

export async function matchImportRowsForConfirm(
  rows: ParsedImportRow[],
  bankAccountId: string,
): Promise<ParsedImportRow[]> {
  const [categoryRules, activeNotes] = await Promise.all([
    getActiveCategoriesForImport(),
    getActiveNotesForImport(bankAccountId),
  ]);
  const activeCategoryIds = new Set(categoryRules.map((category) => category.id));
  const compiledRules = compileCategoryRules(categoryRules);

  const regexMatched = rows.map((row) => ({
    date: row.date,
    description: row.description,
    value: row.value,
    balance: row.balance,
    categoryId: matchCategoryIdWithCompiledRules(
      row.description.trim(),
      compiledRules,
    ),
    duplicate: row.duplicate,
    noteMatch: null,
  }));

  return applyNoteMatchesToImportRows(
    regexMatched,
    bankAccountId,
    activeNotes,
    activeCategoryIds,
  );
}
