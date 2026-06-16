import { describe, expect, it } from 'vitest';

import {
  formatPositiveAmountForNoteForm,
  normalizeNoteValueFromPositiveAmount,
} from '@/lib/notes/normalize-note-value';

describe('normalizeNoteValueFromPositiveAmount', () => {
  it('stores spending notes as negative values', () => {
    expect(normalizeNoteValueFromPositiveAmount(50, 'spending')).toBe(-50);
  });

  it('stores income notes as positive values', () => {
    expect(normalizeNoteValueFromPositiveAmount(50, 'income')).toBe(50);
  });
});

describe('formatPositiveAmountForNoteForm', () => {
  it('shows absolute values in the form', () => {
    expect(formatPositiveAmountForNoteForm('-50')).toBe('50.00');
  });
});
