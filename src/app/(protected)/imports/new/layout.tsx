import { ImportsMobileGuard } from '@/app/(protected)/imports/components/imports-mobile-guard';

type NewImportLayoutProps = {
  children: React.ReactNode;
};

export default function NewImportLayout({ children }: NewImportLayoutProps) {
  return <ImportsMobileGuard>{children}</ImportsMobileGuard>;
}
