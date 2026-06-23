import { MainLayout } from '@/components/layout/main-layout';
import { HomeContent } from '@/components/pages/home-content';
import { InterviewFab } from '@/components/home/interview-fab';

export const revalidate = 60;

export default function HomePage() {
  return (
    <MainLayout>
      <HomeContent />
      <InterviewFab />
    </MainLayout>
  );
}
