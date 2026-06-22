import { describe, expect, it } from 'vitest';

import { applyNoteMatchesToImportRows } from '@/lib/notes/apply-note-matches-to-import-rows';
import type { NoteForImportMatch } from '@/lib/notes/types';

describe('applyNoteMatchesToImportRows', () => {
  const note: NoteForImportMatch = {
    id: 'note-1',
    bankAccountId: 'account-bpi',
    date: new Date('2025-06-05T00:00:00.000Z'),
    value: '-50.00',
    categoryId: 'cat-1',
    context: 'ATM cash',
  };

  it('matches the first uncategorized row only', () => {
    const rows = [
      {
        date: '2025-06-05',
        description: 'LEV ATM',
        value: -50,
        categoryId: null,
      },
      {
        date: '2025-06-05',
        description: 'LEV ATM',
        value: -50,
        categoryId: null,
      },
    ];

    const result = applyNoteMatchesToImportRows(
      rows,
      'account-bpi',
      [note],
      new Set(['cat-1']),
    );

    expect(result[0]?.categoryId).toBe('cat-1');
    expect(result[0]?.noteMatch).toEqual({
      noteId: 'note-1',
      context: 'ATM cash',
      confirmed: false,
    });
    expect(result[1]?.categoryId).toBeNull();
    expect(result[1]?.noteMatch).toBeNull();
  });

  it('skips rows already categorized by regex', () => {
    const rows = [
      {
        date: '2025-06-05',
        description: 'LEV ATM',
        value: -50,
        categoryId: 'regex-cat',
      },
    ];

    const result = applyNoteMatchesToImportRows(
      rows,
      'account-bpi',
      [note],
      new Set(['cat-1', 'regex-cat']),
    );

    expect(result[0]?.noteMatch).toBeNull();
    expect(result[0]?.categoryId).toBe('regex-cat');
  });

  it('skips notes with inactive categories', () => {
    const rows = [
      {
        date: '2025-06-05',
        description: 'LEV ATM',
        value: -50,
        categoryId: null,
      },
    ];

    const result = applyNoteMatchesToImportRows(
      rows,
      'account-bpi',
      [note],
      new Set(),
    );

    expect(result[0]?.categoryId).toBeNull();
    expect(result[0]?.noteMatch).toBeNull();
  });
});
