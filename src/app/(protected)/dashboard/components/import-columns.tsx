"use client";

import { memo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, Plus } from "lucide-react";

import type { ImportedSpreadsheetRow, RowDuplicateStatus, RowValidation } from "@/lib/file-import";
import { getDuplicateTooltipMessage } from "@/lib/file-import";
import type { ImportCategoryOption } from "@/lib/categories/get-active-categories-for-import";
import type { RowNoteMatch } from "@/lib/notes/types";

import { CategoryCombobox } from "@/components/categories/category-combobox";
import {
  TABLE_MONEY_HEADER_CLASS,
  TableMoneyCell,
} from "@/components/data-table/table-money-cell";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDisplayDate } from "@/lib/formatters";
import { UNCATEGORIZED_CATEGORY_VALUE } from "@/lib/transactions/validate-transaction-form";

export type PreviewRow = ImportedSpreadsheetRow & {
  validation: RowValidation;
  duplicate: RowDuplicateStatus;
  noteMatch: RowNoteMatch | null;
};

type ImportPreviewCategoryCellProps = {
  rowIndex: number;
  categoryId: string | null;
  description: string;
  categories: ImportCategoryOption[];
  onCategoryChange: (rowIndex: number, categoryId: string | null) => void;
  onCreateCategory: (description: string) => void;
};

const ImportPreviewCategoryCell = memo(function ImportPreviewCategoryCell({
  rowIndex,
  categoryId,
  description,
  categories,
  onCategoryChange,
  onCreateCategory,
}: ImportPreviewCategoryCellProps) {
  const value = categoryId ?? UNCATEGORIZED_CATEGORY_VALUE;
  const trimmedDescription = description.trim();

  return (
    <div className="flex items-center gap-2">
      <CategoryCombobox
        id={`import-row-${rowIndex}-category`}
        value={value}
        onValueChange={(next) => {
          onCategoryChange(
            rowIndex,
            next === UNCATEGORIZED_CATEGORY_VALUE ? null : next,
          );
        }}
        categories={categories}
        noneValue={UNCATEGORIZED_CATEGORY_VALUE}
        className="max-w-[220px]"
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onCreateCategory(trimmedDescription)}
            disabled={!trimmedDescription}
            aria-label="Create category from description"
          >
            <Plus />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Create category</TooltipContent>
      </Tooltip>
    </div>
  );
});

function DuplicateValidationCell({
  duplicate,
  onConfirmNotDuplicate,
}: {
  duplicate: RowDuplicateStatus;
  onConfirmNotDuplicate: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="warning" className="cursor-default">
              Duplicate
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {duplicate.isDuplicate
              ? getDuplicateTooltipMessage(duplicate.reason)
              : null}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setOpen(true)}
              aria-label="Confirm as not duplicate"
            >
              <Check />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Confirm as not duplicate</TooltipContent>
        </Tooltip>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Override duplicate?</AlertDialogTitle>
            <AlertDialogDescription>
              This row appears to be a duplicate. By confirming, you are
              manually overriding that and the row will be imported.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onConfirmNotDuplicate();
                setOpen(false);
              }}
            >
              Confirm import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function NoteMatchValidationCell({
  noteMatch,
  onConfirmNoteMatch,
}: {
  noteMatch: RowNoteMatch;
  onConfirmNoteMatch: () => void;
}) {
  const [open, setOpen] = useState(false);
  const tooltipContent = noteMatch.context?.trim()
    ? noteMatch.context.trim()
    : 'Category matched from an active note.';

  return (
    <>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="cursor-default">
              Note match
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setOpen(true)}
              aria-label="Confirm note match"
            >
              <Check />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Confirm note match</TooltipContent>
        </Tooltip>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm note match?</AlertDialogTitle>
            <AlertDialogDescription>
              This row was categorized from an active note. Confirming keeps
              the category on import and archives the note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onConfirmNoteMatch();
                setOpen(false);
              }}
            >
              Confirm match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function createValidationColumn(
  onOverrideDuplicate: (rowIndex: number) => void,
  onConfirmNoteMatch: (rowIndex: number) => void,
): ColumnDef<PreviewRow> {
  return {
    id: "validation",
    header: "Validation",
    cell: ({ row }) => {
      const validation = row.original.validation;

      if (!validation.valid) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive" className="cursor-default">
                Invalid
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <ul className="list-inside list-disc space-y-0.5">
                {validation.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        );
      }

      const duplicate = row.original.duplicate;

      if (duplicate.isDuplicate) {
        return (
          <DuplicateValidationCell
            duplicate={duplicate}
            onConfirmNotDuplicate={() => onOverrideDuplicate(row.index)}
          />
        );
      }

      const noteMatch = row.original.noteMatch;

      if (noteMatch && !noteMatch.confirmed) {
        return (
          <NoteMatchValidationCell
            noteMatch={noteMatch}
            onConfirmNoteMatch={() => onConfirmNoteMatch(row.index)}
          />
        );
      }

      return <Badge variant="success">Valid</Badge>;
    },
  };
}

function createCategoryColumn(
  categories: ImportCategoryOption[],
  onCategoryChange: (rowIndex: number, categoryId: string | null) => void,
  onCreateCategory: (description: string) => void,
): ColumnDef<PreviewRow> {
  return {
    id: "category",
    header: "Category",
    cell: ({ row }) => (
      <ImportPreviewCategoryCell
        rowIndex={row.index}
        categoryId={row.original.categoryId}
        description={row.original.description}
        categories={categories}
        onCategoryChange={onCategoryChange}
        onCreateCategory={onCreateCategory}
      />
    ),
  };
}

function getBaseColumns(
  categories: ImportCategoryOption[],
  onCategoryChange: (rowIndex: number, categoryId: string | null) => void,
  onCreateCategory: (description: string) => void,
  onOverrideDuplicate: (rowIndex: number) => void,
  onConfirmNoteMatch: (rowIndex: number) => void,
): ColumnDef<PreviewRow>[] {
  return [
    createValidationColumn(onOverrideDuplicate, onConfirmNoteMatch),
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDisplayDate(row.getValue("date")),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="whitespace-normal">{row.getValue("description")}</span>
      ),
    },
    createCategoryColumn(categories, onCategoryChange, onCreateCategory),
    {
      accessorKey: "value",
      header: () => <div className={TABLE_MONEY_HEADER_CLASS}>Value</div>,
      cell: ({ row }) => (
        <TableMoneyCell value={row.getValue("value")} />
      ),
    },
  ];
}

const balanceColumn: ColumnDef<PreviewRow> = {
  accessorKey: "balance",
  header: () => <div className={TABLE_MONEY_HEADER_CLASS}>Balance</div>,
  cell: ({ row }) => <TableMoneyCell value={row.getValue("balance")} />,
  meta: {
    headerClassName: "hidden lg:table-cell",
    cellClassName: "hidden lg:table-cell",
  },
};

export function getPreviewColumns(
  includeBalance: boolean,
  categories: ImportCategoryOption[],
  onCategoryChange: (rowIndex: number, categoryId: string | null) => void,
  onCreateCategory: (description: string) => void,
  onOverrideDuplicate: (rowIndex: number) => void,
  onConfirmNoteMatch: (rowIndex: number) => void,
): ColumnDef<PreviewRow>[] {
  const columns = getBaseColumns(
    categories,
    onCategoryChange,
    onCreateCategory,
    onOverrideDuplicate,
    onConfirmNoteMatch,
  );

  if (includeBalance) {
    return [...columns, balanceColumn];
  }

  return columns;
}
