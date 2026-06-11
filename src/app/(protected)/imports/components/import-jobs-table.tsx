'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { ImportJobsTableFilters } from '@/app/(protected)/imports/components/import-jobs-table-filters';
import {
  DEFAULT_IMPORT_JOB_FILTERS,
  filterImportJobs,
  type ImportJobFilters,
} from '@/app/(protected)/imports/lib/filter-import-jobs';
import { ImportDataTable } from '@/app/(protected)/dashboard/components/import-data-table';
import { Badge } from '@/components/ui/badge';
import { formatDisplayDate, formatImportStatus } from '@/lib/formatters';
import type { ImportJobRow } from '@/lib/imports/get-imports';
import { getMerchantLabelOrSlug } from '@/lib/merchants';
import { importStatusBadgeVariant } from '@/lib/status-badge';

const columns: ColumnDef<ImportJobRow>[] = [
  {
    accessorKey: 'importedAt',
    header: 'Date',
    cell: ({ row }) => formatDisplayDate(row.original.importedAt),
  },
  {
    accessorKey: 'merchant',
    header: 'Merchant',
    cell: ({ row }) => (
      <Link
        href={`/imports/${row.original.id}`}
        className="text-primary underline-offset-4 hover:underline"
      >
        {getMerchantLabelOrSlug(row.original.merchant)}
      </Link>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={importStatusBadgeVariant(row.original.status)}>
        {formatImportStatus(row.original.status)}
      </Badge>
    ),
  },
  {
    accessorKey: 'rowCount',
    header: () => <div className="text-right">Rows</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">{row.original.rowCount}</div>
    ),
    meta: {
      headerClassName: 'hidden sm:table-cell',
      cellClassName: 'hidden sm:table-cell',
    },
  },
  {
    accessorKey: 'filename',
    header: 'Filename',
    meta: {
      headerClassName: 'hidden w-full md:table-cell',
      cellClassName: 'hidden w-full md:table-cell',
    },
    cell: ({ row }) => (
      <span className="block truncate text-muted-foreground">
        {row.original.filename}
      </span>
    ),
  },
];

type ImportJobsTableProps = {
  data: ImportJobRow[];
  paginate?: boolean;
};

function getImportJobRowClassName(row: ImportJobRow) {
  if (row.rowCount === 0) {
    return 'bg-muted/50 hover:bg-muted/50 text-muted-foreground italic [&_a]:text-inherit [&_a:hover]:text-inherit **:data-[slot=badge]:border-border **:data-[slot=badge]:bg-muted **:data-[slot=badge]:text-muted-foreground';
  }

  return undefined;
}

export function ImportJobsTable({ data, paginate = true }: ImportJobsTableProps) {
  const [filters, setFilters] = useState<ImportJobFilters>(
    DEFAULT_IMPORT_JOB_FILTERS,
  );

  const filteredData = useMemo(
    () => filterImportJobs(data, filters),
    [data, filters],
  );

  return (
    <div className="flex flex-col gap-4">
      <ImportJobsTableFilters filters={filters} onFiltersChange={setFilters} />
      <ImportDataTable
        columns={columns}
        data={filteredData}
        paginate={paginate}
        getRowClassName={getImportJobRowClassName}
        renderMobileCard={({ original: job }) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                href={`/imports/${job.id}`}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {getMerchantLabelOrSlug(job.merchant)}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDisplayDate(job.importedAt)} · {job.rowCount}{' '}
                {job.rowCount === 1 ? 'row' : 'rows'}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {job.filename}
              </p>
            </div>
            <Badge variant={importStatusBadgeVariant(job.status)}>
              {formatImportStatus(job.status)}
            </Badge>
          </div>
        )}
      />
    </div>
  );
}
