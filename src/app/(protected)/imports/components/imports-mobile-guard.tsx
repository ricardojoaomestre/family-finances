'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';

type ImportsMobileGuardProps = {
  children: ReactNode;
};

export function ImportsMobileGuard({ children }: ImportsMobileGuardProps) {
  const isMobile = useIsMobile();
  const router = useRouter();

  useEffect(() => {
    if (isMobile) {
      router.replace('/imports');
    }
  }, [isMobile, router]);

  if (isMobile) {
    return null;
  }

  return children;
}
