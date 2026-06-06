'use client';

import { useState, useTransition } from 'react';

import { CategoryCombobox } from '@/components/categories/category-combobox';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { getCalendarDayKey } from '@/lib/file-import/duplicate-key';
import {
  isMerchantSlug,
  MERCHANTS_SORTED_BY_LABEL,
  type MerchantSlug,
} from '@/lib/merchants';
import type { TransactionRow } from '@/lib/transactions/transaction-row';
import type { TransactionFormInput } from '@/lib/transactions/validate-transaction-form';
import {
  UNCATEGORIZED_CATEGORY_VALUE,
  type TransactionFormField,
} from '@/lib/transactions/validate-transaction-form';

type CategoryOption = {
  id: string;
  name: string;
};

type TransactionFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionRow | null;
  categories: CategoryOption[];
  onSubmit: (input: TransactionFormInput) => Promise<{
    ok: boolean;
    error?: string;
    fieldErrors?: Partial<Record<TransactionFormField, string>>;
  }>;
};

type TransactionFormBodyProps = {
  transaction: TransactionRow;
  categories: CategoryOption[];
  onSubmit: TransactionFormSheetProps['onSubmit'];
  onCancel: () => void;
};

function TransactionFormBody({
  transaction,
  categories,
  onSubmit,
  onCancel,
}: TransactionFormBodyProps) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(() => getCalendarDayKey(transaction.date));
  const [description, setDescription] = useState(transaction.description);
  const [value, setValue] = useState(transaction.value);
  const [categoryId, setCategoryId] = useState(
    transaction.categoryId ?? UNCATEGORIZED_CATEGORY_VALUE,
  );
  const [merchant, setMerchant] = useState<MerchantSlug | undefined>(() =>
    isMerchantSlug(transaction.merchant) ? transaction.merchant : undefined,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<TransactionFormField, string>>
  >({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!merchant) {
      setFieldErrors({ merchant: 'Select a merchant.' });
      return;
    }

    startTransition(async () => {
      const result = await onSubmit({
        id: transaction.id,
        date,
        description,
        value,
        categoryId:
          categoryId === UNCATEGORIZED_CATEGORY_VALUE ? null : categoryId,
        merchant,
      });

      if (!result.ok) {
        setFormError(result.error ?? 'Something went wrong.');
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-1">
      <FieldGroup>
        <Field data-invalid={Boolean(fieldErrors.date)}>
          <FieldLabel htmlFor="transaction-date">Date</FieldLabel>
          <FieldContent>
            <DatePicker
              id="transaction-date"
              value={date}
              onValueChange={setDate}
              disableFuture
              aria-invalid={Boolean(fieldErrors.date)}
              disabled={isPending}
            />
            <FieldError>{fieldErrors.date}</FieldError>
          </FieldContent>
        </Field>

        <Field data-invalid={Boolean(fieldErrors.description)}>
          <FieldLabel htmlFor="transaction-description">Description</FieldLabel>
          <FieldContent>
            <Input
              id="transaction-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              aria-invalid={Boolean(fieldErrors.description)}
              disabled={isPending}
              autoComplete="off"
            />
            <FieldError>{fieldErrors.description}</FieldError>
          </FieldContent>
        </Field>

        <Field data-invalid={Boolean(fieldErrors.value)}>
          <FieldLabel htmlFor="transaction-value">Value</FieldLabel>
          <FieldContent>
            <Input
              id="transaction-value"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              inputMode="decimal"
              aria-invalid={Boolean(fieldErrors.value)}
              disabled={isPending}
              autoComplete="off"
              className="font-mono"
            />
            <FieldDescription>
              Use a dot or comma as the decimal separator.
            </FieldDescription>
            <FieldError>{fieldErrors.value}</FieldError>
          </FieldContent>
        </Field>

        <Field data-invalid={Boolean(fieldErrors.categoryId)}>
          <FieldLabel htmlFor="transaction-category">Category</FieldLabel>
          <FieldContent>
            <CategoryCombobox
              id="transaction-category"
              value={categoryId}
              onValueChange={setCategoryId}
              categories={categories}
              noneValue={UNCATEGORIZED_CATEGORY_VALUE}
              disabled={isPending}
              aria-invalid={Boolean(fieldErrors.categoryId)}
            />
            <FieldError>{fieldErrors.categoryId}</FieldError>
          </FieldContent>
        </Field>

        <Field data-invalid={Boolean(fieldErrors.merchant)}>
          <FieldLabel htmlFor="transaction-merchant">Merchant</FieldLabel>
          <FieldContent>
            <Combobox
              id="transaction-merchant"
              className="w-full"
              value={merchant}
              onValueChange={(next) => {
                if (isMerchantSlug(next)) {
                  setMerchant(next);
                }
              }}
              placeholder="Select merchant"
              searchPlaceholder="Search merchants…"
              disabled={isPending}
              options={MERCHANTS_SORTED_BY_LABEL.map(({ slug, label }) => ({
                value: slug,
                label,
              }))}
            />
            <FieldError>{fieldErrors.merchant}</FieldError>
          </FieldContent>
        </Field>
      </FieldGroup>

      {formError && !Object.keys(fieldErrors).length ? (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}

      <SheetFooter className="flex-row justify-end gap-2 px-0">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </SheetFooter>
    </form>
  );
}

export function TransactionFormSheet({
  open,
  onOpenChange,
  transaction,
  categories,
  onSubmit,
}: TransactionFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Edit transaction</SheetTitle>
          <SheetDescription>
            Update the date, description, amount, category, or merchant.
          </SheetDescription>
        </SheetHeader>

        {open && transaction ? (
          <TransactionFormBody
            key={transaction.id}
            transaction={transaction}
            categories={categories}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
