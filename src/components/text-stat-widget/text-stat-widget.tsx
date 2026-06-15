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

type TextStatWidgetRootProps = {
  label?: string;
  className?: string;
  children: ReactNode;
};

function TextStatWidgetRoot({
  label,
  className,
  children,
}: TextStatWidgetRootProps) {
  return (
    <article
      data-slot="text-stat-widget"
      aria-label={label}
      className={cn(
        'group/text-stat-widget grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 rounded-4xl border p-3 shadow-xs md:flex md:flex-col md:items-stretch md:gap-4 md:p-5',
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
      className={cn(
        'col-span-2 flex w-full items-start gap-2.5 md:col-span-1',
        className,
      )}
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
        'text-sm font-semibold tracking-tight text-foreground/90',
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
      className={cn('hidden text-xs text-muted-foreground md:block', className)}
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
    <Icon
      data-slot="text-stat-widget-icon"
      className={cn(
        'mt-0.5 size-3.5 shrink-0 text-muted-foreground md:size-4',
        className,
      )}
      aria-hidden
    />
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
      className={cn('min-w-0 flex-1 md:flex md:flex-col md:gap-3', className)}
    >
      {children}
    </div>
  );
}

type TextStatWidgetValueProps = {
  value: string | number | null | undefined;
  className?: string;
  colorize?: boolean;
  size?: 'default' | 'sm';
};

function TextStatWidgetValue({
  value,
  className,
  colorize = false,
  size = 'default',
}: TextStatWidgetValueProps) {
  return (
    <p
      data-slot="text-stat-widget-value"
      className={cn(
        'font-mono tracking-tight tabular-nums',
        size === 'default'
          ? 'text-2xl font-semibold md:text-3xl lg:text-4xl'
          : 'text-base font-medium',
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
        'flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 md:mt-auto md:w-full md:border-t md:border-border/50 md:pt-3',
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
      className={cn('hidden text-xs text-muted-foreground md:inline', className)}
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
        'grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 rounded-4xl border p-3 shadow-xs md:flex md:flex-col md:items-stretch md:gap-4 md:p-5',
        widgetSurfaceClass,
        className,
      )}
    >
      <div className="col-span-2 flex w-full items-start gap-2.5 md:col-span-1">
        <Skeleton className="mt-0.5 size-3.5 shrink-0 md:size-4" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-8 w-28 md:h-10 md:w-36" />
      <div className="flex shrink-0 items-center gap-2 md:col-span-1 md:mt-auto md:w-full md:border-t md:border-border/50 md:pt-3">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="hidden h-3 w-24 md:block" />
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
