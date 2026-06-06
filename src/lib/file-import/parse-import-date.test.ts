import { describe, expect, it } from 'vitest';

import { parseImportDate } from '@/lib/file-import/parse-import-date';

describe('parseImportDate', () => {
  it('parses DMY strings', () => {
    expect(parseImportDate('05/06/2025', 'DMY')).toBe(
      new Date(Date.UTC(2025, 5, 5)).toISOString(),
    );
    expect(parseImportDate('05-06-2025', 'DMY')).toBe(
      new Date(Date.UTC(2025, 5, 5)).toISOString(),
    );
  });

  it('parses YMD strings', () => {
    expect(parseImportDate('2025-06-05', 'YMD')).toBe(
      new Date(Date.UTC(2025, 5, 5)).toISOString(),
    );
  });

  it('accepts Date objects', () => {
    const date = new Date(Date.UTC(2025, 5, 5));
    expect(parseImportDate(date, 'DMY')).toBe(date.toISOString());
  });

  it('returns null for invalid values', () => {
    expect(parseImportDate('', 'DMY')).toBeNull();
    expect(parseImportDate('not-a-date', 'DMY')).toBeNull();
    expect(parseImportDate('32/13/2025', 'DMY')).toBeNull();
  });
});
