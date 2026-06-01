import {
  validateCategoryName,
  validateCategoryPattern,
} from '@/lib/categories/validate-category';

import { categoryNameKey } from './category-name-key';
import {
  normalizeCategoryImportPattern,
  patternKeyForImport,
} from './normalize-pattern';
import type {
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

export function buildCategoryImportPlan(
  existing: CategoryForImportMatch[],
  csvRows: CategoryImportCsvRow[],
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
      });
      rowsToApply.push({
        csvName,
        normalizedPattern,
        action: 'update',
        targetCategoryId: target.id,
        wasInactive: !target.active,
      });
      continue;
    }

    previewRows.push({
      csvName,
      normalizedPattern,
      action: 'create',
    });
    rowsToApply.push({
      csvName,
      normalizedPattern,
      action: 'create',
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
  };
}
