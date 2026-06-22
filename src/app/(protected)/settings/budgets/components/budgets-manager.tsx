'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import {
  createBudget,
  deleteBudget,
  updateBudget,
} from '@/app/(protected)/settings/budgets/actions/budget-actions';
import { BudgetFormSheet } from '@/app/(protected)/settings/budgets/components/budget-form-sheet';
import { BudgetsTable } from '@/app/(protected)/settings/budgets/components/budgets-table';
import { PrimaryOverflowActions } from '@/app/(protected)/components/primary-overflow-actions';
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
import type { CategoryRow } from '@/lib/categories/get-categories';
import type { BudgetRow } from '@/lib/budgets/get-budgets';

type BudgetsManagerProps = {
  budgets: BudgetRow[];
  categories: CategoryRow[];
};

export function BudgetsManager({ budgets, categories }: BudgetsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const usedCategoryIds = useMemo(
    () => budgets.map((budget) => budget.categoryId),
    [budgets],
  );

  function openCreateSheet() {
    setEditingBudget(null);
    setSheetOpen(true);
  }

  function openEditSheet(budget: BudgetRow) {
    setEditingBudget(budget);
    setSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);

    if (!open) {
      setEditingBudget(null);
    }
  }

  function runDelete() {
    if (!deleteTarget) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      const result = await deleteBudget(deleteTarget.id);

      if (!result.ok) {
        setActionError(result.error);
        return;
      }

      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <>
      <SetPageHeader
        description="Monthly spending limits by category."
        actions={
          <PrimaryOverflowActions
            primaryLabel="Add budget"
            onPrimaryClick={openCreateSheet}
            primaryDisabled={isPending}
            overflowActions={[]}
          />
        }
      />
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        {actionError ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}
        <BudgetsTable
          budgets={budgets}
          onEdit={openEditSheet}
          onDelete={setDeleteTarget}
          isPending={isPending}
        />
      </div>

      <BudgetFormSheet
        key={editingBudget?.id ?? 'new'}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        budget={editingBudget}
        categories={categories}
        usedCategoryIds={usedCategoryIds}
        onSubmit={async (input) => {
          if (editingBudget) {
            return updateBudget(editingBudget.id, input);
          }

          return createBudget(input);
        }}
      />

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
            <AlertDialogTitle>Delete budget?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Remove the monthly budget for ${deleteTarget.categoryName}.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={runDelete} disabled={isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
