import { NotesManager } from '@/app/(protected)/notes/components/notes-manager';
import { getBankAccounts } from '@/lib/bank-accounts/get-bank-accounts';
import {
  getActiveNotes,
  getArchivedNotes,
  getNoteEligibleCategories,
} from '@/lib/notes/get-notes';

export default async function NotesPage() {
  const [activeNotes, archivedNotes, categories, bankAccounts] = await Promise.all([
    getActiveNotes(),
    getArchivedNotes(),
    getNoteEligibleCategories(),
    getBankAccounts(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <NotesManager
      activeNotes={activeNotes}
      archivedNotes={archivedNotes}
      categories={categories}
      bankAccounts={bankAccounts.map((account) => ({
        id: account.id,
        label: account.label,
      }))}
      />
    </div>
  );
}
