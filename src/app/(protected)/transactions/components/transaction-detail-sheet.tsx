'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';

import { getTransactionDetails } from '@/app/(protected)/transactions/actions/get-transaction-details';
import { CategoryPill } from '@/components/categories/category-pill';
import { getMoneyValueColorClass } from '@/components/data-table/table-money-cell';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { jetbrainsMono } from '@/lib/fonts';
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatDisplayNumber,
  formatImportStatus,
} from '@/lib/formatters';
import { getMerchantLabelOrSlug } from '@/lib/merchants';
import type { TransactionDetails } from '@/lib/transactions/transaction-details';
import { importStatusBadgeVariant } from '@/lib/status-badge';
import { cn } from '@/lib/utils';

type TransactionDetailSheetProps = {
  transactionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DetailFieldProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

function DetailField({ label, children, className }: DetailFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

function TransactionDetailBody({ transactionId }: { transactionId: string }) {
  const [details, setDetails] = useState<TransactionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getTransactionDetails(transactionId);

      if (!result.ok) {
        setDetails(null);
        setError(result.error);
        return;
      }

      setDetails(result.data);
      setError(null);
    });
  }, [transactionId]);

  const valueColorClass = details
    ? getMoneyValueColorClass(details.value)
    : undefined;

  if (isPending) {
    return <p className="px-1 text-sm text-muted-foreground">Loading…</p>;
  }

  if (error) {
    return (
      <p className="px-1 text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  }

  if (!details) {
    return null;
  }

  return (
          <div className="flex flex-col gap-8 px-1">
            <section className="rounded-xl border bg-muted/40 p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Amount
              </p>
              <p
                className={cn(
                  'mt-2 text-4xl font-semibold tracking-tight tabular-nums',
                  jetbrainsMono.className,
                  valueColorClass,
                )}
              >
                {formatDisplayNumber(details.value)}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {details.categoryName && details.categoryColor ? (
                  <CategoryPill
                    name={details.categoryName}
                    color={details.categoryColor}
                    className="max-w-none text-sm"
                  />
                ) : (
                  <Badge variant="secondary" className="text-sm">
                    Uncategorized
                  </Badge>
                )}
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Description
              </h3>
              <p className="text-base leading-relaxed">{details.description}</p>
            </section>

            <section>
              <dl className="grid gap-5 sm:grid-cols-2">
                <DetailField label="Date">
                  {formatDisplayDate(details.date)}
                </DetailField>
                <DetailField label="Merchant">
                  {getMerchantLabelOrSlug(details.merchant)}
                </DetailField>
              </dl>
            </section>

            <section className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Import job
                  </h3>
                  <Link
                    href={`/imports/${details.importId}`}
                    className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    {details.importFilename}
                    <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Imported {formatDisplayDate(details.importImportedAt)}
                  </p>
                </div>
                <Badge variant={importStatusBadgeVariant(details.importStatus)}>
                  {formatImportStatus(details.importStatus)}
                </Badge>
              </div>
            </section>

            <section className="border-t pt-5">
              <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Record timestamps
              </h3>
              <dl className="grid gap-5 sm:grid-cols-2">
                <DetailField label="Inserted at">
                  {formatDisplayDateTime(details.insertedAt)}
                </DetailField>
                <DetailField label="Updated at">
                  {formatDisplayDateTime(details.updatedAt)}
                </DetailField>
              </dl>
            </section>
          </div>
  );
}

export function TransactionDetailSheet({
  transactionId,
  open,
  onOpenChange,
}: TransactionDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Transaction details</SheetTitle>
          <SheetDescription>
            Full record for this imported transaction.
          </SheetDescription>
        </SheetHeader>

        {open && transactionId ? (
          <TransactionDetailBody
            key={transactionId}
            transactionId={transactionId}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
