'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import {
  createCategory,
  reorderCategories,
  setCategoryActive,
  updateCategory,
  type CategoryFormInput,
} from '@/app/(protected)/settings/categories/actions/category-actions';
import { undoCategoryImport } from '@/app/(protected)/settings/categories/actions/import-categories';
import { CategoryImportDialog } from '@/app/(protected)/settings/categories/components/category-import-dialog';
import { CategoryImportReactivateDialog } from '@/app/(protected)/settings/categories/components/category-import-reactivate-dialog';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import type { CategoryImportSnapshotMeta } from '@/lib/categories/get-category-import-snapshot-meta';
import type { CategoryRow } from '@/lib/categories/get-categories';
import {
  DEFAULT_CATEGORY_TABLE_FILTERS,
  filterCategories,
  hasActiveCategoryTableFilters,
  type CategoryTableFilters,
} from '@/lib/categories/filter-categories';
import { buildCategoriesCsv, type CategoryForImportMatch } from '@/lib/categories/import';
import { downloadTextFile } from '@/lib/download-text-file';

import { CategoryFormSheet } from './category-form-sheet';
import { CategoriesTable } from './categories-table';
import { CategoriesTableFilters } from './categories-table-filters';

type CategoriesManagerProps = {
  categories: CategoryRow[];
  importSnapshot: CategoryImportSnapshotMeta;
};

function formatSnapshotDate(date: Date | null): string {
  if (!date) {
    return 'the last import';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function CategoriesManager({
  categories,
  importSnapshot,
}: CategoriesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(
    null,
  );
  const [orderError, setOrderError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [undoError, setUndoError] = useState<string | null>(null);
  const [undoDialogOpen, setUndoDialogOpen] = useState(false);
  const [showImportNotice, setShowImportNotice] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [reactivateCategories, setReactivateCategories] = useState<
    { id: string; name: string }[]
  >([]);
  const [tableFilters, setTableFilters] = useState<CategoryTableFilters>(
    DEFAULT_CATEGORY_TABLE_FILTERS,
  );
  const filteredCategories = useMemo(
    () => filterCategories(categories, tableFilters),
    [categories, tableFilters],
  );
  const hasActiveFilters = hasActiveCategoryTableFilters(tableFilters);
  const existingForImport = useMemo<CategoryForImportMatch[]>(
    () =>
      categories.map((row) => ({
        id: row.id,
        name: row.name,
        pattern: row.pattern,
        priority: row.priority,
        active: row.active,
      })),
    [categories],
  );

  function openCreate() {
    setEditingCategory(null);
    setSheetOpen(true);
  }

  function openEdit(category: CategoryRow) {
    setEditingCategory(category);
    setSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);

    if (!open) {
      setEditingCategory(null);
    }
  }

  function openImport() {
    setImportOpen(true);
  }

  function handleExportCsv() {
    const csv = buildCategoriesCsv(
      categories.map((row) => ({
        name: row.name,
        pattern: row.pattern,
        type: row.type,
        active: row.active,
        color: row.color,
      })),
    );
    downloadTextFile('categories.csv', csv);
  }

  function handleImported(result: {
    skippedDuplicateCount: number;
    inactiveUpdated: { id: string; name: string }[];
  }) {
    setShowImportNotice(true);
    setUndoError(null);

    if (result.inactiveUpdated.length > 0) {
      setReactivateCategories(result.inactiveUpdated);
      setReactivateOpen(true);
    }

    startTransition(() => {
      router.refresh();
    });
  }

  function handleReactivateDone() {
    setReactivateCategories([]);
    startTransition(() => {
      router.refresh();
    });
  }

  function handleUndo() {
    setUndoError(null);

    startTransition(async () => {
      const result = await undoCategoryImport();

      if (!result.ok) {
        if (result.blockingCategories?.length) {
          setUndoError(
            `${result.error} ${result.blockingCategories.join(', ')}`,
          );
        } else {
          setUndoError(result.error);
        }
        return;
      }

      setShowImportNotice(false);
      setUndoDialogOpen(false);
      router.refresh();
    });
  }

  async function handleSubmit(input: CategoryFormInput) {
    const result = editingCategory
      ? await updateCategory(editingCategory.id, input)
      : await createCategory(input);

    if (result.ok) {
      setSheetOpen(false);
      setEditingCategory(null);
      startTransition(() => {
        router.refresh();
      });
    }

    return result;
  }

  async function handleReorder(orderedIds: string[]) {
    setOrderError(null);

    const result = await reorderCategories(orderedIds);

    if (!result.ok) {
      setOrderError(result.error);
      return result;
    }

    startTransition(() => {
      router.refresh();
    });

    return result;
  }

  async function handleToggleActive(id: string, active: boolean) {
    setToggleError(null);

    const result = await setCategoryActive(id, active);

    if (!result.ok) {
      setToggleError(result.error);
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Categories"
        description="Rules for auto-categorizing transactions at import time. Longest match wins; priority breaks ties."
        actions={
          <>
            {importSnapshot.canUndo ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setUndoDialogOpen(true)}
                disabled={isPending}
              >
                Undo last import
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={handleExportCsv}
              disabled={isPending}
            >
              Export CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={openImport}
              disabled={isPending}
            >
              Import CSV
            </Button>
            <Button onClick={openCreate}>New category</Button>
          </>
        }
      />

      {showImportNotice ? (
        <Alert>
          <AlertTitle>Categories imported</AlertTitle>
          <AlertDescription>
            You can undo this import and restore the previous category rules.
          </AlertDescription>
          <AlertAction>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setUndoDialogOpen(true)}
            >
              Undo
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      {undoError ? (
        <p className="text-sm text-destructive" role="alert">
          {undoError}
        </p>
      ) : null}

      {orderError ? (
        <p className="text-sm text-destructive" role="alert">
          {orderError}
        </p>
      ) : null}

      {toggleError ? (
        <p className="text-sm text-destructive" role="alert">
          {toggleError}
        </p>
      ) : null}

      <CategoriesTableFilters
        filters={tableFilters}
        onFiltersChange={setTableFilters}
        hasActiveFilters={hasActiveFilters}
        onClear={() => setTableFilters(DEFAULT_CATEGORY_TABLE_FILTERS)}
      />

      <CategoriesTable
        categories={filteredCategories}
        disabled={isPending}
        reorderDisabled={hasActiveFilters}
        onEdit={openEdit}
        onReorder={handleReorder}
        onToggleActive={handleToggleActive}
      />

      <CategoryFormSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        category={editingCategory}
        onSubmit={handleSubmit}
      />

      <CategoryImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        existing={existingForImport}
        onImported={handleImported}
      />

      <CategoryImportReactivateDialog
        key={reactivateCategories.map((row) => row.id).join(',')}
        open={reactivateOpen}
        onOpenChange={setReactivateOpen}
        categories={reactivateCategories}
        onDone={handleReactivateDone}
      />

      <AlertDialog open={undoDialogOpen} onOpenChange={setUndoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undo last import?</AlertDialogTitle>
            <AlertDialogDescription>
              Restores all categories to how they were before the import on{' '}
              {formatSnapshotDate(importSnapshot.createdAt)}. Any changes you made to
              categories since then will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleUndo();
              }}
            >
              {isPending ? 'Restoring…' : 'Undo import'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
