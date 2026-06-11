'use client';

import { AppSidebar } from '@/app/(protected)/components/app-sidebar';
import {
  ProtectedPageProvider,
  ProtectedPageReset,
} from '@/app/(protected)/components/protected-page-context';
import { ProtectedTopBar } from '@/app/(protected)/components/protected-top-bar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

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
    <ProtectedPageProvider>
      <SidebarProvider>
        <AppSidebar
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
        />
        <SidebarInset>
          <ProtectedTopBar />
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
            <ProtectedPageReset />
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedPageProvider>
  );
}
