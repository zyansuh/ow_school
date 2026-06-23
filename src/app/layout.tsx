import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SessionProvider } from '@/components/providers/session-provider';
import { Toaster } from 'sonner';
import './globals.css';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site-brand';

const siteUrl = process.env.NEXTAUTH_URL || 'https://ow-school.vercel.app';

export const metadata: Metadata = {
  title: `${SITE_NAME} | ${SITE_TAGLINE}`,
  description: '게임 멘토링 클래스 · 수강 신청 · 선생님 관리 · 졸업면담',
  icons: { icon: '/images/logo/logo-peaceful-gaming-village.webp', apple: '/images/logo/logo-peaceful-gaming-village.webp' },
  openGraph: {
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: '수달반 · 사자반 · 여우반 게임 멘토링 클래스',
    url: siteUrl,
    siteName: SITE_NAME,
    images: [{ url: `${siteUrl}/images/logo/logo-peaceful-gaming-village.webp`, width: 256, height: 256 }],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: '게임 멘토링 클래스 플랫폼',
    images: [`${siteUrl}/images/logo/logo-peaceful-gaming-village.webp`],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SessionProvider>
            {children}
            <Toaster theme="dark" position="top-center" richColors />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
