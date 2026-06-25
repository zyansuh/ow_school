export type ContentImageInput = {
  url: string;
  sortOrder: number;
};

export type ContentPostListItem = {
  id: string;
  title: string;
  summary: string;
  thumbnailUrl: string | null;
  createdAt: string;
};

export type ContentPostDetail = ContentPostListItem & {
  body: string;
  images: ContentImageInput[];
  updatedAt: string;
  published: boolean;
};

export const CONTENT_FEED_PAGE_SIZE = 12;
