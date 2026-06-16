import type { NoteRow } from '@/lib/notes/types';

export function noteHasInactiveCategoryWarning(note: NoteRow): boolean {
  return !note.categoryActive;
}
