import type { CategorySpendingAverageContext } from '@/lib/reports/build-category-spending-vs-average-rows';
import { SPENDING_VS_AVERAGE_PRIOR_MONTHS } from '@/lib/reports/spending-vs-average-months';
import { formatDisplayMoney } from '@/lib/formatters';

type MonthReportCategoryAverageBreakdownProps = {
  context: CategorySpendingAverageContext;
};

export function MonthReportCategoryAverageBreakdown({
  context,
}: MonthReportCategoryAverageBreakdownProps) {
  const monthCount = context.priorMonths.length;

  return (
    <section className="space-y-3 border-t pt-4">
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Average calculation</h3>
        <p className="text-sm text-muted-foreground">
          The average compares this month to the mean of monthly totals from
          the {SPENDING_VS_AVERAGE_PRIOR_MONTHS} calendar months before this
          report. Only months where this category had spending are included.
        </p>
      </div>

      {monthCount === 0 ? (
        <p className="text-sm text-muted-foreground">
          No prior months with spending in that window, so no average is shown.
        </p>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2">
            {context.priorMonths.map((month) => (
              <li
                key={month.monthDateFrom}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span>{month.monthLabel}</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {formatDisplayMoney(month.amount)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t pt-3 text-sm">
            <span className="font-medium">
              Average
              <span className="font-normal text-muted-foreground">
                {' '}
                ({monthCount} {monthCount === 1 ? 'month' : 'months'})
              </span>
            </span>
            <span className="font-mono tabular-nums font-medium">
              {context.hasBaseline && context.averageAmount
                ? formatDisplayMoney(context.averageAmount)
                : '—'}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
