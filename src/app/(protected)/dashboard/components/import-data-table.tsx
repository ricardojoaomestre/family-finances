'use client';

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { TableMoneyCell } from '@/components/data-table/table-money-cell';
import { Checkbox } from '@/components/ui/checkbox';
import { DATA_TABLE_DEFAULT_PAGE_SIZE } from '@/lib/data-table/pagination';
import { DataTableLoadingOverlay } from '@/components/data-table/data-table-loading-overlay';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ImportDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  tableClassName?: string;
  isLoading?: boolean;
  paginate?: boolean;
  manualPagination?: boolean;
  rowCount?: number;
  pageCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  summaryFooter?: {
    label: string;
    value: string | number;
  };
  enableRowSelection?: boolean;
  getRowId?: (row: TData) => string;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  selectAllInDataset?: boolean;
  onSelectAllInDatasetChange?: (selected: boolean) => void;
  selectAllBannerLabel?: string;
}

export function ImportDataTable<TData, TValue>({
  columns,
  data,
  tableClassName,
  isLoading = false,
  paginate = true,
  manualPagination = false,
  rowCount,
  pageCount,
  pagination: controlledPagination,
  onPaginationChange,
  summaryFooter,
  enableRowSelection = false,
  getRowId,
  rowSelection = {},
  onRowSelectionChange,
  selectAllInDataset = false,
  onSelectAllInDatasetChange,
  selectAllBannerLabel = 'in this list',
}: ImportDataTableProps<TData, TValue>) {
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DATA_TABLE_DEFAULT_PAGE_SIZE,
  });

  const pagination = controlledPagination ?? internalPagination;
  const handlePaginationChange = onPaginationChange ?? setInternalPagination;
  const usePagination = paginate;
  const useRowSelection = enableRowSelection && getRowId != null;

  const resolvedColumns = useMemo(() => {
    if (!useRowSelection || !getRowId) {
      return columns;
    }

    const selectColumn: ColumnDef<TData, TValue> = {
      id: 'select',
      header: ({ table }) => {
        const allPageSelected = table.getIsAllPageRowsSelected();
        const somePageSelected = table.getIsSomePageRowsSelected();
        const checked = selectAllInDataset || allPageSelected;
        const indeterminate =
          !selectAllInDataset && somePageSelected && !allPageSelected;

        return (
          <Checkbox
            checked={indeterminate ? 'indeterminate' : checked}
            onCheckedChange={(value) => {
              if (selectAllInDataset) {
                onSelectAllInDatasetChange?.(false);
                table.setRowSelection({});
                return;
              }

              table.toggleAllPageRowsSelected(value === true);
            }}
            aria-label="Select page"
          />
        );
      },
      cell: ({ row, table }) => {
        const isSelected = selectAllInDataset || row.getIsSelected();
        const rowId = getRowId(row.original);

        return (
          <Checkbox
            checked={isSelected}
            onCheckedChange={(value) => {
              if (selectAllInDataset && value === false) {
                onSelectAllInDatasetChange?.(false);
                const nextSelection: RowSelectionState = {};

                for (const dataRow of data) {
                  const id = getRowId(dataRow);

                  if (id !== rowId) {
                    nextSelection[id] = true;
                  }
                }

                table.setRowSelection(nextSelection);
                return;
              }

              row.toggleSelected(value === true);
            }}
            aria-label="Select row"
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
      meta: {
        headerClassName: 'w-10 pr-0',
        cellClassName: 'w-10 pr-0',
      },
    };

    return [selectColumn, ...columns];
  }, [
    columns,
    data,
    getRowId,
    onSelectAllInDatasetChange,
    selectAllInDataset,
    useRowSelection,
  ]);

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel:
      usePagination && !manualPagination ? getPaginationRowModel() : undefined,
    manualPagination: usePagination && manualPagination,
    pageCount: usePagination ? pageCount : undefined,
    rowCount: usePagination && manualPagination ? rowCount : undefined,
    onPaginationChange: usePagination ? handlePaginationChange : undefined,
    enableRowSelection: useRowSelection,
    getRowId: useRowSelection ? (row) => getRowId!(row) : undefined,
    onRowSelectionChange: useRowSelection ? onRowSelectionChange : undefined,
    state: {
      ...(usePagination ? { pagination } : {}),
      ...(useRowSelection ? { rowSelection } : {}),
    },
  });

  const resolvedRowCount = manualPagination
    ? (rowCount ?? 0)
    : table.getFilteredRowModel().rows.length;
  const resolvedPageCount = Math.max(
    1,
    manualPagination ? (pageCount ?? 1) : table.getPageCount(),
  );
  const pageRowCount = table.getRowModel().rows.length;
  const showSelectAllBanner =
    useRowSelection &&
    !selectAllInDataset &&
    pageRowCount > 0 &&
    table.getIsAllPageRowsSelected() &&
    data.length > pageRowCount;

  return (
    <div className="flex flex-col gap-0">
      {showSelectAllBanner ? (
        <div className="rounded-t-md border border-b-0 bg-muted/50 px-4 py-2 text-center text-sm">
          All {pageRowCount} on this page selected.{' '}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => onSelectAllInDatasetChange?.(true)}
          >
            Select all {data.length} {selectAllBannerLabel}
          </button>
        </div>
      ) : null}

      <DataTableLoadingOverlay
        isLoading={isLoading}
        className={
          showSelectAllBanner
            ? 'overflow-hidden rounded-b-md border border-t-0'
            : 'overflow-hidden rounded-md border'
        }
      >
        <Table className={tableClassName}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.columnDef.meta?.headerClassName}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={
                    selectAllInDataset || row.getIsSelected()
                      ? 'selected'
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.cellClassName}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={resolvedColumns.length} className="p-0">
                  <Empty className="border-0 py-12">
                    <EmptyHeader>
                      <EmptyTitle>No results</EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {summaryFooter || usePagination ? (
            <TableFooter className="bg-transparent">
              {summaryFooter ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={Math.max(1, resolvedColumns.length - 1)}
                    className="text-base font-semibold"
                  >
                    {summaryFooter.label}
                  </TableCell>
                  <TableCell>
                    <TableMoneyCell
                      value={summaryFooter.value}
                      className="text-xl font-semibold"
                    />
                  </TableCell>
                </TableRow>
              ) : null}
              {usePagination ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={resolvedColumns.length} className="p-0">
                    <DataTablePagination
                      rowCount={resolvedRowCount}
                      pageIndex={pagination.pageIndex}
                      pageSize={pagination.pageSize}
                      pageCount={resolvedPageCount}
                      onPageChange={(pageIndex) =>
                        handlePaginationChange((current) => ({
                          ...current,
                          pageIndex,
                        }))
                      }
                      onPageSizeChange={(pageSize) =>
                        handlePaginationChange({ pageIndex: 0, pageSize })
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableFooter>
          ) : null}
        </Table>
      </DataTableLoadingOverlay>
    </div>
  );
}

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}
