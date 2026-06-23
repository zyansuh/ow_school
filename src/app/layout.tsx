import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SessionProvider } from '@/components/providers/session-provider';
import { Toaster } from 'sonner';
import './globals.css';

const siteUrl = process.env.NEXTAUTH_URL || 'https://ow-school.vercel.app';

export const metadata: Metadata = {
  title: 'OW School | 평화로운 게임마을',
  description: '게임 멘토링 클래스 · 수강 신청 · 선생님 관리 · 졸업면담',
  icons: { icon: '/images/logo/logo-peaceful-gaming-village.png', apple: '/images/logo/logo-peaceful-gaming-village.png' },
  openGraph: {
    title: 'OW School | 평화로운 게임마을',
    description: '수달반 · 사자반 · 여우반 게임 멘토링 클래스',
    url: siteUrl,
    siteName: 'OW School',
    images: [{ url: `${siteUrl}/images/logo/logo-peaceful-gaming-village.png`, width: 512, height: 512 }],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'OW School | 평화로운 게임마을',
    description: '게임 멘토링 클래스 플랫폼',
    images: [`${siteUrl}/images/logo/logo-peaceful-gaming-village.png`],
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
