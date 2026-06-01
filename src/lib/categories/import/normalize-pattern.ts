export function normalizeCategoryImportPattern(raw: string): string {
  return raw
    .trim()
    .replace(/\(\?i\)/gi, '')
    .replace(/\\b/g, '')
    .trim();
}

export function patternKeyForImport(pattern: string | null): string {
  if (pattern === null || pattern === '') {
    return '';
  }

  return normalizeCategoryImportPattern(pattern);
}
