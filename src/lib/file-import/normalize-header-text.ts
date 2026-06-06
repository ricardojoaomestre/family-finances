export function normalizeHeaderText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

export function cellToHeaderText(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

export function matchesHeaderAlias(cell: unknown, aliases: string[]): boolean {
  const text = cellToHeaderText(cell);
  if (!text) return false;

  const normalized = normalizeHeaderText(text);
  return aliases.some((alias) => normalizeHeaderText(alias) === normalized);
}
