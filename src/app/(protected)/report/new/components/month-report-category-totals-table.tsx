'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';

import { MonthReportCategoryDetailSheet } from '@/app/(protected)/report/new/components/month-report-category-detail-sheet';
import { SpendingComparisonGauge } from '@/app/(protected)/reports/components/spending-comparison-gauge';
import { ImportDataTable } from '@/app/(protected)/dashboard/components/import-data-table';
import {
  TABLE_MONEY_CELL_CLASS,
  TABLE_MONEY_HEADER_CLASS,
  TableMoneyCell,
} from '@/components/data-table/table-money-cell';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CategoryPill } from '@/components/categories/category-pill';
import type { CategoryColorToken } from '@/lib/categories/category-colors';
import type { CategoryIconName } from '@/lib/categories/category-icons';
import { categoryTypeLabels } from '@/lib/categories/category-type';
import { computeSpendingComparison } from '@/lib/reports/compute-spending-comparison';
import type { SpendingCategoryAverage } from '@/lib/reports/get-spending-category-month-averages';
import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';
import type { MonthReportCategoryTableType } from '@/lib/reports/group-month-report-category-totals';
import { sumCategoryTotals } from '@/lib/reports/sum-category-totals';
import { cn } from '@/lib/utils';

type CategoryOption = {
  id: string;
  name: string;
  color: CategoryColorToken;
  icon: CategoryIconName;
};

const sectionTitles: Record<MonthReportCategoryTableType, string> = {
  income: categoryTypeLabels.income,
  spending: categoryTypeLabels.spending,
  saving: categoryTypeLabels.saving,
  transfer: categoryTypeLabels.transfer,
};

type MonthReportCategoryTotalsTableProps = {
  tableType: MonthReportCategoryTableType;
  data: MonthReportCategoryTotal[];
  dateFrom: string;
  dateTo: string;
  categories: CategoryOption[];
  bankAccounts: Array<{ id: string; label: string }>;
  spendingCategoryAverages?: Record<string, SpendingCategoryAverage>;
};

export function MonthReportCategoryTotalsTable({
  tableType,
  data,
  dateFrom,
  dateTo,
  categories,
  bankAccounts,
  spendingCategoryAverages = {},
}: MonthReportCategoryTotalsTableProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<MonthReportCategoryTotal | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const columns = useMemo<ColumnDef<MonthReportCategoryTotal>[]>(
    () => [
      {
        accessorKey: 'categoryName',
        header: 'Category',
        meta: {
          headerClassName: 'w-full',
          cellClassName: 'w-full',
        },
        cell: ({ row }) => {
          const { categoryId, categoryName } = row.original;

          if (!categoryId) {
            return (
              <span className="text-muted-foreground">Uncategorized</span>
            );
          }

          if (!categoryName) {
            return '—';
          }

          const { categoryColor, categoryIcon } = row.original;

          if (!categoryColor) {
            return categoryName;
          }

          return (
            <CategoryPill
              name={categoryName}
              color={categoryColor}
              icon={categoryIcon ?? 'tag'}
            />
          );
        },
      },
      {
        accessorKey: 'total',
        header: () => <div className={TABLE_MONEY_HEADER_CLASS}>Total</div>,
        meta: {
          headerClassName: cn(TABLE_MONEY_HEADER_CLASS, 'w-32 sm:w-44'),
          cellClassName: cn(TABLE_MONEY_CELL_CLASS, 'w-32 sm:w-44'),
        },
        cell: ({ row }) => {
          const { categoryId, total } = row.original;
          const comparison =
            tableType === 'spending' && categoryId
              ? computeSpendingComparison(
                  total,
                  spendingCategoryAverages[categoryId],
                )
              : { kind: 'hidden' as const };

          return (
            <div className="flex items-center justify-end gap-2">
              <TableMoneyCell value={total} />
              <SpendingComparisonGauge comparison={comparison} />
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        meta: {
          headerClassName: 'w-12 text-right sm:w-36',
          cellClassName: 'w-12 text-right sm:w-36',
        },
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="View details"
              onClick={() => {
                setSelectedCategory(row.original);
                setSheetOpen(true);
              }}
            >
              <span className="hidden sm:inline">View details</span>
              <ChevronRightIcon className="sm:hidden" />
            </Button>
          </div>
        ),
      },
    ],
    [spendingCategoryAverages, tableType],
  );

  const sectionTotal = useMemo(() => sumCategoryTotals(data), [data]);

  if (data.length === 0) {
    return null;
  }

  return (
    <Collapsible className="overflow-hidden rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/50 [&[data-state=open]_svg]:rotate-180">
        <span className="flex min-w-0 items-center gap-2 text-base font-semibold">
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform" />
          {sectionTitles[tableType]}
        </span>
        <TableMoneyCell value={sectionTotal} className="shrink-0" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ImportDataTable
          columns={columns}
          data={data}
          paginate={false}
          tableClassName="w-full table-fixed border-t"
        />
      </CollapsibleContent>
      <MonthReportCategoryDetailSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setSelectedCategory(null);
          }
        }}
        dateFrom={dateFrom}
        dateTo={dateTo}
        category={selectedCategory}
        categories={categories}
        bankAccounts={bankAccounts}
      />
    </Collapsible>
  );
}
