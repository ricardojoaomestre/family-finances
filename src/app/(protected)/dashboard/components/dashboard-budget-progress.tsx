'use client';

import Link from 'next/link';
import { PiggyBankIcon } from 'lucide-react';

import { CategoryIcon } from '@/components/categories/category-icon';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getBudgetProgressValue } from '@/lib/budgets/compute-category-budget-usage';
import type { CategoryBudgetProgressRow } from '@/lib/budgets/get-category-budget-progress';
import { cn } from '@/lib/utils';

type DashboardBudgetProgressProps = {
  rows: CategoryBudgetProgressRow[];
  isLoading?: boolean;
};

export function DashboardBudgetProgress({
  rows,
  isLoading = false,
}: DashboardBudgetProgressProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budgets</CardTitle>
          <CardDescription>Monthly spending vs budget</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBankIcon className="size-4" />
            Budgets
          </CardTitle>
          <CardDescription>
            Track monthly spending against category limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            No budgets configured yet.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings/budgets">Set up budgets</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <PiggyBankIcon className="size-4" />
            Budgets
          </CardTitle>
          <CardDescription>Monthly spending vs budget</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/settings/budgets">Manage</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {rows.map((row) => (
          <div key={row.categoryId} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <CategoryIcon
                  icon={row.categoryIcon}
                  color={row.categoryColor}
                  className="size-8 shrink-0 rounded-lg [&_svg]:size-3.5"
                />
                <p className="truncate text-sm font-medium">{row.categoryName}</p>
              </div>
              <p
                className={cn(
                  'shrink-0 text-sm font-mono tabular-nums',
                  row.usage.isOverBudget
                    ? 'text-destructive'
                    : 'text-muted-foreground',
                )}
              >
                {row.usage.spentAmount} / {row.budgetAmount}
              </p>
            </div>
            <Progress
              value={getBudgetProgressValue(row.usage.percentUsed)}
              className={cn(
                row.usage.isOverBudget &&
                  '[&_[data-slot=progress-indicator]]:bg-destructive',
              )}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
