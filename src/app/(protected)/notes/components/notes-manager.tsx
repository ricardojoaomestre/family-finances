'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  archiveNote,
  createNote,
  deleteArchivedNote,
  unarchiveNote,
  updateNote,
} from '@/app/(protected)/notes/actions/note-actions';
import { NoteFormSheet } from '@/app/(protected)/notes/components/note-form-sheet';
import { NotesTable } from '@/app/(protected)/notes/components/notes-table';
import { SetPageHeader } from '@/app/(protected)/components/protected-page-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { NoteCategoryOption } from '@/lib/notes/types';
import type { NoteRow } from '@/lib/notes/types';

type NotesManagerProps = {
  activeNotes: NoteRow[];
  archivedNotes: NoteRow[];
  categories: NoteCategoryOption[];
};

export function NotesManager({
  activeNotes,
  archivedNotes,
  categories,
}: NotesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<NoteRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NoteRow | null>(null);

  function refreshPage() {
    router.refresh();
  }

  function handleCreateClick() {
    setEditingNote(null);
    setSheetOpen(true);
  }

  function handleEdit(note: NoteRow) {
    setEditingNote(note);
    setSheetOpen(true);
  }

  function handleArchiveConfirm() {
    if (!archiveTarget) {
      return;
    }

    const note = archiveTarget;
    setArchiveTarget(null);
    setActionError(null);

    startTransition(async () => {
      const result = await archiveNote(note.id);

      if (!result.ok) {
        setActionError(result.error);
        return;
      }

      refreshPage();
    });
  }

  function handleUnarchive(note: NoteRow) {
    setActionError(null);

    startTransition(async () => {
      const result = await unarchiveNote(note.id);

      if (!result.ok) {
        setActionError(result.error);
        return;
      }

      refreshPage();
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    const note = deleteTarget;
    setDeleteTarget(null);
    setActionError(null);

    startTransition(async () => {
      const result = await deleteArchivedNote(note.id);

      if (!result.ok) {
        setActionError(result.error);
        return;
      }

      refreshPage();
    });
  }

  return (
    <>
      <SetPageHeader
        actions={
          <Button type="button" onClick={handleCreateClick}>
            Create note
          </Button>
        }
      />

      {actionError ? (
        <Alert variant="destructive">
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeNotes.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({archivedNotes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <NotesTable
            notes={activeNotes}
            archived={false}
            disabled={isPending}
            onEdit={handleEdit}
            onArchive={setArchiveTarget}
          />
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          <NotesTable
            notes={archivedNotes}
            archived
            disabled={isPending}
            onUnarchive={handleUnarchive}
            onDelete={setDeleteTarget}
          />
        </TabsContent>
      </Tabs>

      <NoteFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        note={editingNote}
        categories={categories}
        onSubmit={async (input) => {
          const result = editingNote
            ? await updateNote(input)
            : await createNote(input);

          if (result.ok) {
            refreshPage();
          }

          return result;
        }}
      />

      <AlertDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setArchiveTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive note?</AlertDialogTitle>
            <AlertDialogDescription>
              This note will no longer match future imports until you unarchive
              it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveConfirm}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete archived note?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the archived note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
