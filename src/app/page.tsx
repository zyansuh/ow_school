import { MainLayout } from '@/components/layout/main-layout';
import { HomeContent } from '@/components/pages/home-content';

export { dynamic } from '@/lib/segment';

export default function HomePage() {
  return (
    <MainLayout>
      <HomeContent />
    </MainLayout>
  );
}
