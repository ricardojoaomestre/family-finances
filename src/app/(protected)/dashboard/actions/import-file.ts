'use server';

import {
  detectDuplicateStatuses,
  parseBankSpreadsheet,
  validateSpreadsheetFile,
  type ImportedSpreadsheetRow,
  type RowDuplicateStatus,
} from '@/lib/file-import';
import {
  getActiveCategoriesForImport,
  type ImportCategoryOption,
} from '@/lib/categories/get-active-categories-for-import';
import {
  compileCategoryRules,
  matchCategoryIdWithCompiledRules,
} from '@/lib/categories/match-category';
import { getExistingDuplicateKeys } from '@/lib/file-import/get-existing-duplicate-keys';
import { applyNoteMatchesToImportRows } from '@/lib/notes/apply-note-matches-to-import-rows';
import { getActiveNotesForImport } from '@/lib/notes/get-active-notes-for-import';
import type { RowNoteMatch } from '@/lib/notes/types';
import { isMerchantSlug, type MerchantSlug } from '@/lib/merchants';

export type ParsedImportRow = ImportedSpreadsheetRow & {
  duplicate: RowDuplicateStatus;
  noteMatch: RowNoteMatch | null;
};

export type ImportSpreadsheetResult =
  | {
      ok: true;
      data: ParsedImportRow[];
      categories: ImportCategoryOption[];
      usingGenericProfile: boolean;
    }
  | { ok: false; error: string };

export async function importSpreadsheetFile(
  formData: FormData,
): Promise<ImportSpreadsheetResult> {
  const file = formData.get('file');
  const merchantValue = formData.get('merchant');

  if (!(file instanceof File)) {
    return { ok: false as const, error: 'No file provided.' };
  }

  if (typeof merchantValue !== 'string' || !isMerchantSlug(merchantValue)) {
    return { ok: false as const, error: 'A valid merchant is required.' };
  }

  const merchant = merchantValue;

  const validation = validateSpreadsheetFile(file);

  if (!validation.ok) {
    return { ok: false as const, error: validation.error };
  }

  const buffer = await file.arrayBuffer();
  const parsed = parseBankSpreadsheet(
    buffer,
    file.name,
    validation.fileType,
    merchant,
  );

  if (!parsed.ok) {
    return { ok: false as const, error: parsed.error };
  }

  const data: ImportedSpreadsheetRow[] = parsed.rows.map((row) => ({
    ...row,
    description: row.description.trim(),
  }));

  const existingKeys = await getExistingDuplicateKeys(merchant);
  const duplicateStatuses = detectDuplicateStatuses(data, existingKeys, merchant);

  const rowsWithDuplicates: ParsedImportRow[] = data.map((row, index) => ({
    ...row,
    duplicate: duplicateStatuses[index]!,
    noteMatch: null,
  }));

  const matched = await matchImportRowsToCategories(rowsWithDuplicates, merchant);

  return {
    ok: true as const,
    ...matched,
    usingGenericProfile: parsed.usingGenericProfile,
  };
}

export type RematchImportCategoriesResult = {
  data: ParsedImportRow[];
  categories: ImportCategoryOption[];
};

export async function rematchImportCategories(
  rows: ParsedImportRow[],
  merchant: MerchantSlug,
): Promise<RematchImportCategoriesResult> {
  return matchImportRowsToCategories(rows, merchant);
}

async function matchImportRowsToCategories(
  rows: ParsedImportRow[],
  merchant: MerchantSlug,
): Promise<RematchImportCategoriesResult> {
  const [categoryRules, activeNotes] = await Promise.all([
    getActiveCategoriesForImport(),
    getActiveNotesForImport(merchant),
  ]);
  const categories: ImportCategoryOption[] = categoryRules.map(
    ({ id, name, color, icon }) => ({ id, name, color, icon }),
  );
  const activeCategoryIds = new Set(categoryRules.map((category) => category.id));

  const compiledRules = compileCategoryRules(categoryRules);
  const regexMatched = rows.map((row) => ({
    ...row,
    categoryId: matchCategoryIdWithCompiledRules(
      row.description.trim(),
      compiledRules,
    ),
    noteMatch: null as RowNoteMatch | null,
  }));

  const data = applyNoteMatchesToImportRows(
    regexMatched,
    merchant,
    activeNotes,
    activeCategoryIds,
  );

  return { data, categories };
}
