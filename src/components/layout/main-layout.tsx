import { SpaceBackground } from '@/components/layout/space-background';
import { SiteHeader } from '@/components/layout/site-header';
import { AdminFloatingButton } from '@/components/layout/admin-floating-button';
import { SiteFooter } from '@/components/layout/site-footer';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col">
      <SpaceBackground />
      <SiteHeader />
      <main className="relative z-10 flex-1 page-enter">{children}</main>
      <SiteFooter />
      <AdminFloatingButton />
    </div>
  );
}
