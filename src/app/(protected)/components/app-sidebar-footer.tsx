'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  CheckIcon,
  ChevronsUpDownIcon,
  HousePlusIcon,
  LogOutIcon,
} from 'lucide-react';

import { setActiveHousehold } from '@/app/(protected)/actions/set-active-household';
import { signOutAction } from '@/app/(protected)/actions/sign-out';
import { ThemeModeMenuSubmenu } from '@/components/theme-mode-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { UserHousehold } from '@/lib/household/get-households-for-user';

type AppSidebarFooterProps = {
  userName: string | null | undefined;
  userEmail: string | null | undefined;
  userImage: string | null | undefined;
  households: UserHousehold[];
  activeHouseholdId: string;
};

function getUserInitials(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  const source = name?.trim() || email?.trim() || '?';
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function AppSidebarFooter({
  userName,
  userEmail,
  userImage,
  households,
  activeHouseholdId,
}: AppSidebarFooterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const displayName = userName ?? userEmail ?? 'User';

  function handleHouseholdSelect(householdId: string) {
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
    <SidebarFooter className="border-t border-sidebar-border p-3">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                disabled={isPending}
                className="data-[state=open]:bg-sidebar-accent"
                tooltip={displayName}
              >
                <Avatar size="sm">
                  {userImage ? (
                    <AvatarImage
                      src={userImage}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <AvatarFallback>
                    {getUserInitials(userName, userEmail)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-medium">
                    {displayName}
                  </span>
                  {userEmail ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {userEmail}
                    </span>
                  ) : null}
                </div>
                <ChevronsUpDownIcon className="ml-auto size-4 opacity-60" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Households
              </DropdownMenuLabel>
              {households.map((household) => (
                <DropdownMenuItem
                  key={household.id}
                  onSelect={() => handleHouseholdSelect(household.id)}
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
              <DropdownMenuSeparator />
              <ThemeModeMenuSubmenu />
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  void signOutAction();
                }}
              >
                <LogOutIcon className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
