'use client';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { DATA_TABLE_PAGE_SIZE_OPTIONS } from '@/lib/data-table/pagination';

type DataTablePaginationProps = {
  rowCount: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function DataTablePagination({
  rowCount,
  pageIndex,
  pageSize,
  pageCount,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const rowLabel = rowCount === 1 ? 'row' : 'rows';

  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-3 max-sm:flex-wrap">
      <p className="text-sm text-muted-foreground">
        {rowCount.toLocaleString()} {rowLabel}
      </p>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Combobox
            size="sm"
            className="w-[72px]"
            aria-label="Rows per page"
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            searchPlaceholder="Search…"
            options={DATA_TABLE_PAGE_SIZE_OPTIONS.map((size) => ({
              value: String(size),
              label: String(size),
            }))}
          />
        </div>
        <p className="text-center text-sm text-muted-foreground sm:min-w-[88px]">
          Page {pageIndex + 1} of {pageCount}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="hidden sm:inline-flex"
            aria-label="First page"
            disabled={pageIndex <= 0}
            onClick={() => onPageChange(0)}
          >
            <ChevronsLeftIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={pageIndex <= 0}
            onClick={() => onPageChange(pageIndex - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => onPageChange(pageIndex + 1)}
          >
            <ChevronRightIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="hidden sm:inline-flex"
            aria-label="Last page"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => onPageChange(pageCount - 1)}
          >
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
