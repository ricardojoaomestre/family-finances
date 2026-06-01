'use client';

import { useState, useTransition } from 'react';

import { activateImportedCategories } from '@/app/(protected)/settings/categories/actions/import-categories';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type InactiveCategory = {
  id: string;
  name: string;
};

type CategoryImportReactivateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: InactiveCategory[];
  onDone: () => void;
};

export function CategoryImportReactivateDialog({
  open,
  onOpenChange,
  categories,
  onDone,
}: CategoryImportReactivateDialogProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(categories.map((row) => [row.id, true])),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    onOpenChange(next);

    if (!next) {
      onDone();
    }
  }

  function handleToggle(id: string, checked: boolean) {
    setSelected((current) => ({ ...current, [id]: checked }));
  }

  function handleLeaveInactive() {
    handleOpenChange(false);
  }

  function handleActivate() {
    setError(null);

    const categoryIds = categories
      .filter((row) => selected[row.id])
      .map((row) => row.id);

    startTransition(async () => {
      if (categoryIds.length === 0) {
        handleOpenChange(false);
        return;
      }

      const result = await activateImportedCategories({ categoryIds });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      handleOpenChange(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Activate updated categories?</AlertDialogTitle>
          <AlertDialogDescription>
            Some inactive categories were updated. Do you want to activate them?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="flex max-h-48 flex-col gap-3 overflow-auto py-1">
          {categories.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <Label htmlFor={`reactivate-${row.id}`} className="font-medium">
                {row.name}
              </Label>
              <Switch
                id={`reactivate-${row.id}`}
                checked={selected[row.id] ?? false}
                onCheckedChange={(checked) => handleToggle(row.id, checked)}
                disabled={isPending}
              />
            </li>
          ))}
        </ul>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} onClick={handleLeaveInactive}>
            Leave inactive
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              handleActivate();
            }}
          >
            {isPending ? 'Activating…' : 'Activate selected'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
