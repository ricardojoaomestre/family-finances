'use client';

import { useEffect, useRef } from 'react';

import { triggerLinkedAccountSync } from '@/app/(protected)/settings/accounts/actions/bank-connection-actions';

export function BankSyncOnLoad() {
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) {
      return;
    }

    triggered.current = true;
    void triggerLinkedAccountSync();
  }, []);

  return null;
}
