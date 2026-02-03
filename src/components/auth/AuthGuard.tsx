'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/signin', '/signup'];

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname?.startsWith(route)
  );

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isPublicRoute) {
        // Not authenticated and trying to access protected route
        // Save the intended destination for redirect after login
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('redirectAfterLogin', pathname || '/');
        }
        router.replace('/signin');
      } else if (isAuthenticated && isPublicRoute) {
        // Already authenticated but on public route (signin/signup)
        // Redirect to saved destination or home
        let redirectTo = '/';
        if (typeof window !== 'undefined') {
          redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/';
          sessionStorage.removeItem('redirectAfterLogin');
        }
        router.replace(redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, isPublicRoute, router, pathname]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (!isAuthenticated && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}