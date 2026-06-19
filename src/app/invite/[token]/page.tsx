import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { AcceptInvite } from '@/app/invite/[token]/components/accept-invite';

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <AcceptInvite token={token} />
    </div>
  );
}
