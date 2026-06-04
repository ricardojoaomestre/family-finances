'use client';

import { useRef, useState, useTransition } from 'react';

import { importCategories } from '@/app/(protected)/settings/categories/actions/import-categories';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  buildCategoryImportPlan,
  parseCategoryCsvRows,
  type CategoryCsvOptionalColumns,
  type CategoryForImportMatch,
  type CategoryImportCsvRow,
  type CategoryImportPreviewRow,
} from '@/lib/categories/import';

type CategoryImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: CategoryForImportMatch[];
  onImported: (result: {
    skippedDuplicateCount: number;
    inactiveUpdated: { id: string; name: string }[];
  }) => void;
};

export function CategoryImportDialog({
  open,
  onOpenChange,
  existing,
  onImported,
}: CategoryImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<CategoryImportPreviewRow[] | null>(
    null,
  );
  const [csvRows, setCsvRows] = useState<CategoryImportCsvRow[] | null>(null);
  const [csvColumns, setCsvColumns] = useState<CategoryCsvOptionalColumns | null>(
    null,
  );
  const [skippedDuplicateCount, setSkippedDuplicateCount] = useState(0);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isConfirming, startConfirmTransition] = useTransition();

  function resetState() {
    setParseError(null);
    setPreviewRows(null);
    setCsvRows(null);
    setCsvColumns(null);
    setSkippedDuplicateCount(0);
    setConfirmError(null);
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next);

    if (!next) {
      resetState();
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    resetState();

    const content = await file.text();
    const parsed = parseCategoryCsvRows(content);

    if ('error' in parsed) {
      setParseError(parsed.error);
      return;
    }

    const plan = buildCategoryImportPlan(
      existing,
      parsed.rows,
      parsed.columns,
    );

    if (!plan.ok) {
      setParseError(plan.error);
      return;
    }

    setCsvRows(parsed.rows);
    setCsvColumns(parsed.columns);
    setPreviewRows(plan.rows);
    setSkippedDuplicateCount(plan.skippedDuplicateCount);
  }

  function handlePickFile() {
    fileInputRef.current?.click();
  }

  function handleConfirm() {
    if (!csvRows || !csvColumns) {
      return;
    }

    setConfirmError(null);

    startConfirmTransition(async () => {
      const result = await importCategories({ rows: csvRows, columns: csvColumns });

      if (!result.ok) {
        setConfirmError(result.error);
        return;
      }

      onImported({
        skippedDuplicateCount: result.skippedDuplicateCount,
        inactiveUpdated: result.inactiveUpdated,
      });
      handleOpenChange(false);
    });
  }

  const hasPreview = previewRows !== null && previewRows.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] max-w-2xl flex-col gap-4 overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import categories</DialogTitle>
          <DialogDescription>
            Semicolon-separated CSV. Required header: name;regex. Optional:
            type;active;color.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="sr-only"
          onChange={handleFileChange}
        />

        {!hasPreview ? (
          <div className="flex flex-col gap-3">
            <Button type="button" variant="outline" onClick={handlePickFile}>
              Choose CSV file
            </Button>
            {parseError ? (
              <p className="text-sm text-destructive" role="alert">
                {parseError}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            {skippedDuplicateCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                Skipped {skippedDuplicateCount} duplicate row
                {skippedDuplicateCount === 1 ? '' : 's'} in the file.
              </p>
            ) : null}
            <div className="min-h-0 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Regex</TableHead>
                    {csvColumns?.type ? <TableHead>Type</TableHead> : null}
                    {csvColumns?.active ? <TableHead>Active</TableHead> : null}
                    {csvColumns?.color ? <TableHead>Color</TableHead> : null}
                    <TableHead className="w-[120px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, index) => (
                    <TableRow key={`${row.csvName}-${index}`}>
                      <TableCell className="font-medium">{row.csvName}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.normalizedPattern ?? '—'}
                      </TableCell>
                      {csvColumns?.type ? (
                        <TableCell>{row.csvType}</TableCell>
                      ) : null}
                      {csvColumns?.active ? (
                        <TableCell>{row.csvActive}</TableCell>
                      ) : null}
                      {csvColumns?.color ? (
                        <TableCell className="font-mono text-xs">
                          {row.csvColor}
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <Badge variant="secondary">
                          {row.action === 'create' ? 'New' : 'Updates existing'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {confirmError ? (
              <p className="text-sm text-destructive" role="alert">
                {confirmError}
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isConfirming}
          >
            Cancel
          </Button>
          {hasPreview ? (
            <Button type="button" onClick={handleConfirm} disabled={isConfirming}>
              {isConfirming ? 'Importing…' : 'Import'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
