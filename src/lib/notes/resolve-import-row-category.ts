import type { ParsedImportRow } from '@/app/(protected)/dashboard/actions/import-file';

export type ResolvedImportRowCategory = {
  categoryId: string | null;
  archiveNoteId: string | null;
};

export function resolveImportRowCategory(
  clientRow: ParsedImportRow,
  serverRow: ParsedImportRow,
): ResolvedImportRowCategory {
  const clientNote = clientRow.noteMatch;
  const serverNote = serverRow.noteMatch;

  if (!clientNote) {
    return {
      categoryId: clientRow.categoryId,
      archiveNoteId: null,
    };
  }

  if (
    clientNote.confirmed &&
    serverNote &&
    clientNote.noteId === serverNote.noteId
  ) {
    return {
      categoryId: serverRow.categoryId,
      archiveNoteId: serverNote.noteId,
    };
  }

  if (
    !clientNote.confirmed &&
    serverNote &&
    clientRow.categoryId === serverRow.categoryId
  ) {
    return {
      categoryId: null,
      archiveNoteId: null,
    };
  }

  return {
    categoryId: clientRow.categoryId,
    archiveNoteId: null,
  };
}

export function countUnconfirmedNoteMatches(rows: ParsedImportRow[]): number {
  return rows.filter(
    (row) => row.noteMatch !== null && !row.noteMatch.confirmed,
  ).length;
}
