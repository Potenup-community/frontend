'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import ReactGoogleProvider from "@/providers/ReactGoogleProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ReactGoogleProvider>
        <AuthProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </AuthProvider>
      </ReactGoogleProvider>
    </QueryClientProvider>
  );
}
