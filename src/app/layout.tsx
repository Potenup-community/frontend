import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "PotenUp",
  description: "PotenUp Community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          {children}
          <Toaster />
          <Sonner position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
