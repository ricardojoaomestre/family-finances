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
import { getBankAccountForActiveHousehold } from '@/lib/bank-accounts/get-bank-account';
import { getExistingDuplicateKeys } from '@/lib/file-import/get-existing-duplicate-keys';
import { applyNoteMatchesToImportRows } from '@/lib/notes/apply-note-matches-to-import-rows';
import { getActiveNotesForImport } from '@/lib/notes/get-active-notes-for-import';
import type { RowNoteMatch } from '@/lib/notes/types';

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
  const bankAccountIdValue = formData.get('bankAccountId');

  if (!(file instanceof File)) {
    return { ok: false as const, error: 'No file provided.' };
  }

  if (
    typeof bankAccountIdValue !== 'string' ||
    !bankAccountIdValue.trim()
  ) {
    return { ok: false as const, error: 'A valid bank account is required.' };
  }

  const bankAccount = await getBankAccountForActiveHousehold(
    bankAccountIdValue.trim(),
  );

  if (!bankAccount) {
    return { ok: false as const, error: 'Bank account not found.' };
  }

  const validation = validateSpreadsheetFile(file);

  if (!validation.ok) {
    return { ok: false as const, error: validation.error };
  }

  const buffer = await file.arrayBuffer();
  const parsed = parseBankSpreadsheet(
    buffer,
    file.name,
    validation.fileType,
    bankAccount.importProfile,
  );

  if (!parsed.ok) {
    return { ok: false as const, error: parsed.error };
  }

  const data: ImportedSpreadsheetRow[] = parsed.rows.map((row) => ({
    ...row,
    description: row.description.trim(),
  }));

  const existingKeys = await getExistingDuplicateKeys(bankAccount.id);
  const duplicateStatuses = detectDuplicateStatuses(
    data,
    existingKeys,
    bankAccount.id,
  );

  const rowsWithDuplicates: ParsedImportRow[] = data.map((row, index) => ({
    ...row,
    duplicate: duplicateStatuses[index]!,
    noteMatch: null,
  }));

  const matched = await matchImportRowsToCategories(
    rowsWithDuplicates,
    bankAccount.id,
  );

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
  bankAccountId: string,
): Promise<RematchImportCategoriesResult> {
  return matchImportRowsToCategories(rows, bankAccountId);
}

async function matchImportRowsToCategories(
  rows: ParsedImportRow[],
  bankAccountId: string,
): Promise<RematchImportCategoriesResult> {
  const [categoryRules, activeNotes] = await Promise.all([
    getActiveCategoriesForImport(),
    getActiveNotesForImport(bankAccountId),
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
    bankAccountId,
    activeNotes,
    activeCategoryIds,
  );

  return { data, categories };
}
