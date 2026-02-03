'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const pathname = usePathname();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", pathname);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-muted flex items-center justify-center">
          <span className="text-4xl font-bold text-muted-foreground">404</span>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">페이지를 찾을 수 없습니다</h1>
        <p className="text-muted-foreground mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            이전 페이지
          </Button>
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              홈으로 가기
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
