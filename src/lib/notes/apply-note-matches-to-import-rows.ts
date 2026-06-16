import type { ImportedSpreadsheetRow } from '@/lib/file-import/types';
import { buildDuplicateKey } from '@/lib/file-import/duplicate-key';

import type { NoteForImportMatch, RowNoteMatch } from './types';

export function applyNoteMatchesToImportRows<
  T extends ImportedSpreadsheetRow,
>(
  rows: T[],
  merchant: string,
  notes: NoteForImportMatch[],
  activeCategoryIds: Set<string>,
): Array<T & { noteMatch: RowNoteMatch | null }> {
  const noteByKey = new Map<string, NoteForImportMatch>();

  for (const note of notes) {
    if (!activeCategoryIds.has(note.categoryId)) {
      continue;
    }

    const key = buildDuplicateKey(
      note.date,
      Number(note.value),
      note.merchant,
    );
    noteByKey.set(key, note);
  }

  const usedKeys = new Set<string>();

  return rows.map((row) => {
    if (row.categoryId !== null) {
      return { ...row, noteMatch: null };
    }

    if (row.date === null || row.value === null || !Number.isFinite(row.value)) {
      return { ...row, noteMatch: null };
    }

    const key = buildDuplicateKey(row.date, row.value, merchant);

    if (usedKeys.has(key)) {
      return { ...row, noteMatch: null };
    }

    const note = noteByKey.get(key);

    if (!note) {
      return { ...row, noteMatch: null };
    }

    usedKeys.add(key);

    return {
      ...row,
      categoryId: note.categoryId,
      noteMatch: {
        noteId: note.id,
        context: note.context,
        confirmed: false,
      },
    };
  });
}
