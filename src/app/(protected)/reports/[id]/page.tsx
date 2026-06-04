import { notFound } from 'next/navigation';

import { MonthReportView } from '@/app/(protected)/reports/components/month-report-view';
import { getCategories } from '@/lib/categories/get-categories';
import { getReportById } from '@/lib/reports/get-report-by-id';
import { getSpendingCategoryMonthAverages } from '@/lib/reports/get-spending-category-month-averages';
import { getMonthReportCategoryTotals } from '@/lib/reports/get-month-report-category-totals';
import { getMonthReportBpiBalanceBeforeIncome } from '@/lib/reports/get-month-report-bpi-balance-before-income';
import { parseMonthReportSearchParams } from '@/lib/reports/month-report-search-params';
import { validateReportDateRange } from '@/lib/reports/validate-report-date-range';

type ReportPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportPage({
  params,
  searchParams,
}: ReportPageProps) {
  const { id } = await params;
  const report = await getReportById(id);

  if (!report) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const queryParams = parseMonthReportSearchParams(resolvedSearchParams);
  const dateFrom = queryParams.dateFrom || report.dateFrom;
  const dateTo = queryParams.dateTo || report.dateTo;

  const validation = validateReportDateRange(dateFrom, dateTo);

  if (!validation.ok) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <MonthReportView
          mode="edit"
          reportId={report.id}
          savedReport={report}
          listParams={{ dateFrom, dateTo }}
          initialTitle={report.name}
          validationError={validation.message}
        />
      </div>
    );
  }

  const [categoryTotals, categoryRows, bpiBalanceBeforeIncome, spendingCategoryAverages] =
    await Promise.all([
      getMonthReportCategoryTotals(validation.dateFrom, validation.dateTo),
      getCategories(),
      getMonthReportBpiBalanceBeforeIncome(
        validation.dateFrom,
        validation.dateTo,
      ),
      getSpendingCategoryMonthAverages(validation.dateFrom),
    ]);

  const categories = categoryRows.map(({ id: categoryId, name }) => ({
    id: categoryId,
    name,
  }));

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <MonthReportView
        key={`${report.id}-${report.updatedAt.getTime()}-${validation.dateFrom}-${validation.dateTo}`}
        mode="edit"
        reportId={report.id}
        savedReport={report}
        listParams={{
          dateFrom: validation.dateFrom,
          dateTo: validation.dateTo,
        }}
        initialTitle={report.name}
        categoryTotals={categoryTotals}
        spendingCategoryAverages={spendingCategoryAverages}
        bpiBalanceBeforeIncome={bpiBalanceBeforeIncome}
        categories={categories}
      />
    </div>
  );
}
