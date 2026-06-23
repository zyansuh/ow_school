'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';

export default function LoginPage() {
  return (
    <MainLayout>
      <div className="page-container py-20 flex justify-center">
        <Card className="bg-gray-900/80 border-gray-800 w-full max-w-md">
          <div className="card-pad text-center space-y-6">
            <h1 className="text-2xl font-bold text-gray-100">Discord 로그인</h1>
            <p className="text-gray-400 text-sm">OW School은 Discord 계정으로만 로그인할 수 있습니다.</p>
            <Button className="w-full" size="lg" onClick={() => signIn('discord', { callbackUrl: '/' })}>
              Discord로 계속하기
            </Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
