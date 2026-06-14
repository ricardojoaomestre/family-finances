'use client';

import { DownloadIcon, Loader2Icon } from 'lucide-react';
import { useState } from 'react';

import { exportFilteredTransactionsAction } from '@/app/(protected)/transactions/actions/export-filtered-transactions';
import type { TransactionFilters } from '@/app/(protected)/transactions/lib/filter-transactions';
import { Button } from '@/components/ui/button';
import { downloadTextFile } from '@/lib/download-text-file';

type TransactionsFilterExportButtonProps = {
  filters: TransactionFilters;
};

export function TransactionsFilterExportButton({
  filters,
}: TransactionsFilterExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const result = await exportFilteredTransactionsAction(filters);

      if (result.ok) {
        downloadTextFile('transactions-filtered.csv', result.csv);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="secondary"
      className="hidden md:inline-flex"
      onClick={() => void handleExport()}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2Icon className="animate-spin" />
      ) : (
        <DownloadIcon />
      )}
      Export CSV
    </Button>
  );
}
