'use client';

import { useState, useTransition } from 'react';

import type { NoteFormInput } from '@/lib/notes/types';
import { CategoryCombobox } from '@/components/categories/category-combobox';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  Field,
  FieldDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { formatCalendarDayKey } from '@/lib/dates/calendar-day-key';
import { formatPositiveAmountForNoteForm } from '@/lib/notes/normalize-note-value';
import type { NoteCategoryOption, NoteRow } from '@/lib/notes/types';
import {
  isMerchantSlug,
  MERCHANTS_SORTED_BY_LABEL,
  type MerchantSlug,
} from '@/lib/merchants';

type NoteFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NoteRow | null;
  categories: NoteCategoryOption[];
  onSubmit: (input: NoteFormInput) => Promise<{
    ok: boolean;
    error?: string;
    fieldErrors?: Partial<
      Record<'merchant' | 'date' | 'amount' | 'categoryId' | 'context', string>
    >;
  }>;
};

function NoteFormBody({
  note,
  categories,
  onSubmit,
  onCancel,
}: {
  note: NoteRow | null;
  categories: NoteCategoryOption[];
  onSubmit: NoteFormSheetProps['onSubmit'];
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [merchant, setMerchant] = useState<MerchantSlug | undefined>(() =>
    note && isMerchantSlug(note.merchant) ? note.merchant : undefined,
  );
  const [date, setDate] = useState(
    note ? formatCalendarDayKey(note.date) : '',
  );
  const [amount, setAmount] = useState(
    note ? formatPositiveAmountForNoteForm(note.value) : '',
  );
  const [categoryId, setCategoryId] = useState(note?.categoryId ?? '');
  const [context, setContext] = useState(note?.context ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'merchant' | 'date' | 'amount' | 'categoryId' | 'context', string>>
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
        id: note?.id,
        merchant,
        date,
        amount,
        categoryId,
        context,
      });

      if (!result.ok) {
        setFormError(result.error ?? 'Could not save note.');
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      onCancel();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="note-merchant">Merchant</FieldLabel>
            <Combobox
              id="note-merchant"
              value={merchant}
              onValueChange={(value) => {
                if (isMerchantSlug(value)) {
                  setMerchant(value);
                }
              }}
              placeholder="Select merchant"
              searchPlaceholder="Search merchants…"
              options={MERCHANTS_SORTED_BY_LABEL.map(({ slug, label }) => ({
                value: slug,
                label,
              }))}
              aria-invalid={!!fieldErrors.merchant}
            />
            {fieldErrors.merchant ? (
              <FieldError>{fieldErrors.merchant}</FieldError>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="note-date">Date</FieldLabel>
            <DatePicker
              id="note-date"
              value={date}
              onValueChange={setDate}
              disableFuture
              aria-invalid={!!fieldErrors.date}
            />
            {fieldErrors.date ? <FieldError>{fieldErrors.date}</FieldError> : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="note-amount">Amount</FieldLabel>
            <Input
              id="note-amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              aria-invalid={!!fieldErrors.amount}
            />
            {fieldErrors.amount ? (
              <FieldError>{fieldErrors.amount}</FieldError>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="note-category">Category</FieldLabel>
            <CategoryCombobox
              id="note-category"
              value={categoryId}
              onValueChange={setCategoryId}
              categories={categories}
              noneValue=""
              includeNoneOption={false}
              placeholder="Select category"
              disabled={categories.length === 0}
              aria-invalid={!!fieldErrors.categoryId}
            />
            {categories.length === 0 ? (
              <FieldDescription>
                Add an active spending or income category in Settings →
                Categories first.
              </FieldDescription>
            ) : null}
            {fieldErrors.categoryId ? (
              <FieldError>{fieldErrors.categoryId}</FieldError>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="note-context">Context (optional)</FieldLabel>
            <Textarea
              id="note-context"
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="What was this expense for?"
              aria-invalid={!!fieldErrors.context}
            />
            {fieldErrors.context ? (
              <FieldError>{fieldErrors.context}</FieldError>
            ) : null}
          </Field>

          {formError ? <FieldError>{formError}</FieldError> : null}
        </FieldGroup>
      </div>

      <SheetFooter className="border-t px-4 py-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : note ? 'Save changes' : 'Create note'}
        </Button>
      </SheetFooter>
    </form>
  );
}

export function NoteFormSheet({
  open,
  onOpenChange,
  note,
  categories,
  onSubmit,
}: NoteFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>{note ? 'Edit note' : 'Create note'}</SheetTitle>
          <SheetDescription>
            Record merchant, date, and amount so imports can match uncategorized
            transactions.
          </SheetDescription>
        </SheetHeader>

        <NoteFormBody
          key={note?.id ?? 'new'}
          note={note}
          categories={categories}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
