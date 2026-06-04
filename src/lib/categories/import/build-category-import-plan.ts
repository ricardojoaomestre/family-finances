import {
  validateCategoryName,
  validateCategoryPattern,
} from '@/lib/categories/validate-category';

import { categoryNameKey } from './category-name-key';
import {
  normalizeCategoryImportPattern,
  patternKeyForImport,
} from './normalize-pattern';
import {
  resolveImportActive,
  resolveImportColor,
  resolveImportType,
} from './resolve-category-import-fields';
import type {
  CategoryCsvOptionalColumns,
  CategoryImportApplyRow,
  CategoryImportCsvRow,
  CategoryImportPlanResult,
  CategoryImportPreviewRow,
} from './types';

export type CategoryForImportMatch = {
  id: string;
  name: string;
  pattern: string | null;
  priority: number;
  active: boolean;
};

function resolvePatternValue(regex: string): string | null {
  const normalized = normalizeCategoryImportPattern(regex);
  return normalized === '' ? null : normalized;
}

function findByName(
  existing: CategoryForImportMatch[],
  nameKey: string,
): CategoryForImportMatch | undefined {
  return existing.find((row) => categoryNameKey(row.name) === nameKey);
}

function findFirstByPattern(
  existing: CategoryForImportMatch[],
  patternKey: string,
): CategoryForImportMatch | undefined {
  const sorted = [...existing].sort((a, b) => a.priority - b.priority);

  return sorted.find(
    (row) => patternKeyForImport(row.pattern) === patternKey,
  );
}

function formatOptionalPreviewValue(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? '—' : trimmed;
}

export function buildCategoryImportPlan(
  existing: CategoryForImportMatch[],
  csvRows: CategoryImportCsvRow[],
  columns: CategoryCsvOptionalColumns,
): CategoryImportPlanResult {
  const seenNameKeys = new Set<string>();
  const seenPatternKeys = new Set<string>();
  const previewRows: CategoryImportPreviewRow[] = [];
  const rowsToApply: CategoryImportApplyRow[] = [];
  let skippedDuplicateCount = 0;

  for (const csvRow of csvRows) {
    const csvName = csvRow.name.trim();
    const nameError = validateCategoryName(csvName);

    if (nameError) {
      continue;
    }

    const normalizedPattern = resolvePatternValue(csvRow.regex);
    const patternError =
      normalizedPattern === null
        ? null
        : validateCategoryPattern(normalizedPattern);

    if (patternError) {
      continue;
    }

    const nameKey = categoryNameKey(csvName);
    const patternKey = patternKeyForImport(normalizedPattern);

    if (seenNameKeys.has(nameKey) || seenPatternKeys.has(patternKey)) {
      skippedDuplicateCount += 1;
      continue;
    }

    seenNameKeys.add(nameKey);
    seenPatternKeys.add(patternKey);

    const importType = resolveImportType(csvRow.type, columns.type);
    const importActive = resolveImportActive(csvRow.active, columns.active);
    const importColor = resolveImportColor(csvRow.color, columns.color);

    const nameMatch = findByName(existing, nameKey);
    const patternMatch =
      nameMatch === undefined
        ? findFirstByPattern(existing, patternKey)
        : undefined;

    const target = nameMatch ?? patternMatch;

    if (target) {
      previewRows.push({
        csvName,
        normalizedPattern,
        action: 'update',
        ...(columns.type
          ? { csvType: formatOptionalPreviewValue(csvRow.type) }
          : {}),
        ...(columns.active
          ? { csvActive: formatOptionalPreviewValue(csvRow.active) }
          : {}),
        ...(columns.color
          ? { csvColor: formatOptionalPreviewValue(csvRow.color) }
          : {}),
      });
      rowsToApply.push({
        csvName,
        normalizedPattern,
        action: 'update',
        targetCategoryId: target.id,
        wasInactive: !target.active,
        ...(importType !== undefined ? { type: importType } : {}),
        ...(importActive !== undefined ? { active: importActive } : {}),
        ...(importColor !== undefined ? { color: importColor } : {}),
      });
      continue;
    }

    previewRows.push({
      csvName,
      normalizedPattern,
      action: 'create',
      ...(columns.type
        ? { csvType: formatOptionalPreviewValue(csvRow.type) }
        : {}),
      ...(columns.active
        ? { csvActive: formatOptionalPreviewValue(csvRow.active) }
        : {}),
      ...(columns.color
        ? { csvColor: formatOptionalPreviewValue(csvRow.color) }
        : {}),
    });
    rowsToApply.push({
      csvName,
      normalizedPattern,
      action: 'create',
      ...(importType !== undefined ? { type: importType } : {}),
      ...(importActive !== undefined ? { active: importActive } : {}),
      ...(importColor !== undefined ? { color: importColor } : {}),
    });
  }

  if (previewRows.length === 0) {
    return {
      ok: false,
      error: 'No valid rows to import. Check the file format and content.',
    };
  }

  return {
    ok: true,
    rows: previewRows,
    skippedDuplicateCount,
    rowsToApply,
    columns,
  };
}
