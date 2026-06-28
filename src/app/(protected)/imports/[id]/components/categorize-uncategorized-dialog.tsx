'use client';

import { useMemo, useState, useTransition } from 'react';
import { ArrowLeft } from 'lucide-react';

import { CategorizeCategoryPicker } from '@/app/(protected)/imports/[id]/components/categorize-category-picker';
import { getCategorySelectorItems } from '@/app/(protected)/imports/[id]/actions/get-category-selector-items';
import type { CategorizeTransactionRow } from '@/lib/transactions/categorize-transaction-row';
import {
  createCategory,
  type CategoryFormInput,
} from '@/app/(protected)/settings/categories/actions/category-actions';
import { CategoryFormSheet } from '@/app/(protected)/settings/categories/components/category-form-sheet';
import {
  updateTransactionCategory,
  type UpdatedTransactionCategory,
} from '@/app/(protected)/transactions/actions/update-transaction-category';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { escapeRegexLiteral } from '@/lib/categories/escape-regex-literal';
import type { CategorySelectorItem } from '@/lib/categories/filter-category-selector-items';
import { formatDisplayDate, formatDisplayMoney } from '@/lib/formatters';
import { categoryTypesForTransactionValue } from '@/lib/transactions/category-types-for-value';
import { cn } from '@/lib/utils';

type CategorizeUncategorizedDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: CategorizeTransactionRow[];
  categories: CategorySelectorItem[];
  bankAccountLabel?: string;
  onCategorySaved: (
    transactionId: string,
    category: UpdatedTransactionCategory,
  ) => void;
};

type FlowPhase = 'categorizing' | 'summary';

function isUncategorized(row: CategorizeTransactionRow): boolean {
  return row.categoryId == null;
}

function getSavedCategoryId(
  row: CategorizeTransactionRow,
  sessionAssignments: ReadonlyMap<string, string>,
): string | null {
  return sessionAssignments.get(row.id) ?? row.categoryId;
}

function isSearchInputTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest('[data-slot="command-input"]') != null
  );
}

