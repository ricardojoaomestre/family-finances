'use client';

import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

type ProtectedPageContextValue = {
  title: string | null;
  setTitle: (title: string | null) => void;
  description: React.ReactNode | null;
  setDescription: (description: React.ReactNode | null) => void;
  actions: React.ReactNode | null;
  setActions: (actions: React.ReactNode | null) => void;
};

const ProtectedPageContext = createContext<ProtectedPageContextValue | null>(
  null,
);

export function ProtectedPageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [title, setTitle] = useState<string | null>(null);
  const [description, setDescription] = useState<React.ReactNode | null>(null);
  const [actions, setActions] = useState<React.ReactNode | null>(null);

  return (
    <ProtectedPageContext.Provider
      value={{
        title,
        setTitle,
        description,
        setDescription,
        actions,
        setActions,
      }}
    >
      {children}
    </ProtectedPageContext.Provider>
  );
}

export function useProtectedPage() {
  const context = useContext(ProtectedPageContext);
  if (!context) {
    throw new Error('useProtectedPage must be used within ProtectedPageProvider');
  }
  return context;
}

type SetPageTitleProps = {
  title: string;
};

export function SetPageTitle({ title }: SetPageTitleProps) {
  const { setTitle } = useProtectedPage();

  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [setTitle, title]);

  return null;
}

type SetPageHeaderProps = {
  description?: React.ReactNode;
  actions?: React.ReactNode;
};

export function SetPageHeader({ description, actions }: SetPageHeaderProps) {
  const { setDescription, setActions } = useProtectedPage();

  useEffect(() => {
    setDescription(description ?? null);
    setActions(actions ?? null);
    return () => {
      setDescription(null);
      setActions(null);
    };
  }, [description, actions, setDescription, setActions]);

  return null;
}

export function ProtectedPageReset() {
  const pathname = usePathname();
  const { setTitle, setDescription, setActions } = useProtectedPage();

  useEffect(() => {
    setTitle(null);
    setDescription(null);
    setActions(null);
  }, [pathname, setTitle, setDescription, setActions]);

  return null;
}
