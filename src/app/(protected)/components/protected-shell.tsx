'use client';

import { AppSidebar } from '@/app/(protected)/components/app-sidebar';
import { ProtectedBreadcrumbs } from '@/app/(protected)/components/protected-breadcrumbs';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

type ProtectedShellProps = {
  children: React.ReactNode;
  userName: string | null | undefined;
  userEmail: string | null | undefined;
  userImage: string | null | undefined;
};

export function ProtectedShell({
  children,
  userName,
  userEmail,
  userImage,
}: ProtectedShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div
              aria-hidden="true"
              className="h-4 w-px shrink-0 bg-border"
            />
          </div>
          <ProtectedBreadcrumbs />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