export function CategorizeUncategorizedDialog({
  open,
  onOpenChange,
  transactions,
  categories: initialCategories,
  bankAccountLabel,
  onCategorySaved,
}: CategorizeUncategorizedDialogProps) {
  const [categories, setCategories] =
    useState<CategorySelectorItem[]>(initialCategories);
  const [queue, setQueue] = useState(() =>
    transactions.filter(isUncategorized),
  );
  const [sessionTotal] = useState(
    () => transactions.filter(isUncategorized).length,
  );
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState<FlowPhase>('categorizing');
  const [draftCategoryByRowId, setDraftCategoryByRowId] = useState<
    Record<string, string>
  >({});
  const [sessionAssignments, setSessionAssignments] = useState<
    Map<string, string>
  >(() => new Map());
  const [formError, setFormError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [createCategoryPattern, setCreateCategoryPattern] = useState<
    string | null
  >(null);
  const [isSaving, startSaveTransition] = useTransition();

  const currentRow = queue[cursor] ?? null;

  const selectedCategoryId = currentRow
    ? (draftCategoryByRowId[currentRow.id] ??
      getSavedCategoryId(currentRow, sessionAssignments) ??
      '')
    : '';

  const remainingUncategorized = useMemo(
    () => queue.filter((row) => isUncategorized(row)).length,
    [queue],
  );

  function advanceCursor() {
    setCursor((current) => {
      const next = current + 1;
      if (next >= queue.length) {
        setPhase('summary');
        return current;
      }
      return next;
    });
  }

  function goBack() {
    setPhase('categorizing');
    setCursor((current) => Math.max(0, current - 1));
    setFormError(null);
    setCategoryError(null);
  }

  function handleSkip() {
    setFormError(null);
    setCategoryError(null);
    advanceCursor();
  }

  function handleCategoryChange(nextCategoryId: string) {
    if (!currentRow) {
      return;
    }

    setDraftCategoryByRowId((current) => ({
      ...current,
      [currentRow.id]: nextCategoryId,
    }));
    setCategoryError(null);
    setFormError(null);
  }

  function handleSaveAndAdvance(categoryIdOverride?: string) {
    if (!currentRow) {
      return;
    }

    const categoryId = categoryIdOverride ?? selectedCategoryId;

    if (!categoryId) {
      setCategoryError('Select a category.');
      return;
    }

    const savedId = getSavedCategoryId(currentRow, sessionAssignments);

    if (savedId === categoryId) {
      advanceCursor();
      return;
    }

    setFormError(null);
    setCategoryError(null);

    startSaveTransition(async () => {
      const result = await updateTransactionCategory({
        transactionId: currentRow.id,
        categoryId,
      });

      if (!result.ok) {
        setFormError(result.error);
        setCategoryError(result.fieldErrors?.categoryId ?? null);
        return;
      }

      setSessionAssignments((current) => {
        const next = new Map(current);
        next.set(currentRow.id, categoryId);
        return next;
      });

      setQueue((current) =>
        current.map((row) =>
          row.id === currentRow.id
            ? {
                ...row,
                categoryId: result.category.id,
                categoryName: result.category.name,
                categoryColor: result.category.color,
                categoryIcon: result.category.icon,
              }
            : row,
        ),
      );

      onCategorySaved(currentRow.id, result.category);
      advanceCursor();
    });
  }

  function handleContinue() {
    const firstRemainingIndex = queue.findIndex((row) => isUncategorized(row));

    if (firstRemainingIndex === -1) {
      onOpenChange(false);
      return;
    }

    setCursor(firstRemainingIndex);
    setPhase('categorizing');
    setFormError(null);
    setCategoryError(null);
  }

  async function handleCreateCategory(input: CategoryFormInput) {
    const result = await createCategory(input);

    if (result.ok) {
      setCreateCategoryOpen(false);
      setCreateCategoryPattern(null);

      const refreshed = await getCategorySelectorItems();
      setCategories(refreshed);

      const created = refreshed.find(
        (category) => category.name === input.name.trim(),
      );

      if (created && currentRow) {
        setDraftCategoryByRowId((current) => ({
          ...current,
          [currentRow.id]: created.id,
        }));
        setCategoryError(null);
      }
    }

    return result;
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (phase !== 'categorizing' || !currentRow || isSaving) {
      return;
    }

    const typingInSearch = isSearchInputTarget(event.target);

    if ((event.key === 's' || event.key === 'S') && event.ctrlKey) {
      event.preventDefault();
      handleSkip();
      return;
    }

    if (typingInSearch) {
      return;
    }

    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.metaKey &&
      !event.ctrlKey
    ) {
      event.preventDefault();
      handleSaveAndAdvance();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goBack();
    }
  }

  function handleOpenCreateCategory() {
    if (!currentRow) {
      return;
    }

    setCreateCategoryPattern(escapeRegexLiteral(currentRow.description.trim()));
    setCreateCategoryOpen(true);
  }

  const defaultCategoryType = currentRow
    ? categoryTypesForTransactionValue(currentRow.value)[0]
    : 'spending';

  const resolvedBankAccountLabel =
    currentRow?.bankAccountLabel ?? bankAccountLabel ?? '—';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-3xl gap-0 overflow-hidden p-0"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onKeyDown={handleKeyDown}
        >
          {phase === 'summary' ? (
            <div className="p-6">
              <DialogHeader>
                <DialogTitle>Categorization pass complete</DialogTitle>
                <DialogDescription>
                  {remainingUncategorized === 0
                    ? 'All transactions in this pass are categorized.'
                    : `${remainingUncategorized} transaction${remainingUncategorized === 1 ? '' : 's'} still uncategorized.`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-6 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                {remainingUncategorized > 0 ? (
                  <Button type="button" onClick={handleContinue}>
                    Continue
                  </Button>
                ) : null}
              </DialogFooter>
            </div>
          ) : currentRow ? (
            <>
              <div className="flex items-center gap-3 border-b px-6 py-4 pr-14">
                <DialogTitle className="text-base">
                  Categorize transaction
                </DialogTitle>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {cursor + 1} of {sessionTotal}
                </span>
              </div>

              <div className="grid md:grid-cols-2">
                <div className="flex flex-col justify-center gap-5 border-b px-6 py-5 md:border-r md:border-b-0">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Description
                    </p>
                    <p className="text-lg leading-snug font-medium">
                      {currentRow.description}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Amount
                    </p>
                    <p className="font-mono text-2xl font-semibold tabular-nums">
                      {formatDisplayMoney(currentRow.value)}
                    </p>
                  </div>

                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Date
                      </dt>
                      <dd className="font-medium">
                        {formatDisplayDate(currentRow.date)}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Account
                      </dt>
                      <dd className="font-medium">{resolvedBankAccountLabel}</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex min-h-[320px] flex-col px-6 py-5">
                  <CategorizeCategoryPicker
                    key={currentRow.id}
                    value={selectedCategoryId}
                    onValueChange={handleCategoryChange}
                    onConfirm={handleSaveAndAdvance}
                    categories={categories}
                    disabled={isSaving}
                    error={categoryError}
                    onCreateCategory={handleOpenCreateCategory}
                    focusSearch
                    searchFocusKey={currentRow.id}
                  />

                  {formError ? (
                    <p className="mt-3 text-sm text-destructive" role="alert">
                      {formError}
                    </p>
                  ) : null}
                </div>
              </div>

              <DialogFooter
                className={cn(
                  'border-t px-6 py-4 sm:justify-between',
                )}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={goBack}
                  disabled={cursor === 0 || isSaving}
                  className="gap-1.5"
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  Back
                </Button>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkip}
                    disabled={isSaving}
                  >
                    Skip
                    <span className="sr-only"> (Control+S)</span>
                    <kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 font-sans text-[10px] font-medium text-muted-foreground sm:inline">
                      ⌃S
                    </kbd>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSaveAndAdvance()}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving…' : 'Save & next'}
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <CategoryFormSheet
        open={createCategoryOpen}
        onOpenChange={(nextOpen) => {
          setCreateCategoryOpen(nextOpen);

          if (!nextOpen) {
            setCreateCategoryPattern(null);
          }
        }}
        category={null}
        defaultPattern={createCategoryPattern ?? undefined}
        defaultType={defaultCategoryType}
        onSubmit={handleCreateCategory}
      />
    </>
  );
}
