import { describe, expect, it } from 'vitest';

import { parseLocalizedNumber } from '@/lib/file-import/parse-localized-number';

describe('parseLocalizedNumber', () => {
  it('parses double-minus amounts', () => {
    expect(parseLocalizedNumber('--25.34 €')).toBe(-25.34);
  });

  it('parses dot decimal amounts with currency', () => {
    expect(parseLocalizedNumber('4.10 €')).toBe(4.1);
  });

  it('parses EU comma decimal amounts', () => {
    expect(parseLocalizedNumber('1.234,56 €')).toBe(1234.56);
  });

  it('parses parenthesized negatives', () => {
    expect(parseLocalizedNumber('(12,50)')).toBe(-12.5);
  });
});
