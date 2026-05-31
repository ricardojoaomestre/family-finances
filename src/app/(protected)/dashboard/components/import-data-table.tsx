'use client';

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
} from '@tanstack/react-table';
import { useState } from 'react';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';
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
}: ImportDataTableProps<TData, TValue>) {
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DATA_TABLE_DEFAULT_PAGE_SIZE,
  });

  const pagination = controlledPagination ?? internalPagination;
  const handlePaginationChange = onPaginationChange ?? setInternalPagination;
  const usePagination = paginate;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel:
      usePagination && !manualPagination ? getPaginationRowModel() : undefined,
    manualPagination: usePagination && manualPagination,
    pageCount: usePagination ? pageCount : undefined,
    rowCount: usePagination && manualPagination ? rowCount : undefined,
    onPaginationChange: usePagination ? handlePaginationChange : undefined,
    state: usePagination ? { pagination } : undefined,
  });

  const resolvedRowCount = manualPagination
    ? (rowCount ?? 0)
    : table.getFilteredRowModel().rows.length;
  const resolvedPageCount = Math.max(
    1,
    manualPagination ? (pageCount ?? 1) : table.getPageCount(),
  );

  return (
    <DataTableLoadingOverlay
      isLoading={isLoading}
      className="overflow-hidden rounded-md border"
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
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cell.column.columnDef.meta?.cellClassName}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="p-0">
                <Empty className="border-0 py-12">
                  <EmptyHeader>
                    <EmptyTitle>No results</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {usePagination ? (
          <TableFooter className="bg-transparent">
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                <DataTablePagination
                  rowCount={resolvedRowCount}
                  pageIndex={pagination.pageIndex}
                  pageSize={pagination.pageSize}
                  pageCount={resolvedPageCount}
                  onPageChange={(pageIndex) =>
                    handlePaginationChange((current) => ({ ...current, pageIndex }))
                  }
                  onPageSizeChange={(pageSize) =>
                    handlePaginationChange({ pageIndex: 0, pageSize })
                  }
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        ) : null}
      </Table>
    </DataTableLoadingOverlay>
  );
}

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}
