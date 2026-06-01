'use client';

import { useState, useTransition } from 'react';

import { updateSkippedImportRow } from '@/app/(protected)/imports/[id]/actions/update-skipped-import-row';
import type { ImportSkippedRow } from '@/app/(protected)/imports/[id]/components/import-skipped-rows-table';
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
import { getCalendarDayKey } from '@/lib/file-import/duplicate-key';

type SkippedImportRowSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importId: string;
  row: ImportSkippedRow | null;
  onSaved: (result: {
    row: ImportSkippedRow;
    isValid: boolean;
  }) => void;
};

function getInitialDate(row: ImportSkippedRow): string {
  return row.date ? getCalendarDayKey(row.date) : '';
}

function getInitialValue(row: ImportSkippedRow): string {
  return row.value ?? '';
}

export function SkippedImportRowSheet({
  open,
  onOpenChange,
  importId,
  row,
  onSaved,
}: SkippedImportRowSheetProps) {
  if (!row) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 sm:max-w-md">
        <SkippedImportRowSheetBody
          key={row.id}
          importId={importId}
          row={row}
          onCancel={() => onOpenChange(false)}
          onSaved={(result) => {
            onSaved(result);
            onOpenChange(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

type SkippedImportRowSheetBodyProps = {
  importId: string;
  row: ImportSkippedRow;
  onCancel: () => void;
  onSaved: (result: { row: ImportSkippedRow; isValid: boolean }) => void;
};

function SkippedImportRowSheetBody({
  importId,
  row,
  onCancel,
  onSaved,
}: SkippedImportRowSheetBodyProps) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(() => getInitialDate(row));
  const [description, setDescription] = useState(row.description);
  const [value, setValue] = useState(() => getInitialValue(row));
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'date' | 'description' | 'value', string>>
  >({});

  function handleSubmit() {
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateSkippedImportRow({
        importId,
        skippedRowId: row.id,
        date,
        description,
        value,
      });

      if (!result.ok) {
        setFormError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      onSaved({ row: result.row, isValid: result.isValid });
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Edit missing row</SheetTitle>
        <SheetDescription>
          Update date, description, or value. Validation runs when you save.
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="skipped-row-date">Date</FieldLabel>
            <FieldContent>
              <Input
                id="skipped-row-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                aria-invalid={fieldErrors.date != null}
              />
              {fieldErrors.date ? (
                <FieldError>{fieldErrors.date}</FieldError>
              ) : null}
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="skipped-row-description">Description</FieldLabel>
            <FieldContent>
              <Input
                id="skipped-row-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                aria-invalid={fieldErrors.description != null}
              />
              {fieldErrors.description ? (
                <FieldError>{fieldErrors.description}</FieldError>
              ) : null}
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="skipped-row-value">Value</FieldLabel>
            <FieldContent>
              <Input
                id="skipped-row-value"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                aria-invalid={fieldErrors.value != null}
              />
              {fieldErrors.value ? (
                <FieldError>{fieldErrors.value}</FieldError>
              ) : null}
            </FieldContent>
          </Field>
        </FieldGroup>

        {formError ? (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        ) : null}
      </div>

      <SheetFooter className="border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </SheetFooter>
    </>
  );
}
