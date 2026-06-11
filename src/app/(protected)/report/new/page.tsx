import {
  MonthReportView,
  NEW_REPORT_TITLE,
} from '@/app/(protected)/reports/components/month-report-view';
import { getCategories } from '@/lib/categories/get-categories';
import { getSpendingCategoryMonthAverages } from '@/lib/reports/get-spending-category-month-averages';
import { getMonthReportCategoryTotals } from '@/lib/reports/get-month-report-category-totals';
import { getMonthReportBpiBalanceBeforeIncome } from '@/lib/reports/get-month-report-bpi-balance-before-income';
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

  const [categoryTotals, categoryRows, bpiBalanceBeforeIncome, spendingCategoryAverages] =
    await Promise.all([
      getMonthReportCategoryTotals(
        validation.dateFrom,
        validation.dateTo,
      ),
      getCategories(),
      getMonthReportBpiBalanceBeforeIncome(
        validation.dateFrom,
        validation.dateTo,
      ),
      getSpendingCategoryMonthAverages(validation.dateFrom),
    ]);

  const categories = categoryRows.map(({ id, name, color, icon }) => ({
    id,
    name,
    color,
    icon,
  }));

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <MonthReportView
        key={`${resolvedListParams.dateFrom}-${resolvedListParams.dateTo}`}
        mode="new"
        listParams={resolvedListParams}
        initialTitle={NEW_REPORT_TITLE}
        categoryTotals={categoryTotals}
        spendingCategoryAverages={spendingCategoryAverages}
        bpiBalanceBeforeIncome={bpiBalanceBeforeIncome}
        categories={categories}
      />
    </div>
  );
}
