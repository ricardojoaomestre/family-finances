import {
  MonthReportView,
  NEW_REPORT_TITLE,
} from '@/app/(protected)/reports/components/month-report-view';
import { loadMonthReportData } from '@/lib/reports/load-month-report-data';
import { parseMonthReportSearchParams } from '@/lib/reports/month-report-search-params';
import { validateReportDateRange } from '@/lib/reports/validate-report-date-range';

type NewReportPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewReportPage({
  searchParams,
}: NewReportPageProps) {
  const resolvedSearchParams = await searchParams;
  const listParams = parseMonthReportSearchParams(resolvedSearchParams);
  const hasDatesInUrl = listParams.dateFrom !== '' || listParams.dateTo !== '';

  if (!hasDatesInUrl) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <MonthReportView
          mode="new"
          listParams={listParams}
          initialTitle={NEW_REPORT_TITLE}
        />
      </div>
    );
  }

  const validation = validateReportDateRange(
    listParams.dateFrom,
    listParams.dateTo,
  );

  if (!validation.ok) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <MonthReportView
          mode="new"
          listParams={listParams}
          initialTitle={NEW_REPORT_TITLE}
          validationError={validation.message}
        />
      </div>
    );
  }

  const resolvedListParams = {
    dateFrom: validation.dateFrom,
    dateTo: validation.dateTo,
  };

  const {
    categoryTotals,
    categories,
    primaryAccountBalanceBeforeIncome,
    spendingCategoryAverages,
  } = await loadMonthReportData(validation.dateFrom, validation.dateTo);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <MonthReportView
        key={`${resolvedListParams.dateFrom}-${resolvedListParams.dateTo}`}
        mode="new"
        listParams={resolvedListParams}
        initialTitle={NEW_REPORT_TITLE}
        categoryTotals={categoryTotals}
        spendingCategoryAverages={spendingCategoryAverages}
        primaryAccountBalanceBeforeIncome={primaryAccountBalanceBeforeIncome}
        categories={categories}
      />
    </div>
  );
}
