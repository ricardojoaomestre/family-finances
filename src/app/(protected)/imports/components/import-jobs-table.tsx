'use client';

import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';

import { ImportDataTable } from '@/app/(protected)/dashboard/components/import-data-table';
import { Badge } from '@/components/ui/badge';
import { formatDisplayDate, formatImportStatus } from '@/lib/formatters';
import type { ImportJobRow } from '@/lib/imports/get-imports';
import { getMerchantLabelOrSlug } from '@/lib/merchants';
import { importStatusBadgeVariant } from '@/lib/status-badge';

const columns: ColumnDef<ImportJobRow>[] = [
  {
    accessorKey: 'filename',
    header: 'Filename',
    cell: ({ row }) => (
      <Link
        href={`/imports/${row.original.id}`}
        className="text-primary underline-offset-4 hover:underline"
      >
        {row.original.filename}
      </Link>
    ),
  },
  {
    accessorKey: 'merchant',
    header: 'Merchant',
    cell: ({ row }) => getMerchantLabelOrSlug(row.original.merchant),
  },
  {
    accessorKey: 'importedAt',
    header: 'Date',
    cell: ({ row }) => formatDisplayDate(row.original.importedAt),
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
  },
];

type ImportJobsTableProps = {
  data: ImportJobRow[];
  paginate?: boolean;
};

export function ImportJobsTable({ data, paginate = true }: ImportJobsTableProps) {
  return <ImportDataTable columns={columns} data={data} paginate={paginate} />;
}
