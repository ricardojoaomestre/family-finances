'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

import { importSkippedImportRow } from '@/app/(protected)/imports/[id]/actions/import-skipped-import-row';
import { DUPLICATE_IN_FILE_MESSAGE } from '@/lib/imports/duplicate-in-file-message';
import {
  ImportTransactionsTable,
  type ImportTransactionRow,
} from '@/app/(protected)/imports/[id]/components/import-transactions-table';
import {
  ImportSkippedRowsTable,
  type ImportSkippedRow,
} from '@/app/(protected)/imports/[id]/components/import-skipped-rows-table';
import { SkippedImportRowSheet } from '@/app/(protected)/imports/[id]/components/skipped-import-row-sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
} from '@/components/ui/empty';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { ImportStatus } from '@/db/schema';

type ImportDetailTabsProps = {
  importId: string;
  skippedRows: ImportSkippedRow[];
  transactions: ImportTransactionRow[];
  skippedCount: number | null;
  importStatus: ImportStatus;
};

function getMissingRowsEmptyMessage(
  skippedCount: number | null,
  importStatus: ImportStatus,
): string {
  if (skippedCount === 0 || (skippedCount == null && importStatus === 'completed')) {
    return 'No rows were skipped in this import.';
  }

  return 'Skipped row details weren\'t recorded for this import.';
}

export function ImportDetailTabs({
  importId,
  skippedRows: initialSkippedRows,
  transactions: initialTransactions,
  skippedCount: initialSkippedCount,
  importStatus,
}: ImportDetailTabsProps) {
  const router = useRouter();
  const [, startRefresh] = useTransition();
  const [skippedRows, setSkippedRows] = useState(initialSkippedRows);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [skippedCount, setSkippedCount] = useState(initialSkippedCount);
  const [importingRowId, setImportingRowId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<ImportSkippedRow | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [importPromptRow, setImportPromptRow] = useState<ImportSkippedRow | null>(
    null,
  );
  const [duplicateOverrideRow, setDuplicateOverrideRow] =
    useState<ImportSkippedRow | null>(null);

  const defaultTab = (skippedCount ?? skippedRows.length) > 0 ? 'missing' : 'transactions';
  const missingRowsTabCount = skippedCount ?? skippedRows.length;

  const refreshPage = useCallback(() => {
    startRefresh(() => {
      router.refresh();
    });
  }, [router]);

  const applyImportedRow = useCallback(
    (skippedRowId: string, transaction: ImportTransactionRow) => {
      setSkippedRows((current) =>
        current.filter((row) => row.id !== skippedRowId),
      );
      setTransactions((current) => [transaction, ...current]);
      setSkippedCount((current) => Math.max(0, (current ?? 1) - 1));
    },
    [],
  );

  const handleImportRow = useCallback(
    async (row: ImportSkippedRow, options?: { allowDuplicateInFile?: boolean }) => {
      setActionError(null);
      setImportingRowId(row.id);

      const result = await importSkippedImportRow({
        importId,
        skippedRowId: row.id,
        allowDuplicateInFile: options?.allowDuplicateInFile,
      });

      setImportingRowId(null);

      if (!result.ok) {
        if (result.requiresDuplicateInFileOverride) {
          setDuplicateOverrideRow(row);
          return;
        }

        setActionError(result.error);
        return;
      }

      setDuplicateOverrideRow(null);
      applyImportedRow(row.id, result.transaction);
      refreshPage();
    },
    [applyImportedRow, importId, refreshPage],
  );

  const handleEditRow = useCallback((row: ImportSkippedRow) => {
    setActionError(null);
    setEditingRow(row);
    setEditSheetOpen(true);
  }, []);

  const handleRowSaved = useCallback(
    ({
      row,
      isValid,
    }: {
      row: ImportSkippedRow;
      isValid: boolean;
    }) => {
      setSkippedRows((current) =>
        current.map((existing) => (existing.id === row.id ? row : existing)),
      );

      if (isValid) {
        setImportPromptRow(row);
      }
    },
    [],
  );

  const handleConfirmImportAfterEdit = useCallback(async () => {
    if (!importPromptRow) {
      return;
    }

    const row = importPromptRow;
    setImportPromptRow(null);
    await handleImportRow(row);
  }, [handleImportRow, importPromptRow]);

  const handleConfirmDuplicateOverride = useCallback(async () => {
    if (!duplicateOverrideRow) {
      return;
    }

    const row = duplicateOverrideRow;
    setDuplicateOverrideRow(null);
    await handleImportRow(row, { allowDuplicateInFile: true });
  }, [duplicateOverrideRow, handleImportRow]);

  return (
    <TooltipProvider>
      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="missing">
            Missing rows ({missingRowsTabCount})
          </TabsTrigger>
          <TabsTrigger value="transactions">
            Transactions ({transactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="missing">
          {skippedRows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyDescription>
                  {getMissingRowsEmptyMessage(skippedCount, importStatus)}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ImportSkippedRowsTable
              data={skippedRows}
              onImport={handleImportRow}
              onEdit={handleEditRow}
              isImportingId={importingRowId}
            />
          )}
        </TabsContent>

        <TabsContent value="transactions">
          {transactions.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyDescription>
                  No transactions in this import.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ImportTransactionsTable data={transactions} />
          )}
        </TabsContent>
      </Tabs>

      <SkippedImportRowSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        importId={importId}
        row={editingRow}
        onSaved={handleRowSaved}
      />

      <AlertDialog
        open={importPromptRow != null}
        onOpenChange={(open) => {
          if (!open) {
            setImportPromptRow(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import this row?</AlertDialogTitle>
            <AlertDialogDescription>
              This row is valid. Import it into transactions for this job?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImportAfterEdit}>
              Import row
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={duplicateOverrideRow != null}
        onOpenChange={(open) => {
          if (!open) {
            setDuplicateOverrideRow(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import duplicate row?</AlertDialogTitle>
            <AlertDialogDescription>
              {DUPLICATE_IN_FILE_MESSAGE} Import anyway if you need both
              transactions recorded (for example, a charge and a refund on the
              same day and amount).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDuplicateOverride}>
              Import anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
