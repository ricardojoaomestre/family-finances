"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, Plus } from "lucide-react";

import type { ImportedSpreadsheetRow, RowDuplicateStatus, RowValidation } from "@/lib/file-import";
import { getDuplicateTooltipMessage } from "@/lib/file-import";
import type { ImportCategoryOption } from "@/lib/categories/get-active-categories-for-import";

import { CategoryColorSwatch } from "@/components/categories/category-color-swatch";
import {
  TABLE_MONEY_CELL_CLASS,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDisplayDate } from "@/lib/formatters";

export type PreviewRow = ImportedSpreadsheetRow & {
  validation: RowValidation;
  duplicate: RowDuplicateStatus;
};

const NONE_CATEGORY_VALUE = "__none__";

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

function createValidationColumn(
  onOverrideDuplicate: (rowIndex: number) => void,
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
    cell: ({ row }) => {
      const categoryId = row.original.categoryId;
      const value = categoryId ?? NONE_CATEGORY_VALUE;
      const selectedCategory = categoryId
        ? categories.find((category) => category.id === categoryId)
        : undefined;
      const description = row.original.description.trim();

      return (
        <div className="flex items-center gap-2">
          <Select
            value={value}
            onValueChange={(next) => {
              onCategoryChange(
                row.index,
                next === NONE_CATEGORY_VALUE ? null : next,
              );
            }}
          >
            <SelectTrigger className="w-full max-w-[220px]" size="sm">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_CATEGORY_VALUE}>None</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCategory ? (
            <CategoryColorSwatch
              color={selectedCategory.color}
              className="size-3"
              label={selectedCategory.name}
            />
          ) : null}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => onCreateCategory(description)}
                disabled={!description}
                aria-label="Create category from description"
              >
                <Plus />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create category</TooltipContent>
          </Tooltip>
        </div>
      );
    },
  };
}

function getBaseColumns(
  categories: ImportCategoryOption[],
  onCategoryChange: (rowIndex: number, categoryId: string | null) => void,
  onCreateCategory: (description: string) => void,
  onOverrideDuplicate: (rowIndex: number) => void,
): ColumnDef<PreviewRow>[] {
  return [
    createValidationColumn(onOverrideDuplicate),
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
      header: () => <div className={TABLE_MONEY_CELL_CLASS}>Value</div>,
      cell: ({ row }) => (
        <TableMoneyCell value={row.getValue("value")} />
      ),
    },
  ];
}

const balanceColumn: ColumnDef<PreviewRow> = {
  accessorKey: "balance",
  header: () => <div className={TABLE_MONEY_CELL_CLASS}>Balance</div>,
  cell: ({ row }) => <TableMoneyCell value={row.getValue("balance")} />,
};

export function getPreviewColumns(
  includeBalance: boolean,
  categories: ImportCategoryOption[],
  onCategoryChange: (rowIndex: number, categoryId: string | null) => void,
  onCreateCategory: (description: string) => void,
  onOverrideDuplicate: (rowIndex: number) => void,
): ColumnDef<PreviewRow>[] {
  const columns = getBaseColumns(
    categories,
    onCategoryChange,
    onCreateCategory,
    onOverrideDuplicate,
  );

  if (includeBalance) {
    return [...columns, balanceColumn];
  }

  return columns;
}
