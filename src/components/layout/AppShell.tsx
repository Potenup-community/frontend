'use client';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { FloatingNav } from './FloatingNav';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppShellProps {
  showSidebar?: boolean;
  children?: React.ReactNode;
}

export function AppShell({ showSidebar = true, children }: AppShellProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* PC: Wide centered layout with sidebar | Mobile: Full width compact layout */}
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 ${isMobile ? '' : 'max-w-7xl'}`}>
        <div className="flex gap-6 lg:gap-10">
          {showSidebar && !isMobile && <Sidebar />}
          
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <FloatingNav />}
    </div>
  );
}