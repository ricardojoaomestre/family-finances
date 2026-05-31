'use client';

import {
  ImportTransactionsTable,
  type ImportTransactionRow,
} from '@/app/(protected)/imports/[id]/components/import-transactions-table';
import {
  ImportSkippedRowsTable,
  type ImportSkippedRow,
} from '@/app/(protected)/imports/[id]/components/import-skipped-rows-table';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
} from '@/components/ui/empty';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';

type ImportDetailTabsProps = {
  skippedRows: ImportSkippedRow[];
  transactions: ImportTransactionRow[];
  skippedCount: number | null;
  importStatus: string;
};

function getMissingRowsEmptyMessage(
  skippedCount: number | null,
  importStatus: string,
): string {
  if (skippedCount === 0 || (skippedCount == null && importStatus === 'completed')) {
    return 'No rows were skipped in this import.';
  }

  return 'Skipped row details weren\'t recorded for this import.';
}

export function ImportDetailTabs({
  skippedRows,
  transactions,
  skippedCount,
  importStatus,
}: ImportDetailTabsProps) {
  const defaultTab = (skippedCount ?? 0) > 0 ? 'missing' : 'transactions';
  const missingRowsTabCount = skippedCount ?? skippedRows.length;

  return (
    <TooltipProvider>
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
            <ImportSkippedRowsTable data={skippedRows} />
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
    </TooltipProvider>
  );
}
