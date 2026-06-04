import { auth } from '@/auth';
import { ProtectedShell } from '@/app/(protected)/components/protected-shell';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    const headersList = await headers();
    const pathname =
      headersList.get('x-pathname') ??
      headersList.get('next-url')?.split('?')[0] ??
      '/dashboard';
    redirect(
      `/sign-in?callbackUrl=${encodeURIComponent(pathname)}`
    );
  }

  return (
    <ProtectedShell
      userName={session.user.name}
      userEmail={session.user.email}
      userImage={session.user.image}
    >
      {children}
    </ProtectedShell>
  );
}
