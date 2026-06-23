'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonTable } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { formatDate } from '@/lib/utils';
import { ds } from '@/styles/design-system';

type GraduationReview = {
  id: string;
  authorName: string;
  className: string;
  content: string;
  createdAt: string;
};

export default function AdminGraduationReviewsPage() {
  const [items, setItems] = useState<GraduationReview[]>([]);
  const [selected, setSelected] = useState<GraduationReview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/graduation-reviews')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setItems(d);
        setLoading(false);
      });
  }, []);

  return (
    <div className={ds.pageGap}>
      <AdminPageHeader title="졸업후기 관리" description="학생들이 작성한 졸업후기를 확인합니다." />
      {loading ? (
        <SkeletonTable rows={5} />
      ) : (
        <DataTable
          data={items}
          keyExtractor={(r) => r.id}
          emptyTitle="등록된 졸업후기가 없습니다"
          columns={[
            { key: 'author', header: '작성자', cell: (r) => r.authorName },
            { key: 'class', header: '반', cell: (r) => <span className="text-primary">{r.className}</span> },
            {
              key: 'content',
              header: '내용',
              cell: (r) => <p className="line-clamp-2 text-muted-foreground">{r.content}</p>,
            },
            {
              key: 'date',
              header: '작성일',
              cell: (r) => <span className="text-muted-foreground">{formatDate(r.createdAt)}</span>,
            },
            {
              key: 'action',
              header: '상세',
              mobileFooter: true,
              cell: (r) => (
                <Button size="sm" variant="ghost" className="text-primary" onClick={() => setSelected(r)}>
                  보기
                </Button>
              ),
            },
          ]}
        />
      )}
      {selected && (
        <Card className={`${ds.card} ${ds.cardPad}`}>
          <div className="space-y-4">
            <h2 className={ds.sectionTitle}>
              {selected.authorName} · {selected.className}
            </h2>
            <p className={ds.caption}>{formatDate(selected.createdAt)}</p>
            <div>
              <p className={ds.caption}>후기 내용</p>
              <p className="text-sm text-foreground whitespace-pre-wrap mt-1">{selected.content}</p>
            </div>
            <button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setSelected(null)}>
              닫기
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
