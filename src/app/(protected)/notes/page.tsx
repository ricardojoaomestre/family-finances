import { NotesManager } from '@/app/(protected)/notes/components/notes-manager';
import {
  getActiveNotes,
  getArchivedNotes,
  getNoteEligibleCategories,
} from '@/lib/notes/get-notes';

export default async function NotesPage() {
  const [activeNotes, archivedNotes, categories] = await Promise.all([
    getActiveNotes(),
    getArchivedNotes(),
    getNoteEligibleCategories(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <NotesManager
      activeNotes={activeNotes}
      archivedNotes={archivedNotes}
      categories={categories}
      />
    </div>
  );
}
