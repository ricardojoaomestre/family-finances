'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { MonthReportCategoryDetailSheet } from '@/app/(protected)/report/new/components/month-report-category-detail-sheet';
import { ImportDataTable } from '@/app/(protected)/dashboard/components/import-data-table';
import {
  TABLE_MONEY_CELL_CLASS,
  TableMoneyCell,
} from '@/components/data-table/table-money-cell';
import { Button } from '@/components/ui/button';
import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';
import { cn } from '@/lib/utils';

type CategoryOption = {
  id: string;
  name: string;
};

type MonthReportCategoryTotalsTableProps = {
  data: MonthReportCategoryTotal[];
  dateFrom: string;
  dateTo: string;
  categories: CategoryOption[];
};

export function MonthReportCategoryTotalsTable({
  data,
  dateFrom,
  dateTo,
  categories,
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

          return categoryName;
        },
      },
      {
        accessorKey: 'total',
        header: () => <div className={TABLE_MONEY_CELL_CLASS}>Total</div>,
        meta: {
          headerClassName: cn(TABLE_MONEY_CELL_CLASS, 'w-36'),
          cellClassName: cn(TABLE_MONEY_CELL_CLASS, 'w-36'),
        },
        cell: ({ row }) => <TableMoneyCell value={row.getValue('total')} />,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        meta: {
          headerClassName: 'w-36 text-right',
          cellClassName: 'w-36 text-right',
        },
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategory(row.original);
                setSheetOpen(true);
              }}
            >
              View details
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <ImportDataTable
        columns={columns}
        data={data}
        paginate={false}
        tableClassName="w-full table-fixed"
      />
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
      />
    </>
  );
}
