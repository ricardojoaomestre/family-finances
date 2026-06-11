"use server";

import {
  detectDuplicateStatuses,
  parseBankSpreadsheet,
  validateSpreadsheetFile,
  type ImportedSpreadsheetRow,
  type RowDuplicateStatus,
} from "@/lib/file-import";
import {
  getActiveCategoriesForImport,
  type ImportCategoryOption,
} from "@/lib/categories/get-active-categories-for-import";
import { matchCategoryId } from "@/lib/categories/match-category";
import { getExistingDuplicateKeys } from "@/lib/file-import/get-existing-duplicate-keys";
import { isMerchantSlug } from "@/lib/merchants";

export type ParsedImportRow = ImportedSpreadsheetRow & {
  duplicate: RowDuplicateStatus;
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
  const file = formData.get("file");
  const merchantValue = formData.get("merchant");

  if (!(file instanceof File)) {
    return { ok: false as const, error: "No file provided." };
  }

  if (typeof merchantValue !== "string" || !isMerchantSlug(merchantValue)) {
    return { ok: false as const, error: "A valid merchant is required." };
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
  }));

  const matched = await matchImportRowsToCategories(rowsWithDuplicates);

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
): Promise<RematchImportCategoriesResult> {
  return matchImportRowsToCategories(rows);
}

async function matchImportRowsToCategories(
  rows: ParsedImportRow[],
): Promise<RematchImportCategoriesResult> {
  const categoryRules = await getActiveCategoriesForImport();
  const categories: ImportCategoryOption[] = categoryRules.map(
    ({ id, name, color, icon }) => ({ id, name, color, icon }),
  );

  const data = rows.map((row) => ({
    ...row,
    categoryId: matchCategoryId(row.description.trim(), categoryRules),
  }));

  return { data, categories };
}
