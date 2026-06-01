import { MonthReportView } from '@/app/(protected)/report/new/components/month-report-view';
import { getCategories } from '@/lib/categories/get-categories';
import { getMonthReportCategoryTotals } from '@/lib/reports/get-month-report-category-totals';
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

  const header = (
    <div>
      <h1 className="text-2xl font-semibold">Month processing</h1>
      <p className="text-sm text-muted-foreground">
        Filter transactions by date range and review totals by category
      </p>
    </div>
  );

  if (!hasDatesInUrl) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        {header}
        <MonthReportView listParams={listParams} />
      </div>
    );
  }

  const validation = validateReportDateRange(
    listParams.dateFrom,
    listParams.dateTo,
  );

  if (!validation.ok) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        {header}
        <MonthReportView
          listParams={listParams}
          validationError={validation.message}
        />
      </div>
    );
  }

  const resolvedListParams = {
    dateFrom: validation.dateFrom,
    dateTo: validation.dateTo,
  };

  const [categoryTotals, categoryRows] = await Promise.all([
    getMonthReportCategoryTotals(
      validation.dateFrom,
      validation.dateTo,
    ),
    getCategories(),
  ]);

  const categories = categoryRows.map(({ id, name }) => ({ id, name }));

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {header}
      <MonthReportView
        listParams={resolvedListParams}
        categoryTotals={categoryTotals}
        categories={categories}
      />
    </div>
  );
}
