import { MainLayout } from '@/components/layout/main-layout';
import { ContentFeed } from '@/components/contents/content-feed';
import { ds } from '@/styles/design-system';

export const metadata = {
  title: '컨텐츠 소개',
  description: '평화로운 게임마을에서 운영하는 각종 컨텐츠를 소개합니다.',
};

export default function ContentsPage() {
  return (
    <MainLayout>
      <div className="page-container py-10 sm:py-14 section-gap">
        <header className="space-y-3 max-w-3xl">
          <h1 className={ds.title}>컨텐츠 소개</h1>
          <p className={`${ds.subtitle} break-words [overflow-wrap:anywhere] leading-relaxed`}>
            신규 컨텐츠, 이벤트, 수업 방식, 멘토링, 디스코드 가이드 등 평겜마의 다양한 소식을 확인하세요.
          </p>
        </header>
        <ContentFeed />
      </div>
    </MainLayout>
  );
}
