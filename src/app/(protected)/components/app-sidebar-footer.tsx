'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import { SignOutButton } from './sign-out-button';

type AppSidebarFooterProps = {
  userName: string | null | undefined;
  userEmail: string | null | undefined;
  userImage: string | null | undefined;
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
}: AppSidebarFooterProps) {
  const displayName = userName ?? userEmail ?? 'User';

  return (
    <SidebarFooter className="gap-3 border-t border-sidebar-border p-3">
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 px-1 py-1">
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
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              {userEmail ? (
                <p className="truncate text-xs text-muted-foreground">
                  {userEmail}
                </p>
              ) : null}
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
      <SignOutButton />
    </SidebarFooter>
  );
}
