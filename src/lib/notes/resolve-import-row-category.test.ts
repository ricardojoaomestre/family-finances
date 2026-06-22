import { describe, expect, it } from 'vitest';

import type { ParsedImportRow } from '@/app/(protected)/dashboard/actions/import-file';
import { resolveImportRowCategory } from '@/lib/notes/resolve-import-row-category';

function buildRow(
  overrides: Partial<ParsedImportRow> = {},
): ParsedImportRow {
  return {
    date: '2025-06-05',
    description: 'LEV ATM',
    value: -50,
    categoryId: 'cat-1',
    duplicate: { isDuplicate: false },
    noteMatch: {
      noteId: 'note-1',
      context: 'Cash',
      confirmed: false,
    },
    ...overrides,
  };
}

describe('resolveImportRowCategory', () => {
  it('archives confirmed note matches', () => {
    const clientRow = buildRow({
      noteMatch: {
        noteId: 'note-1',
        context: 'Cash',
        confirmed: true,
      },
    });
    const serverRow = buildRow();

    expect(resolveImportRowCategory(clientRow, serverRow)).toEqual({
      categoryId: 'cat-1',
      archiveNoteId: 'note-1',
    });
  });

  it('strips unconfirmed note categories', () => {
    const clientRow = buildRow();
    const serverRow = buildRow();

    expect(resolveImportRowCategory(clientRow, serverRow)).toEqual({
      categoryId: null,
      archiveNoteId: null,
    });
  });

  it('keeps manual categories when note link was cleared', () => {
    const clientRow = buildRow({
      categoryId: 'manual-cat',
      noteMatch: null,
    });
    const serverRow = buildRow();

    expect(resolveImportRowCategory(clientRow, serverRow)).toEqual({
      categoryId: 'manual-cat',
      archiveNoteId: null,
    });
  });
});
