'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ThemeModeToggle } from '@/components/theme-mode-toggle';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  isProtectedNavItemActive,
  protectedMainNavItems,
  protectedSettingsNavItems,
} from '@/lib/navigation/protected-nav-config';
import type { UserHousehold } from '@/lib/household/get-households-for-user';

import { AppSidebarFooter } from './app-sidebar-footer';
import { HouseholdSwitcher } from './household-switcher';

type AppSidebarProps = {
  userName: string | null | undefined;
  userEmail: string | null | undefined;
  userImage: string | null | undefined;
  households: UserHousehold[];
  activeHouseholdId: string;
};

export function AppSidebar({
  userName,
  userEmail,
  userImage,
  households,
  activeHouseholdId,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="h-14 shrink-0 justify-center gap-0 border-b border-sidebar-border px-2 py-0">
        <div className="flex h-full w-full items-center gap-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-2">
          <SidebarMenu className="min-w-0 flex-1 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:flex-none">
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/dashboard">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                    F
                  </span>
                  <span className="truncate font-semibold">Family Finances</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <ThemeModeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <HouseholdSwitcher
              households={households}
              activeHouseholdId={activeHouseholdId}
            />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {protectedMainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isProtectedNavItemActive(pathname, item);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {protectedSettingsNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isProtectedNavItemActive(pathname, item);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <AppSidebarFooter
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
      />
    </Sidebar>
  );
}
