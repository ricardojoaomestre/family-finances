'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { CheckIcon, ChevronsUpDownIcon, HousePlusIcon } from 'lucide-react';

import { setActiveHousehold } from '@/app/(protected)/actions/set-active-household';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { UserHousehold } from '@/lib/household/get-households-for-user';

type HouseholdSwitcherProps = {
  households: UserHousehold[];
  activeHouseholdId: string;
};

export function HouseholdSwitcher({
  households,
  activeHouseholdId,
}: HouseholdSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const active =
    households.find((household) => household.id === activeHouseholdId) ??
    households[0];

  function handleSelect(householdId: string) {
    setOpen(false);

    if (householdId === activeHouseholdId) {
      return;
    }

    startTransition(async () => {
      const result = await setActiveHousehold(householdId);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              disabled={isPending}
              className="data-[state=open]:bg-sidebar-accent"
              tooltip={active?.name ?? 'Household'}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                {(active?.name ?? '?').slice(0, 1).toUpperCase()}
              </span>
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">
                  {active?.name ?? 'Household'}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {active?.role === 'owner' ? 'Owner' : 'Member'}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 opacity-60" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Households
            </DropdownMenuLabel>
            {households.map((household) => (
              <DropdownMenuItem
                key={household.id}
                onSelect={() => handleSelect(household.id)}
              >
                <span className="truncate">{household.name}</span>
                {household.id === activeHouseholdId ? (
                  <CheckIcon className="ml-auto size-4" />
                ) : null}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                setOpen(false);
                router.push('/settings/household');
              }}
            >
              <HousePlusIcon className="size-4" />
              Manage households
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
