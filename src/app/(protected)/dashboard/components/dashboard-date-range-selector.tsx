'use client';

import { ChevronDownIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DASHBOARD_DATE_RANGE_PRESETS,
  type DashboardDateRangePreset,
  getDashboardDateRangePresetLabel,
} from '@/lib/dashboard/dashboard-date-range';

type DashboardDateRangeSelectorProps = {
  value: DashboardDateRangePreset;
  onValueChange: (value: DashboardDateRangePreset) => void;
};

export function DashboardDateRangeSelector({
  value,
  onValueChange,
}: DashboardDateRangeSelectorProps) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-3xl px-3 text-xs md:hidden"
          >
            {getDashboardDateRangePresetLabel(value)}
            <ChevronDownIcon className="size-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(nextValue) =>
              onValueChange(nextValue as DashboardDateRangePreset)
            }
          >
            {DASHBOARD_DATE_RANGE_PRESETS.map((preset) => (
              <DropdownMenuRadioItem key={preset.id} value={preset.id}>
                {preset.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Tabs
        value={value}
        onValueChange={(nextValue) =>
          onValueChange(nextValue as DashboardDateRangePreset)
        }
        className="hidden md:block"
      >
        <TabsList className="h-8">
          {DASHBOARD_DATE_RANGE_PRESETS.map((preset) => (
            <TabsTrigger
              key={preset.id}
              value={preset.id}
              className="h-7 px-3 text-sm"
            >
              {preset.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </>
  );
}
