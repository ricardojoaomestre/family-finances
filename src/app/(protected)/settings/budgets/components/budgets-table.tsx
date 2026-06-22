'use client';

import { PencilIcon, Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CategoryIcon } from '@/components/categories/category-icon';
import type { BudgetRow } from '@/lib/budgets/get-budgets';

type BudgetsTableProps = {
  budgets: BudgetRow[];
  onEdit: (budget: BudgetRow) => void;
  onDelete: (budget: BudgetRow) => void;
  isPending?: boolean;
};

export function BudgetsTable({
  budgets,
  onEdit,
  onDelete,
  isPending = false,
}: BudgetsTableProps) {
  if (budgets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No budgets yet. Add a monthly limit for a spending category.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Monthly budget</TableHead>
          <TableHead className="w-24 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {budgets.map((budget) => (
          <TableRow key={budget.id}>
            <TableCell>
              <div className="flex items-center gap-2.5">
                <CategoryIcon
                  icon={budget.categoryIcon}
                  color={budget.categoryColor}
                  className="size-8 shrink-0 rounded-lg [&_svg]:size-3.5"
                />
                <span className="font-medium">{budget.categoryName}</span>
              </div>
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {budget.amount}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(budget)}
                  disabled={isPending}
                  aria-label={`Edit ${budget.categoryName} budget`}
                >
                  <PencilIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(budget)}
                  disabled={isPending}
                  aria-label={`Delete ${budget.categoryName} budget`}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
