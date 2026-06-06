export function normalizeCategoryImportPattern(raw: string): string {
  return raw.trim().replace(/\(\?i\)/gi, '').trim();
}

export function patternKeyForImport(pattern: string | null): string {
  if (pattern === null || pattern === '') {
    return '';
  }

  return normalizeCategoryImportPattern(pattern);
}
