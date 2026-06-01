'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { MonthReportCategoryTotalsTable } from '@/app/(protected)/report/new/components/month-report-category-totals-table';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';
import { buildMonthReportSearchParams } from '@/lib/reports/month-report-search-params';
import type { MonthReportSearchParams } from '@/lib/reports/month-report-search-params';
import { validateReportDateRange } from '@/lib/reports/validate-report-date-range';

type CategoryOption = {
  id: string;
  name: string;
};

type MonthReportViewProps = {
  listParams: MonthReportSearchParams;
  validationError?: string;
  categoryTotals?: MonthReportCategoryTotal[];
  categories?: CategoryOption[];
};

export function MonthReportView({
  listParams,
  validationError: serverValidationError,
  categoryTotals,
  categories = [],
}: MonthReportViewProps) {
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState(listParams.dateFrom);
  const [dateTo, setDateTo] = useState(listParams.dateTo);
  const [clientError, setClientError] = useState<string | null>(null);

  const validationError = clientError ?? serverValidationError;
  const showDashboard = categoryTotals !== undefined;

  function handleRun() {
    const validation = validateReportDateRange(dateFrom, dateTo);

    if (!validation.ok) {
      setClientError(validation.message);
      return;
    }

    setClientError(null);
    router.push(
      `/report/new${buildMonthReportSearchParams({
        dateFrom: validation.dateFrom,
        dateTo: validation.dateTo,
      })}`,
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end gap-3">
        <Field className="w-full sm:w-auto">
          <FieldLabel htmlFor="report-date-from">Start date</FieldLabel>
          <Input
            id="report-date-from"
            type="date"
            className="w-full sm:w-36"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </Field>
        <Field className="w-full sm:w-auto">
          <FieldLabel htmlFor="report-date-to">End date</FieldLabel>
          <Input
            id="report-date-to"
            type="date"
            className="w-full sm:w-36"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </Field>
        <Button type="button" onClick={handleRun}>
          Run
        </Button>
        <Button type="button" variant="ghost" asChild>
          <Link href="/reports">Back to reports</Link>
        </Button>
      </div>

      {validationError ? (
        <p className="text-sm text-destructive" role="alert">
          {validationError}
        </p>
      ) : null}

      {showDashboard ? (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold">By category</h2>
            <p className="text-sm text-muted-foreground">
              Totals for transactions between {listParams.dateFrom} and{' '}
              {listParams.dateTo}
            </p>
          </div>
          {categoryTotals.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>No transactions in range</EmptyTitle>
                <EmptyDescription>
                  Try a different date range.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <MonthReportCategoryTotalsTable
              data={categoryTotals}
              dateFrom={listParams.dateFrom}
              dateTo={listParams.dateTo}
              categories={categories}
            />
          )}
        </section>
      ) : null}
    </div>
  );
}
