import type { CategoryImportCsvRow, CategoryImportPlanResult } from './types';
import { buildCategoryImportPlan, type CategoryForImportMatch } from './build-category-import-plan';
import { parseSemicolonCsv } from './parse-semicolon-csv';

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

function stripBom(value: string): string {
  return value.replace(/^\uFEFF/, '');
}

export function parseCategoryCsvRows(content: string): CategoryImportCsvRow[] | { error: string } {
  const trimmed = content.trim();

  if (!trimmed) {
    return { error: 'File is empty.' };
  }

  const table = parseSemicolonCsv(trimmed);

  if (table.length === 0) {
    return { error: 'File is empty.' };
  }

  const headerRow = table[0]!.map((cell) => normalizeHeader(stripBom(cell)));

  if (headerRow.length < 2) {
    return {
      error: 'Header row must include name and regex columns separated by semicolons.',
    };
  }

  const nameIndex = headerRow.indexOf('name');
  const regexIndex = headerRow.indexOf('regex');

  if (nameIndex === -1 || regexIndex === -1) {
    return { error: 'Header row must include "name" and "regex" columns.' };
  }

  const rows: CategoryImportCsvRow[] = [];

  for (let rowIndex = 1; rowIndex < table.length; rowIndex += 1) {
    const cells = table[rowIndex]!;

    if (cells.every((cell) => cell.trim() === '')) {
      continue;
    }

    rows.push({
      name: cells[nameIndex] ?? '',
      regex: cells[regexIndex] ?? '',
    });
  }

  if (rows.length === 0) {
    return { error: 'No data rows found.' };
  }

  return rows;
}

export function planCategoryImportFromCsv(
  content: string,
  existing: CategoryForImportMatch[],
): CategoryImportPlanResult | { error: string } {
  const parsed = parseCategoryCsvRows(content);

  if ('error' in parsed) {
    return parsed;
  }

  return buildCategoryImportPlan(existing, parsed);
}
