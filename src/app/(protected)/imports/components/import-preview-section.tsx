'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { ImportDataTable } from '@/app/(protected)/dashboard/components/import-data-table';
import type { PreviewRow } from '@/app/(protected)/dashboard/components/import-columns';
import { Button } from '@/components/ui/button';

type ImportPreviewSectionProps = {
  previewLabel: string;
  summaryParts: string[];
  previewRows: PreviewRow[];
  columns: ColumnDef<PreviewRow>[];
  isConfirming: boolean;
  isRematching: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  alert?: React.ReactNode;
};

export function ImportPreviewSection({
  previewLabel,
  summaryParts,
  previewRows,
  columns,
  isConfirming,
  isRematching,
  onCancel,
  onConfirm,
  alert,
}: ImportPreviewSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      {alert}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{previewLabel}</p>
        <p className="text-sm text-muted-foreground">
          {summaryParts.join(' · ')}
        </p>
      </div>
      <ImportDataTable
        columns={columns}
        data={previewRows}
        paginate={false}
        tableClassName={isRematching ? 'opacity-60' : undefined}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isConfirming}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isConfirming || isRematching}
          onClick={onConfirm}
        >
          {isConfirming ? 'Confirming…' : 'Confirm import'}
        </Button>
      </div>
    </div>
  );
}
