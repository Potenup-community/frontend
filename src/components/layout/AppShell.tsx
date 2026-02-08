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
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 ${isMobile ? '' : 'max-w-[1680px]'}`}>
        <div className="flex gap-6 lg:gap-12">
          {showSidebar && !isMobile && (
            <div className="[filter:drop-shadow(2px_0_6px_rgba(0,0,0,0.04))] dark:[filter:drop-shadow(2px_0_6px_rgba(0,0,0,0.2))]">
              <Sidebar />
            </div>
          )}

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