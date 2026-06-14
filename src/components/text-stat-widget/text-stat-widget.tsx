'use client';

import {
  ArrowDownIcon,
  ArrowUpIcon,
  MinusIcon,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { getMoneyValueColorClass } from '@/components/data-table/table-money-cell';
import { Skeleton } from '@/components/ui/skeleton';
import type { MonthOverMonthTrend } from '@/lib/dashboard/compute-month-over-month-trend';
import { formatDisplayMoney } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const widgetSurfaceClass = 'border-border bg-card';
const widgetIconClass =
  'bg-muted text-muted-foreground ring-border/60';

type TextStatWidgetRootProps = {
  className?: string;
  children: ReactNode;
};

function TextStatWidgetRoot({
  className,
  children,
}: TextStatWidgetRootProps) {
  return (
    <article
      data-slot="text-stat-widget"
      className={cn(
        'group/text-stat-widget flex flex-col gap-4 rounded-4xl border p-5 shadow-xs',
        widgetSurfaceClass,
        className,
      )}
    >
      {children}
    </article>
  );
}

type TextStatWidgetHeaderProps = {
  className?: string;
  children: ReactNode;
};

function TextStatWidgetHeader({
  className,
  children,
}: TextStatWidgetHeaderProps) {
  return (
    <div
      data-slot="text-stat-widget-header"
      className={cn('flex items-start justify-between gap-3', className)}
    >
      {children}
    </div>
  );
}

type TextStatWidgetHeadingProps = {
  className?: string;
  children: ReactNode;
};

function TextStatWidgetHeading({
  className,
  children,
}: TextStatWidgetHeadingProps) {
  return (
    <div data-slot="text-stat-widget-heading" className={cn('min-w-0', className)}>
      {children}
    </div>
  );
}

type TextStatWidgetTitleProps = {
  className?: string;
  children: ReactNode;
};

function TextStatWidgetTitle({ className, children }: TextStatWidgetTitleProps) {
  return (
    <p
      data-slot="text-stat-widget-title"
      className={cn(
        'text-sm font-medium tracking-tight text-foreground/90',
        className,
      )}
    >
      {children}
    </p>
  );
}

type TextStatWidgetDescriptionProps = {
  className?: string;
  children: ReactNode;
};

function TextStatWidgetDescription({
  className,
  children,
}: TextStatWidgetDescriptionProps) {
  return (
    <p
      data-slot="text-stat-widget-description"
      className={cn('text-xs text-muted-foreground', className)}
    >
      {children}
    </p>
  );
}

type TextStatWidgetIconProps = {
  icon: LucideIcon;
  className?: string;
};

function TextStatWidgetIcon({
  icon: Icon,
  className,
}: TextStatWidgetIconProps) {
  return (
    <div
      data-slot="text-stat-widget-icon"
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset',
        widgetIconClass,
        className,
      )}
    >
      <Icon className="size-4.5" aria-hidden />
    </div>
  );
}

type TextStatWidgetBodyProps = {
  className?: string;
  children: ReactNode;
};

function TextStatWidgetBody({ className, children }: TextStatWidgetBodyProps) {
  return (
    <div
      data-slot="text-stat-widget-body"
      className={cn('flex flex-col gap-3', className)}
    >
      {children}
    </div>
  );
}

type TextStatWidgetValueProps = {
  value: string | number | null | undefined;
  className?: string;
  colorize?: boolean;
};

function TextStatWidgetValue({
  value,
  className,
  colorize = false,
}: TextStatWidgetValueProps) {
  return (
    <p
      data-slot="text-stat-widget-value"
      className={cn(
        'font-mono text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl',
        colorize ? getMoneyValueColorClass(value) : 'text-foreground',
        className,
      )}
    >
      {formatDisplayMoney(value)}
    </p>
  );
}

type TextStatWidgetFooterProps = {
  className?: string;
  children: ReactNode;
};

function TextStatWidgetFooter({
  className,
  children,
}: TextStatWidgetFooterProps) {
  return (
    <div
      data-slot="text-stat-widget-footer"
      className={cn(
        'mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border/50 pt-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

type TextStatWidgetTrendProps = {
  trend: MonthOverMonthTrend;
  invertColors?: boolean;
  className?: string;
};

function TextStatWidgetTrend({
  trend,
  invertColors = false,
  className,
}: TextStatWidgetTrendProps) {
  if (trend.kind === 'hidden') {
    return null;
  }

  if (trend.kind === 'flat') {
    return (
      <span
        data-slot="text-stat-widget-trend"
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground',
          className,
        )}
      >
        <MinusIcon className="size-3" aria-hidden />
        <span>No change</span>
      </span>
    );
  }

  const isUp = trend.kind === 'up';
  const isPositiveColor = invertColors ? !isUp : isUp;

  return (
    <span
      data-slot="text-stat-widget-trend"
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-semibold tabular-nums',
        isPositiveColor ? 'text-success' : 'text-destructive',
        className,
      )}
    >
      {isUp ? (
        <ArrowUpIcon className="size-3 shrink-0" aria-hidden />
      ) : (
        <ArrowDownIcon className="size-3 shrink-0" aria-hidden />
      )}
      {trend.percent % 1 === 0 ? trend.percent : trend.percent.toFixed(1)}%
    </span>
  );
}

type TextStatWidgetComparisonLabelProps = {
  className?: string;
  children: ReactNode;
};

function TextStatWidgetComparisonLabel({
  className,
  children,
}: TextStatWidgetComparisonLabelProps) {
  return (
    <span
      data-slot="text-stat-widget-comparison-label"
      className={cn('text-xs text-muted-foreground', className)}
    >
      {children}
    </span>
  );
}

type TextStatWidgetSkeletonProps = {
  className?: string;
};

function TextStatWidgetSkeleton({ className }: TextStatWidgetSkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'rounded-4xl border p-5 shadow-xs',
        widgetSurfaceClass,
        className,
      )}
    >
      <div className="relative flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="size-10 rounded-2xl" />
        </div>
        <Skeleton className="h-10 w-36" />
        <div className="flex items-center gap-2 border-t border-border/50 pt-3">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

export const TextStatWidget = Object.assign(TextStatWidgetRoot, {
  Header: TextStatWidgetHeader,
  Heading: TextStatWidgetHeading,
  Title: TextStatWidgetTitle,
  Description: TextStatWidgetDescription,
  Icon: TextStatWidgetIcon,
  Body: TextStatWidgetBody,
  Value: TextStatWidgetValue,
  Footer: TextStatWidgetFooter,
  Trend: TextStatWidgetTrend,
  ComparisonLabel: TextStatWidgetComparisonLabel,
  Skeleton: TextStatWidgetSkeleton,
});
