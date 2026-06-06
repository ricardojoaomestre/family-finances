'use client';

import { useState, useTransition } from 'react';

import type { CategoryFormInput } from '@/app/(protected)/settings/categories/actions/category-actions';
import { CategoryColorPicker } from '@/app/(protected)/settings/categories/components/category-color-picker';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
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
import { Switch } from '@/components/ui/switch';
import { Combobox } from '@/components/ui/combobox';
import { Textarea } from '@/components/ui/textarea';
import {
  getDefaultCategoryColor,
  type CategoryColorToken,
} from '@/lib/categories/category-colors';
import {
  categoryTypeDescriptions,
  categoryTypeLabels,
  categoryTypeValues,
  DEFAULT_CATEGORY_TYPE,
  type CategoryType,
} from '@/lib/categories/category-type';
import type { CategoryRow } from '@/lib/categories/get-categories';

type CategoryFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryRow | null;
  defaultPattern?: string;
  onSubmit: (input: CategoryFormInput) => Promise<{
    ok: boolean;
    error?: string;
    fieldErrors?: Partial<
      Record<'name' | 'pattern' | 'description' | 'color' | 'type', string>
    >;
  }>;
};

type CategoryFormBodyProps = {
  category: CategoryRow | null;
  defaultPattern?: string;
  onSubmit: CategoryFormSheetProps['onSubmit'];
  onCancel: () => void;
};

function CategoryFormBody({
  category,
  defaultPattern,
  onSubmit,
  onCancel,
}: CategoryFormBodyProps) {
  const [draftId] = useState(() => crypto.randomUUID());
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [color, setColor] = useState<CategoryColorToken>(
    category?.color ?? getDefaultCategoryColor(draftId),
  );
  const [pattern, setPattern] = useState(
    category?.pattern ?? defaultPattern ?? '',
  );
  const [active, setActive] = useState(category?.active ?? true);
  const [type, setType] = useState<CategoryType>(
    category?.type ?? DEFAULT_CATEGORY_TYPE,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<
      Record<'name' | 'pattern' | 'description' | 'color' | 'type', string>
    >
  >({});

  const isEditing = category !== null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await onSubmit({
        id: isEditing ? undefined : draftId,
        name,
        description,
        color,
        pattern,
        active,
        type,
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
        <Field data-invalid={Boolean(fieldErrors.name)}>
          <FieldLabel htmlFor="category-name">Name</FieldLabel>
          <FieldContent>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Groceries"
              maxLength={40}
              aria-invalid={Boolean(fieldErrors.name)}
              disabled={isPending}
              autoComplete="off"
            />
            <FieldDescription>
              Short label shown on transactions (40 characters max).
              {isEditing
                ? ' Renaming updates the label everywhere this category appears.'
                : null}
            </FieldDescription>
            <FieldError>{fieldErrors.name}</FieldError>
          </FieldContent>
        </Field>

        <Field data-invalid={Boolean(fieldErrors.description)}>
          <FieldLabel htmlFor="category-description">Description</FieldLabel>
          <FieldContent>
            <Textarea
              id="category-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Supermarket and convenience store purchases"
              maxLength={500}
              rows={3}
              aria-invalid={Boolean(fieldErrors.description)}
              disabled={isPending}
            />
            <FieldDescription>
              Optional notes for your reference. Not shown on transactions.
            </FieldDescription>
            <FieldError>{fieldErrors.description}</FieldError>
          </FieldContent>
        </Field>

        <Field data-invalid={Boolean(fieldErrors.type)}>
          <FieldLabel htmlFor="category-type">Type</FieldLabel>
          <FieldContent>
            <Combobox
              id="category-type"
              className="w-full"
              value={type}
              onValueChange={(value) => setType(value as CategoryType)}
              disabled={isPending}
              aria-invalid={Boolean(fieldErrors.type)}
              searchPlaceholder="Search types…"
              options={categoryTypeValues.map((value) => ({
                value,
                label: categoryTypeLabels[value],
              }))}
            />
            <FieldDescription>{categoryTypeDescriptions[type]}</FieldDescription>
            <FieldError>{fieldErrors.type}</FieldError>
          </FieldContent>
        </Field>

        <Field data-invalid={Boolean(fieldErrors.color)}>
          <FieldLabel>Color</FieldLabel>
          <FieldContent>
            <CategoryColorPicker
              value={color}
              onChange={setColor}
              disabled={isPending}
            />
            <FieldError>{fieldErrors.color}</FieldError>
          </FieldContent>
        </Field>

        <Field data-invalid={Boolean(fieldErrors.pattern)}>
          <FieldLabel htmlFor="category-pattern">Pattern</FieldLabel>
          <FieldContent>
            <Textarea
              id="category-pattern"
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
              placeholder="continente|pingo\\s+doce"
              aria-invalid={Boolean(fieldErrors.pattern)}
              disabled={isPending}
              rows={4}
              className="font-mono text-sm"
            />
            <FieldDescription>
              {isEditing
                ? 'Optional regular expression matched against transaction descriptions at import time (case-insensitive). Changes apply to future imports only; existing transactions keep their current category.'
                : 'Optional regular expression matched against transaction descriptions (case-insensitive).'}
            </FieldDescription>
            <FieldError>{fieldErrors.pattern}</FieldError>
          </FieldContent>
        </Field>

        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="category-active">Active</FieldLabel>
            <FieldDescription>
              Inactive categories are skipped during import.
            </FieldDescription>
          </FieldContent>
          <Switch
            id="category-active"
            checked={active}
            onCheckedChange={setActive}
            disabled={isPending}
          />
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
          {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Create'}
        </Button>
      </SheetFooter>
    </form>
  );
}

export function CategoryFormSheet({
  open,
  onOpenChange,
  category,
  defaultPattern,
  onSubmit,
}: CategoryFormSheetProps) {
  const isEditing = category !== null;
  const formKey = category?.id ?? `new-${defaultPattern ?? ''}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit category' : 'New category'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Update the name, type, description, color, pattern, or status. Transactions store the category by id, so renames show up automatically; pattern changes only affect new imports.'
              : 'Create a rule to categorize matching transactions at import time.'}
          </SheetDescription>
        </SheetHeader>

        {open ? (
          <CategoryFormBody
            key={formKey}
            category={category}
            defaultPattern={defaultPattern}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
