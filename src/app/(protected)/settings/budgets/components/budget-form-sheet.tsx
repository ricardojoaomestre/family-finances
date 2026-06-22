'use client';

import { useState, useTransition } from 'react';

import type { BudgetFormInput } from '@/app/(protected)/settings/budgets/actions/budget-actions';
import { CategoryCombobox } from '@/components/categories/category-combobox';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { CategoryRow } from '@/lib/categories/get-categories';
import type { BudgetRow } from '@/lib/budgets/get-budgets';

type BudgetFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: BudgetRow | null;
  categories: CategoryRow[];
  usedCategoryIds: string[];
  onSubmit: (input: BudgetFormInput) => Promise<{
    ok: boolean;
    error?: string;
    fieldErrors?: Partial<Record<'categoryId' | 'amount', string>>;
  }>;
};

export function BudgetFormSheet({
  open,
  onOpenChange,
  budget,
  categories,
  usedCategoryIds,
  onSubmit,
}: BudgetFormSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState(budget?.categoryId ?? '');
  const [amount, setAmount] = useState(budget?.amount ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'categoryId' | 'amount', string>>
  >({});

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await onSubmit({ categoryId, amount });

      if (!result.ok) {
        setFormError(result.error ?? 'Something went wrong.');
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{budget ? 'Edit budget' : 'Add budget'}</SheetTitle>
          <SheetDescription>
            Set a monthly spending limit for a category.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6">
          <FieldGroup>
            {formError ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            ) : null}
            <Field>
              <FieldLabel>Category</FieldLabel>
              <FieldContent>
                <CategoryCombobox
                  value={categoryId}
                  onValueChange={setCategoryId}
                  categories={categories}
                  filter={{
                    activeOnly: true,
                    types: ['spending'],
                    excludeIds: budget ? [] : usedCategoryIds,
                    includeIds: budget ? [budget.categoryId] : [],
                  }}
                  includeNoneOption={false}
                  placeholder="Select a category"
                  disabled={Boolean(budget)}
                />
                <FieldError>{fieldErrors.categoryId}</FieldError>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Monthly amount</FieldLabel>
              <FieldContent>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="500.00"
                />
                <FieldError>{fieldErrors.amount}</FieldError>
              </FieldContent>
            </Field>
          </FieldGroup>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {budget ? 'Save changes' : 'Add budget'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
