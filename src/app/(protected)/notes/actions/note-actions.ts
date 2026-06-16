'use server';

import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { db } from '@/db';
import { categories, notes } from '@/db/schema';
import { formatDbError } from '@/lib/db/format-db-error';
import { formatTransactionValueForKey } from '@/lib/file-import/duplicate-key';
import { getNoteById } from '@/lib/notes/get-notes';
import { isNoteEligibleCategoryType } from '@/lib/notes/normalize-note-value';
import {
  parseValidatedNoteForm,
  validateNoteForm,
} from '@/lib/notes/validate-note-form';
import type { NoteFormField, NoteFormInput } from '@/lib/notes/types';
import { resolveCategoryType } from '@/lib/categories/category-type';

type ActionResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      fieldErrors?: Partial<Record<NoteFormField, string>>;
    };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function revalidateNotePaths() {
  revalidatePath('/notes');
  revalidatePath('/imports');
}

async function getCategoryTypeForNote(
  categoryId: string,
): Promise<'spending' | 'income' | null> {
  const rows = await db
    .select({ type: categories.type, active: categories.active })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  const row = rows[0];

  if (!row?.active) {
    return null;
  }

  const type = resolveCategoryType(row.type);

  return isNoteEligibleCategoryType(type) ? type : null;
}

async function hasActiveNoteKeyConflict(
  merchant: string,
  date: Date,
  value: number,
  excludeNoteId?: string,
): Promise<boolean> {
  const formattedValue = formatTransactionValueForKey(value);
  const conditions = [
    eq(notes.merchant, merchant),
    eq(notes.date, date),
    eq(notes.value, formattedValue),
    isNull(notes.archivedAt),
  ];

  const rows = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(...conditions))
    .limit(1);

  const existing = rows[0];

  if (!existing) {
    return false;
  }

  return existing.id !== excludeNoteId;
}

function duplicateActiveNoteError(): ActionResult {
  return {
    ok: false,
    error: 'An active note already exists for this merchant, date, and amount.',
    fieldErrors: {
      amount: 'Another active note uses this merchant, date, and amount.',
    },
  };
}

export async function createNote(input: NoteFormInput): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in to create notes.' };
  }

  const categoryType = await getCategoryTypeForNote(input.categoryId);
  const fieldErrors = validateNoteForm(input, { categoryType });

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: 'Fix the highlighted fields.', fieldErrors };
  }

  if (!categoryType) {
    return {
      ok: false,
      error: 'Select an active spending or income category.',
      fieldErrors: { categoryId: 'Select an active spending or income category.' },
    };
  }

  const parsed = parseValidatedNoteForm(input, categoryType);

  if (!parsed) {
    return { ok: false, error: 'Could not save note.' };
  }

  if (
    await hasActiveNoteKeyConflict(
      parsed.merchant,
      parsed.date,
      parsed.value,
    )
  ) {
    return duplicateActiveNoteError();
  }

  try {
    await db.insert(notes).values({
      merchant: parsed.merchant,
      date: parsed.date,
      value: formatTransactionValueForKey(parsed.value),
      categoryId: parsed.categoryId,
      context: parsed.context,
    });
  } catch (error) {
    console.error('[createNote]', error);
    return {
      ok: false,
      error: formatDbError(error, 'Could not create note'),
    };
  }

  revalidateNotePaths();
  return { ok: true };
}

export async function updateNote(input: NoteFormInput): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in to update notes.' };
  }

  const noteId = input.id?.trim();

  if (!noteId || !isUuid(noteId)) {
    return { ok: false, error: 'Note not found.' };
  }

  const existing = await getNoteById(noteId);

  if (!existing || existing.archivedAt) {
    return { ok: false, error: 'Only active notes can be edited.' };
  }

  const categoryType = await getCategoryTypeForNote(input.categoryId);
  const fieldErrors = validateNoteForm(input, { categoryType });

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: 'Fix the highlighted fields.', fieldErrors };
  }

  if (!categoryType) {
    return {
      ok: false,
      error: 'Select an active spending or income category.',
      fieldErrors: { categoryId: 'Select an active spending or income category.' },
    };
  }

  const parsed = parseValidatedNoteForm(input, categoryType);

  if (!parsed) {
    return { ok: false, error: 'Could not save note.' };
  }

  if (
    await hasActiveNoteKeyConflict(
      parsed.merchant,
      parsed.date,
      parsed.value,
      noteId,
    )
  ) {
    return duplicateActiveNoteError();
  }

  try {
    await db
      .update(notes)
      .set({
        merchant: parsed.merchant,
        date: parsed.date,
        value: formatTransactionValueForKey(parsed.value),
        categoryId: parsed.categoryId,
        context: parsed.context,
        updatedAt: new Date(),
      })
      .where(and(eq(notes.id, noteId), isNull(notes.archivedAt)));
  } catch (error) {
    console.error('[updateNote]', error);
    return {
      ok: false,
      error: formatDbError(error, 'Could not update note'),
    };
  }

  revalidateNotePaths();
  return { ok: true };
}

export async function archiveNote(noteId: string): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in to archive notes.' };
  }

  if (!isUuid(noteId)) {
    return { ok: false, error: 'Note not found.' };
  }

  const now = new Date();

  try {
    const updated = await db
      .update(notes)
      .set({ archivedAt: now, updatedAt: now })
      .where(and(eq(notes.id, noteId), isNull(notes.archivedAt)))
      .returning({ id: notes.id });

    if (updated.length === 0) {
      return { ok: false, error: 'Note not found or already archived.' };
    }
  } catch (error) {
    console.error('[archiveNote]', error);
    return {
      ok: false,
      error: formatDbError(error, 'Could not archive note'),
    };
  }

  revalidateNotePaths();
  return { ok: true };
}

export async function unarchiveNote(noteId: string): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in to unarchive notes.' };
  }

  if (!isUuid(noteId)) {
    return { ok: false, error: 'Note not found.' };
  }

  const existing = await getNoteById(noteId);

  if (!existing || !existing.archivedAt) {
    return { ok: false, error: 'Only archived notes can be unarchived.' };
  }

  if (
    await hasActiveNoteKeyConflict(
      existing.merchant,
      existing.date,
      Number(existing.value),
    )
  ) {
    return duplicateActiveNoteError();
  }

  try {
    await db
      .update(notes)
      .set({ archivedAt: null, updatedAt: new Date() })
      .where(eq(notes.id, noteId));
  } catch (error) {
    console.error('[unarchiveNote]', error);
    return {
      ok: false,
      error: formatDbError(error, 'Could not unarchive note'),
    };
  }

  revalidateNotePaths();
  return { ok: true };
}

export async function deleteArchivedNote(noteId: string): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in to delete notes.' };
  }

  if (!isUuid(noteId)) {
    return { ok: false, error: 'Note not found.' };
  }

  try {
    const deleted = await db
      .delete(notes)
      .where(and(eq(notes.id, noteId), isNotNull(notes.archivedAt)))
      .returning({ id: notes.id });

    if (deleted.length === 0) {
      return { ok: false, error: 'Only archived notes can be deleted.' };
    }
  } catch (error) {
    console.error('[deleteArchivedNote]', error);
    return {
      ok: false,
      error: formatDbError(error, 'Could not delete note'),
    };
  }

  revalidateNotePaths();
  return { ok: true };
}
