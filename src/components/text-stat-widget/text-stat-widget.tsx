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
        'group/text-stat-widget grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-3 rounded-4xl border p-3 shadow-xs md:flex md:flex-col md:items-stretch md:gap-5 md:p-5',
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
        'col-start-1 row-start-1 flex w-full min-w-0 items-start gap-2.5 md:col-auto md:row-auto',
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
    <div
      data-slot="text-stat-widget-heading"
      className={cn('min-w-0 flex-1', className)}
    >
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
  showOnMobile?: boolean;
  children: ReactNode;
};

function TextStatWidgetDescription({
  className,
  showOnMobile = false,
  children,
}: TextStatWidgetDescriptionProps) {
  return (
    <div
      data-slot="text-stat-widget-description"
      className={cn(
        'text-xs text-muted-foreground',
        showOnMobile ? 'block md:hidden' : 'hidden md:block',
        className,
      )}
    >
      {children}
    </div>
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
      className={cn(
        'col-span-2 row-start-2 min-w-0 md:col-auto md:row-auto md:flex md:flex-1 md:flex-col md:gap-3',
        className,
      )}
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
  placement?: 'body' | 'footer';
};

function TextStatWidgetValue({
  value,
  className,
  colorize = false,
  size = 'default',
  placement = 'body',
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
        placement === 'footer' &&
          'col-start-2 row-start-2 shrink-0 self-center md:col-auto md:row-auto md:self-auto',
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
        'contents md:mt-auto md:flex md:w-full md:flex-wrap md:items-center md:gap-x-2 md:gap-y-1 md:border-t md:border-border/50 md:pt-3',
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
  placement?: 'footer' | 'inline';
  className?: string;
};

function TextStatWidgetTrend({
  trend,
  invertColors = false,
  placement = 'footer',
  className,
}: TextStatWidgetTrendProps) {
  if (trend.kind === 'hidden') {
    return null;
  }

  const mobileHeaderPlacementClass =
    placement === 'footer'
      ? 'col-start-2 row-start-1 shrink-0 self-center md:col-auto md:row-auto md:self-auto'
      : null;

  if (trend.kind === 'flat') {
    return (
      <span
        data-slot="text-stat-widget-trend"
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground',
          mobileHeaderPlacementClass,
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
        mobileHeaderPlacementClass,
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
        'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-3 rounded-4xl border p-3 shadow-xs md:flex md:flex-col md:items-stretch md:gap-5 md:p-5',
        widgetSurfaceClass,
        className,
      )}
    >
      <div className="col-start-1 row-start-1 flex w-full min-w-0 items-start gap-2.5 md:col-auto md:row-auto">
        <Skeleton className="mt-0.5 size-3.5 shrink-0 md:size-4" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="col-span-2 row-start-2 h-8 w-28 md:col-auto md:row-auto md:h-10 md:w-36" />
      <div className="contents md:mt-auto md:flex md:w-full md:items-center md:gap-2 md:border-t md:border-border/50 md:pt-3">
        <Skeleton className="col-start-2 row-start-1 h-5 w-14 shrink-0 self-center rounded-full md:col-auto md:row-auto md:self-auto" />
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
